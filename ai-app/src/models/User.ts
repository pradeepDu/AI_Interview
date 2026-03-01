import mongoose, { Schema, Model } from 'mongoose';
import type { User } from '@/types';

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true },
    position: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    current: { type: Boolean, default: false },
  },
  { _id: false } // fix #1 — no unwanted _id on subdocs
);

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    techStack: [{ type: String }],
    link: { type: String },
  },
  { _id: false } // fix #1
);

const UserProfileSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    company: { type: String },
    designation: { type: String },   // HR: job title e.g. "Talent Acquisition Manager"
    department: { type: String },    // HR: e.g. "Human Resources"
    resumeUrl: { type: String },
    profilePictureUrl: { type: String },
    skills: [{ type: String }],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    extracurriculars: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<User>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true }, // fix #6
    role: {
      type: String,
      enum: ['job_seeker', 'hr'],
      required: true,
    },
    profile: { type: UserProfileSchema }, // fix #3 — no longer required
    profileComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Helper to calculate profile completion — reusable across hooks
function calculateProfileComplete(role: string, profile?: User['profile']): boolean {
  if (role !== 'job_seeker') return true;

  const requiredFields = [
    profile?.name,
    profile?.phone,
    profile?.resumeUrl,
    (profile?.skills?.length ?? 0) > 0,       // fix #4 — safe optional chaining
    (profile?.experience?.length ?? 0) > 0,    // fix #4
  ];

  return requiredFields.every(Boolean);
}

// fix #5 — async hook, no next() needed
// fix #2 — covers both save and findOneAndUpdate
UserSchema.pre('save', async function () {
  this.profileComplete = calculateProfileComplete(this.role, this.profile);
});

UserSchema.pre('findOneAndUpdate', async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  if (!doc) return;

  const update = this.getUpdate() as Partial<User> | null;

  // Merge existing doc with incoming update to get the latest state
  const mergedProfile = {
    ...doc.profile,
    ...(update?.profile ?? {}),
  };

  const mergedRole = update?.role ?? doc.role;

  this.setUpdate({
    ...update,
    profileComplete: calculateProfileComplete(mergedRole, mergedProfile),
  });
});

export const UserModel: Model<User> =
  mongoose.models.User || mongoose.model<User>('User', UserSchema);

export default UserModel;
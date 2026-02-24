import mongoose, { Schema, Model } from 'mongoose';
import type { Job } from '@/types';

const JobSchema = new Schema<Job>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String, required: true }],
    department: { type: String, required: true },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior'],
      required: true,
    },
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    deadline: { type: Date, required: true },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ status: 1, deadline: 1 });
JobSchema.index({ requiredSkills: 1 });

export const JobModel: Model<Job> =
  mongoose.models.Job || mongoose.model<Job>('Job', JobSchema);

export default JobModel;

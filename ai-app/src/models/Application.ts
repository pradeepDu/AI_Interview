import mongoose, { Schema, Model } from 'mongoose';
import type { Application } from '@/types';

const ApplicationSchema = new Schema<Application>(
  {
    jobId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true,
      index: true
    },
    candidateId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    interviewId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Interview', 
      required: true 
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'rejected'],
      default: 'submitted',
      index: true
    },
    aiSummary: {
      overallScore: { type: Number, min: 0, max: 10 },
      strengths: [{ type: String }],
      concerns: [{ type: String }],
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Composite index for filtering applications by job and status
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ candidateId: 1, status: 1 });

export const ApplicationModel: Model<Application> =
  mongoose.models.Application || mongoose.model<Application>('Application', ApplicationSchema);

export default ApplicationModel;

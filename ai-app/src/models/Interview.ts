import mongoose, { Schema, Model } from 'mongoose';
import type { Interview, InterviewQuestion } from '@/types';

const QuestionEvaluationSchema = new Schema({
  score: { type: Number, min: 0, max: 10, required: true },
  feedback: { type: String, required: true },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
});

const InterviewQuestionSchema = new Schema<InterviewQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['technical', 'scenario', 'behavioral'],
    required: true,
  },
  prepTime: { type: Number, required: true },
  answerTime: { type: Number, required: true },
  recordingUrl: { type: String },
  transcript: { type: String },
  evaluation: QuestionEvaluationSchema,
});

const InterviewSchema = new Schema<Interview>(
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
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
      default: 'not_started',
      index: true
    },
    questions: [InterviewQuestionSchema],
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const InterviewModel: Model<Interview> =
  mongoose.models.Interview || mongoose.model<Interview>('Interview', InterviewSchema);

export default InterviewModel;

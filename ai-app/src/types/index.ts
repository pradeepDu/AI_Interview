export type UserRole = 'job_seeker' | 'hr';
import { Types } from "mongoose";

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  name: string;
  phone?: string;
  resumeUrl?: string;
  profilePictureUrl?: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  extracurriculars?: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  current?: boolean;
}

export interface Project {
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  department: string;
  experienceLevel: 'entry' | 'mid' | 'senior';
  salaryRange: {
    min: number;
    max: number;
  };
  deadline: Date;
  createdBy: Types.ObjectId;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  _id: string;
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  interviewId: Types.ObjectId;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected';
  aiSummary?: {
    overallScore: number;
    strengths: string[];
    concerns: string[];
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface Interview {
  _id: string;
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  questions: InterviewQuestion[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'technical' | 'scenario' | 'behavioral';
  prepTime: number;
  answerTime: number;
  recordingUrl?: string;
  transcript?: string;
  evaluation?: QuestionEvaluation;
}

export interface QuestionEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

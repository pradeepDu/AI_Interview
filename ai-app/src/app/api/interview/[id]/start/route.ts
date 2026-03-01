import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import InterviewModel from '@/models/Interview';
import { generateInterviewQuestions } from '@/lib/groq';

/**
 * POST /api/interview/[id]/start
 * Generates AI questions using Groq and marks the session as in_progress.
 * Must be called by the candidate who owns the interview.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = await UserModel.findOne({ firebaseUid });
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.role !== 'job_seeker')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const interview = await InterviewModel.findById(id).populate(
      'jobId',
      'title description requiredSkills experienceLevel'
    );

    if (!interview)
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    if (interview.candidateId.toString() !== user._id.toString())
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (interview.status !== 'not_started') {
      // Already started — just return existing questions
      return NextResponse.json({ interview });
    }

    const job = interview.jobId as unknown as {
      title: string;
      description: string;
      requiredSkills: string[];
      experienceLevel: string;
    };

    // Generate questions via Groq
    const questions = await generateInterviewQuestions({
      jobTitle: job.title,
      jobDescription: job.description,
      requiredSkills: job.requiredSkills,
      experienceLevel: job.experienceLevel,
      candidateName: user.profile?.name ?? 'Candidate',
      candidateSkills: user.profile?.skills ?? [],
      candidateExperience: user.profile?.experience ?? [],
    });

    const updated = await InterviewModel.findByIdAndUpdate(
      id,
      {
        status: 'in_progress',
        questions,
        startedAt: new Date(),
      },
      { new: true }
    ).populate('jobId', 'title department experienceLevel requiredSkills description');

    return NextResponse.json({ interview: updated });
  } catch (err) {
    console.error('[POST /api/interview/[id]/start]', err);
    return NextResponse.json({ error: 'Failed to start interview' }, { status: 500 });
  }
}

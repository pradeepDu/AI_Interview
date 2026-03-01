import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import InterviewModel from '@/models/Interview';

/**
 * POST /api/interview/[id]/answer
 * Body: { questionId: string, transcript: string, recordingUrl?: string }
 * Saves the candidate's transcript (and optional recording URL) for a question.
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

    const interview = await InterviewModel.findById(id);
    if (!interview)
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    if (interview.candidateId.toString() !== user._id.toString())
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (interview.status !== 'in_progress')
      return NextResponse.json({ error: 'Interview is not in progress' }, { status: 400 });

    const { questionId, transcript, recordingUrl } = await request.json();
    if (!questionId)
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });

    const qIndex = interview.questions.findIndex(
      (q: { id: string }) => q.id === questionId
    );
    if (qIndex === -1)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    interview.questions[qIndex].transcript = transcript ?? '';
    if (recordingUrl) interview.questions[qIndex].recordingUrl = recordingUrl;
    interview.markModified('questions');
    await interview.save();

    return NextResponse.json({ message: 'Answer saved', questionId });
  } catch (err) {
    console.error('[POST /api/interview/[id]/answer]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

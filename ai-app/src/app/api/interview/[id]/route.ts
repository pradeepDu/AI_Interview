import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import InterviewModel from '@/models/Interview';

/** GET /api/interview/[id] — fetch interview session (candidate only) */
export async function GET(
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

    const interview = await InterviewModel.findById(id)
      .populate('jobId', 'title department experienceLevel requiredSkills description')
      .lean();

    if (!interview)
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    // Candidates can only see their own session; HR can see any
    if (
      user.role === 'job_seeker' &&
      interview.candidateId.toString() !== user._id.toString()
    )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ interview });
  } catch (err) {
    console.error('[GET /api/interview/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

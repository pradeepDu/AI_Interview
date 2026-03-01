import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import ApplicationModel from '@/models/Application';
import JobModel from '@/models/Job';
import InterviewModel from '@/models/Interview';

/**
 * POST /api/applications - Apply to a job
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'job_seeker') {
      return NextResponse.json({ error: 'Only job seekers can apply' }, { status: 403 });
    }

    if (!user.profileComplete) {
      return NextResponse.json({ error: 'Complete your profile before applying' }, { status: 400 });
    }

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Check job exists and is active
    const job = await JobModel.findById(jobId);
    if (!job || job.status !== 'active') {
      return NextResponse.json({ error: 'Job not found or closed' }, { status: 404 });
    }

    if (new Date(job.deadline) < new Date()) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Check for duplicate application
    const existing = await ApplicationModel.findOne({
      jobId,
      candidateId: user._id,
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
    }

    // Create interview session first so we have the ID
    const interview = await InterviewModel.create({
      jobId,
      candidateId: user._id,
      status: 'not_started',
      questions: [],
    });

    // Create application with interviewId already linked
    const application = await ApplicationModel.create({
      jobId,
      candidateId: user._id,
      interviewId: interview._id,
      status: 'submitted',
    });

    return NextResponse.json(
      {
        message: 'Application submitted',
        applicationId: application._id.toString(),
        interviewId: interview._id.toString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Application error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

/**
 * GET /api/applications - Get applications for current user
 * Query params:
 *   interviewId — return the single application linked to a specific interview
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    // Single-application lookup by interviewId (used by interview results page)
    if (interviewId) {
      const application = await ApplicationModel.findOne({ interviewId })
        .populate('jobId', 'title department')
        .lean();
      return NextResponse.json({ applications: application ? [application] : [] });
    }

    let applications;

    if (user.role === 'job_seeker') {
      applications = await ApplicationModel.find({ candidateId: user._id })
        .populate('jobId', 'title department experienceLevel deadline status')
        .sort({ submittedAt: -1 });
    } else {
      // HR: get applications for jobs they created
      const hrJobs = await JobModel.find({ createdBy: user._id }).select('_id');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobIds = hrJobs.map((j: any) => j._id);
      applications = await (ApplicationModel as any).find({ jobId: { $in: jobIds } })
        .populate('jobId', 'title department')
        .populate('candidateId', 'email profile.name profile.resumeUrl')
        .sort({ submittedAt: -1 });
    }

    return NextResponse.json({ applications });
  } catch (error: unknown) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

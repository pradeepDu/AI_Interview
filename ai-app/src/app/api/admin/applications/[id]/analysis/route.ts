import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import ApplicationModel from '@/models/Application';
import InterviewModel from '@/models/Interview';
import JobModel from '@/models/Job';

/**
 * GET /api/admin/applications/[id]/analysis
 * HR-only. Returns the full AI analysis for an application:
 *   - aiSummary (overallScore, strengths, concerns) from Application
 *   - per-question evaluations from the linked Interview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id: appId } = await params;
    await connectDB();

    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await UserModel.findOne({ firebaseUid });
    if (!user || user.role !== 'hr')
      return NextResponse.json({ error: 'HR only' }, { status: 403 });

    const application = await ApplicationModel.findById(appId)
      .populate('candidateId', 'email profile.name')
      .lean();

    if (!application)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // Verify this HR owns the job this application belongs to
    const job = await JobModel.findOne({
      _id: application.jobId.toString(),
      createdBy: user._id,
    }).lean();

    if (!job)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Fetch the linked interview for per-question breakdowns
    let questions = null;
    if (application.interviewId) {
      const interview = await InterviewModel.findById(application.interviewId)
        .select('questions status completedAt')
        .lean();
      if (interview) {
        questions = interview.questions.map((q: {
          id: string;
          text: string;
          type: string;
          transcript?: string;
          evaluation?: { score: number; feedback: string; strengths: string[]; improvements: string[] };
        }) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          transcript: q.transcript ?? null,
          evaluation: q.evaluation ?? null,
        }));
      }
    }

    return NextResponse.json({
      aiSummary: application.aiSummary ?? null,
      questions,
      candidateName:
        (application.candidateId as unknown as { profile?: { name?: string }; email: string })
          ?.profile?.name ??
        (application.candidateId as unknown as { email: string })?.email ??
        'Candidate',
    });
  } catch (err) {
    console.error('[GET /api/admin/applications/[id]/analysis]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

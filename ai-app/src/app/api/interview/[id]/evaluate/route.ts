import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import InterviewModel from '@/models/Interview';
import ApplicationModel from '@/models/Application';
import { evaluateAnswer, generateInterviewSummary } from '@/lib/groq';

/**
 * POST /api/interview/[id]/evaluate
 * Evaluates every answered question via Groq, updates the interview to
 * "completed", then writes the AI summary back to the linked Application.
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

    const interview = await InterviewModel.findById(id).populate(
      'jobId',
      'title requiredSkills'
    );
    if (!interview)
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    if (interview.candidateId.toString() !== user._id.toString())
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (interview.status === 'completed')
      return NextResponse.json({ message: 'Already evaluated', interview });

    const job = interview.jobId as unknown as {
      title: string;
      requiredSkills: string[];
    };

    // Evaluate each answered question (failures are non-fatal)
    for (let i = 0; i < interview.questions.length; i++) {
      const q = interview.questions[i];
      if (!q.transcript) continue; // skip unanswered

      try {
        const evaluation = await evaluateAnswer({
          questionText: q.text,
          questionType: q.type,
          transcript: q.transcript,
          jobTitle: job.title,
          requiredSkills: job.requiredSkills,
        });
        interview.questions[i].evaluation = evaluation;
      } catch (evalErr) {
        console.error(`[evaluate] Groq failed for question ${i}:`, evalErr);
        // Fallback evaluation so the interview can still complete
        interview.questions[i].evaluation = {
          score: 0,
          feedback: 'Evaluation unavailable for this answer.',
          strengths: [],
          improvements: [],
        };
      }
    }

    // Generate overall summary (fallback on Groq failure)
    let summary;
    try {
      summary = await generateInterviewSummary({
        jobTitle: job.title,
        candidateName: user.profile?.name ?? 'Candidate',
        questions: interview.questions.map((q: { text: string; type: string; evaluation?: { score: number; feedback: string; strengths: string[]; improvements: string[] } }) => ({
          text: q.text,
          type: q.type,
          evaluation: q.evaluation,
        })),
      });
    } catch (summaryErr) {
      console.error('[evaluate] Summary generation failed:', summaryErr);
      const evaluated = interview.questions.filter((q: { evaluation?: { score: number } }) => q.evaluation);
      const avg = evaluated.length
        ? Math.round(evaluated.reduce((s: number, q: { evaluation?: { score: number } }) => s + (q.evaluation?.score ?? 0), 0) / evaluated.length)
        : 0;
      summary = { overallScore: avg, strengths: [], concerns: [] };
    }

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.markModified('questions');
    await interview.save();

    // Update linked application with AI summary and move to under_review
    await ApplicationModel.findOneAndUpdate(
      { interviewId: interview._id },
      {
        aiSummary: summary,
        status: 'under_review',
      }
    );

    return NextResponse.json({
      message: 'Interview evaluated',
      summary,
      interview,
    });
  } catch (err) {
    console.error('[POST /api/interview/[id]/evaluate]', err);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}

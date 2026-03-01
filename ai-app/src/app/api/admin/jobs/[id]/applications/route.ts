import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import ApplicationModel from '@/models/Application';
import JobModel from '@/models/Job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const user = await UserModel.findOne({ firebaseUid });

    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'HR only' }, { status: 403 });
    }

    // Verify this HR owns the job
    const job = await JobModel.findOne({ _id: id, createdBy: user._id });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const applications = await ApplicationModel.find({ jobId: id })
      .populate('candidateId', 'email profile.name profile.resumeUrl profile.skills')
      .sort({ submittedAt: -1 });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

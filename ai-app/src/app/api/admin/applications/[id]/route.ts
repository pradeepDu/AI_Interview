import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import ApplicationModel from '@/models/Application';
import JobModel from '@/models/Job';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
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

    const { status } = await request.json();
    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'rejected'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Do NOT populate so jobId stays a raw ObjectId (populate turns it into an
    // object and .toString() would yield "[object Object]", causing a BSONError)
    const application = await ApplicationModel.findById(appId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify HR owns the job for this application
    const job = await JobModel.findOne({
      _id: application.jobId as unknown as string,
      createdBy: user._id,
    });
    if (!job) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = user._id.toString();
    await application.save();

    return NextResponse.json({ message: 'Status updated', status });
  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

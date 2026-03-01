import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import ApplicationModel from '@/models/Application';
import JobModel from '@/models/Job';

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

    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'HR only' }, { status: 403 });
    }

    // Get all jobs created by this HR
    const jobs = await JobModel.find({ createdBy: user._id }).sort({ createdAt: -1 });

    // Get application counts per job
    const jobIds = jobs.map((j: any) => j._id);
    const applicationCounts = await ApplicationModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    applicationCounts.forEach((a: any) => {
      countMap[a._id.toString()] = a.count;
    });

    const jobsWithCounts = jobs.map((j: any) => ({
      ...j.toObject(),
      applicationCount: countMap[j._id.toString()] || 0,
    }));

    // Overall stats
    const totalApplications = Object.values(countMap).reduce((a, b) => a + b, 0);
    const shortlisted = await ApplicationModel.countDocuments({
      jobId: { $in: jobIds },
      status: 'shortlisted',
    });

    return NextResponse.json({
      jobs: jobsWithCounts,
      stats: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j: any) => j.status === 'active').length,
        totalApplications,
        shortlisted,
      },
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

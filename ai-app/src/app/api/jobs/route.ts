import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import connectDB from '@/lib/mongodb';
import JobModel from '@/models/Job';

/**
 * Get all jobs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const experienceLevel = searchParams.get('experienceLevel');
    const status = searchParams.get('status') || 'active';

    // Build query
    const query: any = { status };

    if (search) {
      query.$text = { $search: search };
    }

    if (department) {
      query.department = department;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    const jobs = await JobModel.find(query)
      .populate('createdBy', 'profile.name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * Create a new job (HR only)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    await connectDB();

    // Verify user is HR
    const UserModel = require('@/models/User').default;
    const user = await UserModel.findOne({ firebaseUid });

    if (!user || user.role !== 'hr') {
      return NextResponse.json(
        { error: 'Only HR can create jobs' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const job = await JobModel.create({
      ...body,
      createdBy: user._id,
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

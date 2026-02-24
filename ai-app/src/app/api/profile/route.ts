import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';

/**
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const firebaseUid = authHeader.replace('Bearer ', '');
    await connectDB();

    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const firebaseUid = authHeader.replace('Bearer ', '');
    const body = await request.json();

    await connectDB();

    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update profile fields
    if (body.name) user.profile.name = body.name;
    if (body.phone) user.profile.phone = body.phone;
    if (body.resumeUrl) user.profile.resumeUrl = body.resumeUrl;
    if (body.skills) user.profile.skills = body.skills;
    if (body.experience) user.profile.experience = body.experience;
    if (body.projects) user.profile.projects = body.projects;
    if (body.extracurriculars !== undefined) {
      user.profile.extracurriculars = body.extracurriculars;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

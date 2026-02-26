import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
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

    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    const body = await request.json();

    await connectDB();

    // The client sends either a nested { profile: {...} } body or a flat body.
    const profileData = body.profile ?? body;

    const profileUpdate: Record<string, unknown> = {};
    if (profileData.name)                         profileUpdate['profile.name']             = profileData.name;
    if (profileData.phone !== undefined)          profileUpdate['profile.phone']            = profileData.phone;
    if (profileData.resumeUrl)                    profileUpdate['profile.resumeUrl']        = profileData.resumeUrl;
    if (profileData.profilePictureUrl)            profileUpdate['profile.profilePictureUrl']= profileData.profilePictureUrl;
    if (profileData.skills)                       profileUpdate['profile.skills']           = profileData.skills;
    if (profileData.experience)                   profileUpdate['profile.experience']       = profileData.experience;
    if (profileData.projects)                     profileUpdate['profile.projects']         = profileData.projects;
    if (profileData.extracurriculars !== undefined) profileUpdate['profile.extracurriculars'] = profileData.extracurriculars;

    // Profile is considered complete once the user has saved it at least once (has a name)
    const hasName = !!(profileData.name?.trim());
    profileUpdate['profileComplete'] = hasName;

    const user = await (UserModel as any).findOneAndUpdate(
      { firebaseUid },
      { $set: profileUpdate },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please complete sign-up first.' }, { status: 404 });
    }

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

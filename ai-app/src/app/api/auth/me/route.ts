import { NextRequest, NextResponse } from 'next/server';
import { auth as firebaseAuth } from '@/lib/firebase';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';

/**
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    // Get Firebase user from session/token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Extract Firebase UID from the request
    // In a real implementation, you'd verify the Firebase token here
    const firebaseUid = authHeader.replace('Bearer ', '');

    await connectDB();

    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

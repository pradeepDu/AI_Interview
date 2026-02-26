import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';

/**
 * POST /api/auth/signup
 * Called after Firebase OAuth popup succeeds.
 * The Firebase user already exists — this just creates the MongoDB profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseUid, email, role, name, phone, company } = body;

    if (!firebaseUid || !email || !role || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['job_seeker', 'hr'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();

    // Guard: check by firebaseUid OR email — either means the user already exists
    const existing = await (UserModel as any).findOne({
      $or: [{ firebaseUid }, { email: email.toLowerCase() }],
    });
    if (existing) {
      // Update firebaseUid if the doc was found by email (e.g. re-auth with same Google account)
      if (existing.firebaseUid !== firebaseUid) {
        await (UserModel as any).updateOne({ _id: existing._id }, { firebaseUid });
      }
      // Existing users already have a profile — go straight to jobs/dashboard
      return NextResponse.json({
        success: true,
        redirectTo: existing.role === 'hr' ? '/admin/dashboard' : '/jobs',
      });
    }

    const newUser = await (UserModel as any).create({
      firebaseUid,
      email: email.toLowerCase(),
      role,
      profile: {
        name,
        phone: phone || '',
        company: company || '',
        skills: [],
        experience: [],
        projects: [],
      },
      profileComplete: false,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id?.toString(),
        email: newUser.email,
        role: newUser.role,
      },
      redirectTo: role === 'hr' ? '/admin/dashboard' : '/profile',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    // E11000 duplicate key — race condition, treat as existing user
    if (error.code === 11000) {
      const keyEmail = error.keyValue?.email;
      if (keyEmail) {
        const doc = await (UserModel as any).findOne({ email: keyEmail }).lean();
        return NextResponse.json({
          success: true,
          redirectTo: doc?.role === 'hr' ? '/admin/dashboard' : '/jobs',
        });
      }
    }
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

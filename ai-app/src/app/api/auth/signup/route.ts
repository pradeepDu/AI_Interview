import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import connectDB from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, name, phone } = body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const firebaseUser = userCredential.user;

    // Connect to MongoDB
    await connectDB();

    // Create MongoDB user document
    const newUser = await UserModel.create({
      firebaseUid: firebaseUser.uid,
      email: email.toLowerCase(),
      role,
      profile: {
        name,
        phone: phone || '',
        skills: [],
        experience: [],
        projects: [],
      },
      profileComplete: false,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      redirectTo: role === 'hr' ? '/admin/dashboard' : '/profile',
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}

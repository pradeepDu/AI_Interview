import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BUCKETS } from '@/lib/supabase';

/**
 * POST /api/interview-upload
 * Accepts a video blob via FormData and uploads it to the interview-recordings
 * bucket using the service-role key (bypasses RLS). Auto-creates the bucket
 * if it doesn't exist yet.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const blob = formData.get('file') as File | null;
    const fileName = formData.get('fileName') as string | null;

    if (!blob || !fileName) {
      return NextResponse.json({ error: 'file and fileName are required' }, { status: 400 });
    }

    const bucket = BUCKETS.INTERVIEW_RECORDINGS;

    // Auto-create bucket if it doesn't exist (ignores "already exists" error)
    await supabaseAdmin.storage.createBucket(bucket, { public: true }).catch(() => {});

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'video/webm',
        upsert: true,
      });

    if (uploadError) {
      console.error('Recording upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    console.error('[POST /api/interview-upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

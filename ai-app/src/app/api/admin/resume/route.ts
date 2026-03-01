import { NextRequest, NextResponse } from 'next/server';
import { getUidFromToken } from '@/lib/authServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/admin/resume?url=<storedResumeUrl>
 *
 * HR-only endpoint. Accepts the Supabase public URL that was stored in the
 * user profile, extracts the file path, ensures the bucket exists, generates
 * a short-lived signed URL via the service-role client, and redirects to it.
 *
 * This avoids "bucket not found" / RLS errors that occur when linking directly
 * to the public URL from the admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await connectDB();
    const UserModel = require('@/models/User').default;
    const firebaseUid = getUidFromToken(authHeader);
    if (!firebaseUid)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await UserModel.findOne({ firebaseUid });
    if (!user || user.role !== 'hr')
      return NextResponse.json({ error: 'HR only' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const storedUrl = searchParams.get('url');
    if (!storedUrl)
      return NextResponse.json({ error: 'url param is required' }, { status: 400 });

    // Extract bucket + path from a Supabase Storage public URL.
    // Public URL shape: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // Signed URL shape: https://<ref>.supabase.co/storage/v1/object/sign/<bucket>/<path>
    const publicMatch = storedUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
    if (!publicMatch) {
      // Not a Supabase URL — redirect directly (e.g. external URL stored by mistake)
      return NextResponse.redirect(storedUrl);
    }

    const bucket = publicMatch[1];
    const filePath = decodeURIComponent(publicMatch[2].split('?')[0]); // strip any query params

    // Ensure bucket exists and is public (idempotent — ignores "already exists")
    const { error: bucketErr } = await supabaseAdmin.storage.createBucket(bucket, {
      public: true,
    });
    if (bucketErr && !bucketErr.message.toLowerCase().includes('already exists')) {
      console.error('[resume] bucket ensure error:', bucketErr);
    }

    // Generate a signed URL valid for 1 hour
    const { data, error: signErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (signErr || !data?.signedUrl) {
      console.error('[resume] signed URL error:', signErr);
      return NextResponse.json(
        { error: 'Could not generate resume URL. The file may have been deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('[GET /api/admin/resume]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

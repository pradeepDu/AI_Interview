import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Please add your Supabase URL to .env.local');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
  throw new Error('Please add your Supabase Anon Key to .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/**
 * Supabase client for client-side operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Storage buckets
 */
export const BUCKETS = {
  RESUMES: 'resumes',
  INTERVIEW_RECORDINGS: 'interview-recordings',
  PROFILE_PICTURES: 'profile-pictures',
} as const;

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ url: string; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: error as Error };
  }
}

/**
 * Upload resume (PDF/DOCX)
 */
export async function uploadResume(
  file: File,
  userId: string
): Promise<{ url: string; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  return uploadFile(BUCKETS.RESUMES, fileName, file);
}

/**
 * Upload interview video chunk
 */
export async function uploadVideoChunk(
  blob: Blob,
  interviewId: string,
  questionIndex: number,
  timestamp: number
): Promise<{ url: string; error: Error | null }> {
  const fileName = `${interviewId}/question-${questionIndex}-${timestamp}.webm`;
  return uploadFile(BUCKETS.INTERVIEW_RECORDINGS, fileName, blob);
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(
  file: File,
  userId: string
): Promise<{ url: string; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;
  
  // Delete old avatar if exists
  await supabase.storage
    .from(BUCKETS.PROFILE_PICTURES)
    .remove([`${userId}/`]);

  return uploadFile(BUCKETS.PROFILE_PICTURES, fileName, file);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get public URL for a file
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

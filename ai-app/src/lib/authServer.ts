/**
 * Extracts the Firebase UID from a Firebase ID Token (JWT)
 * without requiring firebase-admin.
 *
 * Firebase JWTs carry the UID as `user_id` (and also as `sub`) in the payload.
 */
export function getUidFromToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // base64url → base64 padding fix → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));

    return (payload.user_id as string) || (payload.sub as string) || null;
  } catch {
    return null;
  }
}

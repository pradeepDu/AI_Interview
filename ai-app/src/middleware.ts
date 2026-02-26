import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware is intentionally a pass-through.
 *
 * Firebase Auth stores tokens in localStorage/IndexedDB (client-side only),
 * so the middleware cannot verify auth state. All route protection is handled
 * client-side via useAuth() / useRole() hooks on each protected page.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/api'));

  // Get the session token from cookies (Firebase Auth)
  const session = request.cookies.get('session')?.value;

  // If accessing a protected route without a session
  if (!isPublicRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  if (session) {
    // HR routes
    if (pathname.startsWith('/admin')) {
      // In a real implementation, verify the role from the session/token
      // For now, we'll just allow access if logged in
      return NextResponse.next();
    }

    // Job seeker routes
    if (pathname.startsWith('/profile') || pathname.startsWith('/interview')) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

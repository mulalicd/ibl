import { NextRequest, NextResponse } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = req.cookies.get('ibl_pin_session')?.value;

  if (!token || token.length !== 64) {
    return redirectToLogin(req);
  }

  // Note: We do NOT query Supabase here because middleware runs on
  // the Edge runtime which has limited Node.js API support.
  // Full session validation (expiry check) happens in each API route
  // via validatePinSession() from lib/pin.ts.
  // Middleware only checks that a token exists and has correct length.
  // This is a deliberate architectural decision for performance.

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('ibl_pin_session');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};

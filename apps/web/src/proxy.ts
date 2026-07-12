import { NextResponse } from 'next/server';

import {
  isAuthRoute,
  isProtectedRoute,
  ROUTES,
} from '@/constants/routes';
import { auth } from '@/lib/auth';

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth;

  if (isProtectedRoute(pathname) && !isLoggedIn) {
    const loginUrl = new URL(ROUTES.login, request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(
      new URL(ROUTES.dashboard, request.nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

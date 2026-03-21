import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/chat", "/billing", "/settings"];
// Routes only accessible to unauthenticated users
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo mode: skip all auth checks, redirect login→dashboard
  if (isDemoMode) {
    if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Skip middleware for routes that don't need auth checks
  const needsAuthCheck =
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!needsAuthCheck) {
    return NextResponse.next();
  }

  // Guard against missing Supabase env vars
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Can't check auth without Supabase — let the request through
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // Refresh session if expired — required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Redirect unauthenticated users away from protected routes
    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
      if (!session) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Redirect authenticated users away from auth routes
    if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return res;
  } catch {
    // If Supabase client fails, let the request through rather than 500
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match only auth-relevant routes to avoid running middleware unnecessarily.
     */
    "/dashboard/:path*",
    "/chat/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};

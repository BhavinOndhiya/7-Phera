import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database.types';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/events',
  '/guests',
  '/budget',
  '/vendors',
  '/tasks',
  '/timeline',
  '/documents',
  '/gallery',
  '/gifts',
  '/settings',
];

const AUTH_PREFIXES = ['/login', '/signup', '/forgot-password'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('reason', 'unconfigured');
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    console.error('[middleware] Supabase session error:', error);
    return response;
  }
}

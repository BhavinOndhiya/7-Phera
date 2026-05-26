import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database.types';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/scan',
  '/events',
  '/guests',
  '/checkins',
  '/budget',
  '/vendors',
  '/tasks',
  '/timeline',
  '/documents',
  '/gallery',
  '/gifts',
  '/settings',
  '/onboarding',
  '/admin',
];

const AUTH_PREFIXES = ['/login', '/signup', '/forgot-password'];

function withPathHeader(request: NextRequest, response: NextResponse) {
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdminRoute = pathname.startsWith('/admin');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('reason', 'unconfigured');
      return NextResponse.redirect(url);
    }
    return withPathHeader(
      request,
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
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

    if (user && isAdminRoute) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_superadmin, is_suspended')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.is_suspended) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('message', 'Your account has been suspended');
        return NextResponse.redirect(url);
      }
      if (!profile?.is_superadmin) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return withPathHeader(request, response);
  } catch (error) {
    console.error('[middleware] Supabase session error:', error);
    return withPathHeader(request, response);
  }
}

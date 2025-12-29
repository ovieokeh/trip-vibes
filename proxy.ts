import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1. Run i18n middleware first
  let response = intlMiddleware(request);

  // 2. Set up Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Merge cookies into the response from intlMiddleware
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // 3. Refresh session if expired - required for Server Components
  // Only refresh if user already has a session
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Match internationalized pathnames, exclude static files and API routes that don't need auth
  matcher: ["/", "/(en|de|el|es|nl)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};

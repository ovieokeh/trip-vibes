import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const authHeader = headerList.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const cookieCount = cookieStore.getAll().length;

  console.log(
    `[SupabaseClient] Path: ${headerList.get("x-original-pathname") || "unknown"}, Auth Header: ${authHeader ? "present" : "missing"}, Token: ${token ? "extracted" : "none"}, Cookies: ${cookieCount}`
  );

  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });

  // If we have a token but no session via cookies, explicitly set it
  if (token) {
    const {
      data: { user },
    } = await client.auth.getUser(token);
    console.log(`[SupabaseClient] Token Auth Result: ${user ? `User ${user.id}` : "Failed"}`);
  } else {
    const {
      data: { user },
    } = await client.auth.getUser();
    console.log(`[SupabaseClient] Cookie Auth Result: ${user ? `User ${user.id}` : "none"}`);
  }

  return client;
}

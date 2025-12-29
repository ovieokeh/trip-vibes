"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures the current Supabase auth user exists in our users table.
 * Called after anonymous sign-in or account conversion.
 */
export async function syncUserToDatabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[syncUserToDatabase] Supabase user:", user?.id, "isAnonymous:", user?.is_anonymous);

  if (!user) {
    console.log("[syncUserToDatabase] No user found in Supabase session");
    return null;
  }

  // Check if user exists in our DB
  const existingUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  if (existingUser.length === 0) {
    console.log("[syncUserToDatabase] Creating new user in DB with id:", user.id);
    // Create new user record
    await db.insert(users).values({
      id: user.id,
      email: user.email || null,
      isAnonymous: user.is_anonymous ?? true,
      credits: user.is_anonymous ? 1 : 5, // Anonymous: 1, Real account: 5
    });
  } else {
    console.log("[syncUserToDatabase] User already exists in DB:", user.id);
  }

  return user;
}

/**
 * Get user sync status and credits from our database.
 * Returns null if user doesn't exist in our DB.
 */
export async function getUserSyncStatus(): Promise<{ credits: number; isAnonymous: boolean } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const result = await db
    .select({ credits: users.credits, isAnonymous: users.isAnonymous })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (result.length === 0) return null;

  return {
    credits: result[0].credits ?? 0,
    isAnonymous: result[0].isAnonymous ?? true,
  };
}

/**
 * Get current user's credits
 */
export async function getUserCredits(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const result = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);

  return result[0]?.credits ?? 0;
}

/**
 * Deduct a credit from the user. Returns false if no credits available.
 */
export async function deductCredit(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const result = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);

  const currentCredits = result[0]?.credits ?? 0;

  if (currentCredits <= 0) {
    return false;
  }

  await db
    .update(users)
    .set({ credits: currentCredits - 1, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return true;
}

/**
 * Convert anonymous user to real account.
 * Updates the user record to reflect non-anonymous status and adds bonus credits.
 */
export async function convertAnonymousUser(email: string, password: string) {
  const supabase = await createClient();

  // Update auth user with email/password
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    // Update our users table
    await db
      .update(users)
      .set({
        email,
        isAnonymous: false,
        credits: 5, // Bonus credits on conversion
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.user.id));
  }

  return { success: true, user: data.user };
}

/**
 * Get current authenticated user ID, or null if not authenticated.
 * Gracefully returns null in test environments where Supabase isn't available.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    // In test environments or when Supabase isn't configured
    return null;
  }
}

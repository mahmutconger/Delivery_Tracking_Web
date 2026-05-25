import { cookies } from "next/headers";

import { fail, ok } from "@/core/http/api-response";
import { serverEnv } from "@/core/env/server";
import { isUserRole } from "@/core/auth/roles";
import { getAdminAuth, isAdminAvailable } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    if (!isAdminAvailable()) {
      throw new Error("Firebase Admin is not configured.");
    }

    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return fail(new Error("Missing Firebase ID token."));
    }

    const decoded = await getAdminAuth().verifyIdToken(body.idToken, true);
    const role = decoded.role;
    if (!isUserRole(role)) {
      return fail(new Error("This account does not have an admin or dispatcher role."));
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(body.idToken, {
      expiresIn: serverEnv.SESSION_COOKIE_MAX_AGE_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(serverEnv.SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(serverEnv.SESSION_COOKIE_MAX_AGE_MS / 1000),
    });

    return ok({ role });
  } catch (error) {
    return fail(error);
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { serverEnv } from "@/core/env/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(serverEnv.SESSION_COOKIE_NAME);

  return NextResponse.redirect(new URL("/login", request.url));
}

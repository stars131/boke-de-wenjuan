import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";

export async function GET() {
  const session = getAdminSessionFromCookies();

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(session),
    session
  });
}

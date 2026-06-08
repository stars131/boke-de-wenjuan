import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp, hashValue } from "@/lib/security";

export async function POST(request: Request) {
  const rate = checkRateLimit(`admin-login:${hashValue(getRequestIp(request)) || "unknown"}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000
  });

  if (!rate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "登录尝试太频繁，请稍后再试。"
      },
      { status: 429 }
    );
  }

  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;

  const username = payload?.username?.trim() || "";
  const password = payload?.password || "";
  const valid = await verifyAdminCredentials(username, password);

  if (!valid) {
    return NextResponse.json(
      {
        ok: false,
        error: "账号或密码不正确。"
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });

  return response;
}

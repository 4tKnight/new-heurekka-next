import { NextResponse } from "next/server";
import { forward, setSession } from "@/lib/hk-server";

/** Sign-in step 2: the authenticator code. Opens the session in httpOnly cookies. */
export async function POST(request: Request) {
  const { status, body } = await forward("/admin/auth/finish", { method: "POST", body: await request.text() });
  if (status !== 200) return NextResponse.json(body, { status });
  const res = NextResponse.json({ staff: body.staff });
  setSession(res, body);
  return res;
}

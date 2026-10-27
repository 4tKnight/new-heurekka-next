import { NextResponse } from "next/server";
import { forward } from "@/lib/hk-server";

/** Sign-in step 1: email and password. Answers with a ticket, and a QR code the first time. */
export async function POST(request: Request) {
  const { status, body } = await forward("/admin/auth/start", { method: "POST", body: await request.text() });
  return NextResponse.json(body, { status });
}

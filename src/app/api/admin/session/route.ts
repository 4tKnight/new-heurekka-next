import { asStaff, endSession } from "@/lib/hk-server";

/** Who is signed in (401 when nobody is). */
export async function GET() {
  return asStaff("/admin/me");
}

/** Sign out. */
export async function DELETE() {
  return endSession();
}

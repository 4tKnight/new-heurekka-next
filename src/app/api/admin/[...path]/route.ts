import { asStaff } from "@/lib/hk-server";

type Ctx = { params: Promise<{ path: string[] }> };

const target = async (request: Request, ctx: Ctx) => {
  const { path } = await ctx.params;
  return `/admin/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
};

/** The admin API, as the signed-in staff member: /api/admin/users → /api/v1/admin/users. The server checks roles. */
export async function GET(request: Request, ctx: Ctx) {
  return asStaff(await target(request, ctx));
}

export async function POST(request: Request, ctx: Ctx) {
  return asStaff(await target(request, ctx), { method: "POST", body: await request.text() });
}

export async function PATCH(request: Request, ctx: Ctx) {
  return asStaff(await target(request, ctx), { method: "PATCH", body: await request.text() });
}

export async function DELETE(request: Request, ctx: Ctx) {
  return asStaff(await target(request, ctx), { method: "DELETE" });
}

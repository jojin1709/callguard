import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`admin-get-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const reports = await prisma.report.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { phoneNumber: true },
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        phone: r.phoneNumber.e164,
        displayName: r.displayName,
        category: r.category,
        note: r.note,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin reports API exception:", err);
    return NextResponse.json({ reports: [] });
  }
}

export async function DELETE(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`admin-delete-${ip}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing report ID." }, { status: 400 });
    }

    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("Admin report delete exception:", err);
    return NextResponse.json({ error: "Failed to delete report." }, { status: 500 });
  }
}

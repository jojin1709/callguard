import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getLocalSpamStats } from "@/lib/local-spam-db";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin(req);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stats = await getLocalSpamStats();
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin(req);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source");

    if (source) {
      const deleted = await prisma.localSpamEntry.deleteMany({ where: { source } });
      return NextResponse.json({ deleted: deleted.count, source });
    }

    const deleted = await prisma.localSpamEntry.deleteMany();
    const deletedKw = await prisma.smsSpamKeyword.deleteMany();
    return NextResponse.json({ deleted: deleted.count, keywordsDeleted: deletedKw.count });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete data." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { getLocalSpamStats } from "@/lib/local-spam-db";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getLocalSpamStats();
  return NextResponse.json(stats);
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
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
}

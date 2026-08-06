import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SPAM_CATEGORIES } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const numbers = await prisma.phoneNumber.findMany({
      take: 30,
      include: {
        reports: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { reports: { _count: "desc" } },
    });

    const formatted = numbers.map((n) => {
      const totalReports = n.reports.length;
      const spamCount = n.reports.filter((r) => SPAM_CATEGORIES.has(r.category)).length;
      const spamScore = totalReports > 0 ? Math.round((spamCount / totalReports) * 100) : 0;

      const nameCounts: Record<string, number> = {};
      for (const r of n.reports) {
        if (r.displayName) nameCounts[r.displayName] = (nameCounts[r.displayName] || 0) + 1;
      }
      const likelyName = Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        id: n.id,
        e164: n.e164,
        country: n.countryCode,
        totalReports,
        spamScore,
        likelyName,
        topCategory: n.reports[0]?.category ?? "OTHER",
        latestReportNote: n.reports[0]?.note ?? null,
      };
    });

    return NextResponse.json({ directory: formatted });
  } catch (err) {
    console.error("Directory GET exception:", err);
    return NextResponse.json({ directory: [] });
  }
}

export async function DELETE(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`directory-del-${ip}`, 20, 60000);
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
    const e164 = searchParams.get("e164");

    if (!id && !e164) {
      return NextResponse.json({ error: "Missing phone number ID or e164." }, { status: 400 });
    }

    const where = id ? { id } : { e164: e164! };
    const phone = await prisma.phoneNumber.findFirst({ where });
    if (!phone) {
      return NextResponse.json({ error: "Phone number not found." }, { status: 404 });
    }

    await prisma.nameVote.deleteMany({ where: { phoneNumberId: phone.id } });
    await prisma.searchHistory.deleteMany({ where: { phoneNumberId: phone.id } });
    await prisma.blocklistEntry.deleteMany({ where: { phoneNumberId: phone.id } });
    await prisma.contact.deleteMany({ where: { phoneNumberId: phone.id } });
    await prisma.report.deleteMany({ where: { phoneNumberId: phone.id } });
    await prisma.phoneNumber.delete({ where: { id: phone.id } });

    return NextResponse.json({ success: true, deletedId: phone.id });
  } catch (err) {
    console.error("Directory delete exception:", err);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}

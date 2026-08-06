import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const ip = getClientIp(req);
    const whereClause: any = userId ? { userId } : { ipAddress: ip };

    const history = await prisma.searchHistory.findMany({
      where: whereClause,
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        phoneNumber: {
          include: {
            reports: { take: 1, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        e164: h.phoneNumber.e164,
        countryCode: h.phoneNumber.countryCode,
        createdAt: h.createdAt,
        latestName: h.phoneNumber.reports[0]?.displayName || null,
        latestCategory: h.phoneNumber.reports[0]?.category || null,
      })),
    });
  } catch (err) {
    console.error("Search history API exception:", err);
    return NextResponse.json({ history: [] });
  }
}

export async function DELETE(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`history-del-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const whereClause: any = userId ? { userId } : { ipAddress: ip };

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await prisma.searchHistory.deleteMany({ where: whereClause });
      return NextResponse.json({ success: true, cleared: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing history ID." }, { status: 400 });
    }

    await prisma.searchHistory.deleteMany({ where: { id, ...whereClause } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("Search history delete exception:", err);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}

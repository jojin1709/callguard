import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { phone: string } }) {
  const ip = getClientIp(req);
  const rl = rateLimit(`vote-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const normalized = normalizePhone(params.phone);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const body = await req.json();
  const { callerName, vote } = body as { callerName: string; vote: number };

  if (!callerName || ![1, -1].includes(vote)) {
    return NextResponse.json({ error: "Invalid vote payload." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;

  try {
    const phoneNumber = await prisma.phoneNumber.upsert({
      where: { e164: normalized.e164 },
      create: { e164: normalized.e164, countryCode: normalized.country ?? undefined },
      update: {},
    });

    // Check for existing vote from same user/IP to prevent duplicates
    const whereClause: any = {
      phoneNumberId: phoneNumber.id,
      callerName,
    };

    if (userId) {
      whereClause.userId = userId;
    } else {
      whereClause.ipAddress = ip;
      whereClause.userId = null;
    }

    const existingVote = await prisma.nameVote.findFirst({ where: whereClause });

    if (existingVote) {
      if (existingVote.vote === vote) {
        return NextResponse.json({ error: "You already voted this way." }, { status: 409 });
      }
      await prisma.nameVote.update({ where: { id: existingVote.id }, data: { vote } });
    } else {
      await prisma.nameVote.create({
        data: {
          phoneNumberId: phoneNumber.id,
          callerName,
          vote,
          userId,
          ipAddress: ip,
        },
      });
    }

    const votes = await prisma.nameVote.aggregate({
      where: { phoneNumberId: phoneNumber.id, callerName },
      _sum: { vote: true },
    });

    return NextResponse.json({
      success: true,
      callerName,
      totalScore: votes._sum.vote ?? 0,
    });
  } catch (err) {
    console.error("Vote API exception:", err);
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });
  }
}

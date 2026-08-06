import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  phone: z.string().min(1),
  name: z.string().min(1).max(100).transform((v) => stripHtml(v.trim())),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: { phoneNumber: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`contacts-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || "guest-user-default";

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { phone, name } = parsed.data;
  const normalized = normalizePhone(phone);
  if (!normalized) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });

  if (userId === "guest-user-default") {
    await prisma.user.upsert({
      where: { id: "guest-user-default" },
      update: {},
      create: { id: "guest-user-default", name: "Community Member", email: "guest@callguard.local", passwordHash: "guest-no-password" },
    });
  }

  const phoneNumber = await prisma.phoneNumber.upsert({
    where: { e164: normalized.e164 },
    create: { e164: normalized.e164, countryCode: normalized.country ?? undefined },
    update: {},
  });

  const contact = await prisma.contact.upsert({
    where: { userId_phoneNumberId: { userId, phoneNumberId: phoneNumber.id } },
    create: { userId, phoneNumberId: phoneNumber.id, name },
    update: { name },
    include: { phoneNumber: true },
  });

  return NextResponse.json({ contact }, { status: 201 });
}

export async function DELETE(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`contacts-del-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await prisma.contact.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone, fetchNumverifyData, fetchNumlookupData, fetchIpqsData, SPAM_CATEGORIES } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  displayName: z.string().max(100).optional().transform((v) => v ? stripHtml(v.trim()) : undefined),
  category: z.enum(["SCAM", "TELEMARKETER", "FRAUD", "DELIVERY", "BANK_FINANCE", "SURVEY", "ROBOCALL", "HARASSMENT", "SAFE", "OTHER"]),
  note: z.string().max(500).optional().transform((v) => v ? stripHtml(v.trim()) : undefined),
});

export async function GET(req: Request, { params }: { params: { phone: string } }) {
  const ip = getClientIp(req);
  const rl = rateLimit(`lookup-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const normalized = normalizePhone(params.phone);
  if (!normalized) {
    return NextResponse.json({ error: "That doesn't look like a valid phone number." }, { status: 400 });
  }

  const [numverify, numlookup, ipqs] = await Promise.all([
    fetchNumverifyData(normalized.e164),
    fetchNumlookupData(normalized.e164),
    fetchIpqsData(normalized.e164),
  ]);

  let phoneNumber: any = null;
  let savedContact: any = null;
  try {
    // Upsert to guarantee existence, then fetch with reports
    const pNum = await prisma.phoneNumber.upsert({
      where: { e164: normalized.e164 },
      create: { e164: normalized.e164, countryCode: normalized.country ?? undefined },
      update: {},
    });

    [phoneNumber, savedContact] = await Promise.all([
      prisma.phoneNumber.findUnique({
        where: { id: pNum.id },
        include: { reports: { orderBy: { createdAt: "desc" }, take: 50 } },
      }),
      prisma.contact.findFirst({
        where: { phoneNumberId: pNum.id },
      }),
    ]);

    await prisma.searchHistory.create({ data: { phoneNumberId: pNum.id } });
  } catch (dbErr) {
    console.error("Database query warning (non-fatal):", dbErr);
  }

  const carrier =
    (numlookup?.carrier && numlookup.carrier !== "") ? numlookup.carrier :
    (ipqs?.carrier && ipqs.carrier !== "N/A") ? ipqs.carrier :
    (numverify?.carrier || normalized.lineTypeIntelligence.carrierName);

  const location =
    (numlookup?.location && numlookup.location !== "") ? numlookup.location :
    [ipqs?.city, ipqs?.region].filter((x) => x && x !== "N/A").join(", ") ||
    numverify?.location || null;

  const lineType =
    numlookup?.line_type ||
    ipqs?.line_type ||
    numverify?.line_type ||
    normalized.lineTypeIntelligence.lineType;

  const isVoip = ipqs?.VOIP ?? (lineType === "voip" || normalized.lineTypeIntelligence.isVoip);
  const isLandline = (lineType?.toString().toLowerCase().includes("landline")) || normalized.lineTypeIntelligence.isLandline;

  const intel = {
    lineType,
    carrierName: carrier,
    isVoip,
    isLandline,
    countryName: numlookup?.country_name || numverify?.country_name || normalized.lineTypeIntelligence.countryName,
    location,
    localFormat: numlookup?.local_format || ipqs?.local_format || numverify?.local_format || null,
    internationalFormat: numlookup?.international_format || ipqs?.formatted || numverify?.international_format || normalized.e164,
  };

  const totalReports = phoneNumber?.reports?.length ?? 0;
  const spamCount = phoneNumber?.reports?.filter((r: any) => SPAM_CATEGORIES.has(r.category)).length ?? 0;

  let spamScore = totalReports > 0 ? Math.round((spamCount / totalReports) * 100) : 0;
  if (ipqs?.fraud_score !== undefined && ipqs.fraud_score > spamScore) {
    spamScore = ipqs.fraud_score;
  }

  const nameCounts: Record<string, number> = {};
  const categoryBreakdown: Record<string, number> = {};
  if (phoneNumber?.reports) {
    for (const r of phoneNumber.reports) {
      if (r.displayName) nameCounts[r.displayName] = (nameCounts[r.displayName] || 0) + 1;
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
    }
  }

  const likelyName =
    (ipqs?.name && ipqs.name !== "N/A" ? ipqs.name : null) ||
    savedContact?.name ||
    Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    null;

  return NextResponse.json({
    e164: phoneNumber?.e164 || normalized.e164,
    country: numlookup?.country_code || numverify?.country_code || ipqs?.country || phoneNumber?.countryCode || normalized.country,
    lineTypeIntelligence: intel,
    numlookupData: numlookup,
    numverifyData: numverify,
    ipqsData: ipqs,
    found: Boolean(phoneNumber) || Boolean(numlookup?.valid) || Boolean(ipqs?.valid) || Boolean(numverify?.valid),
    totalReports,
    spamScore,
    likelyName,
    categoryBreakdown,
    reports: phoneNumber?.reports?.map((r: any) => ({
      id: r.id,
      displayName: r.displayName,
      category: r.category,
      note: r.note,
      createdAt: r.createdAt,
    })) ?? [],
  });
}

export async function POST(req: Request, { params }: { params: { phone: string } }) {
  const ip = getClientIp(req);
  const rl = rateLimit(`report-${ip}`, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || "guest-user-default";

  const normalized = normalizePhone(params.phone);
  if (!normalized) {
    return NextResponse.json({ error: "That doesn't look like a valid phone number." }, { status: 400 });
  }

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { displayName, category, note } = parsed.data;

  try {
    const phoneNumber = await prisma.phoneNumber.upsert({
      where: { e164: normalized.e164 },
      create: { e164: normalized.e164, countryCode: normalized.country ?? undefined },
      update: {},
    });

    // Ensure guest user exists for anonymous reports
    if (userId === "guest-user-default") {
      await prisma.user.upsert({
        where: { id: "guest-user-default" },
        update: {},
        create: {
          id: "guest-user-default",
          name: "Community Member",
          email: "guest@callguard.local",
          passwordHash: "guest-no-password",
        },
      });
    }

    const report = await prisma.report.create({
      data: {
        phoneNumberId: phoneNumber.id,
        userId,
        displayName: displayName?.trim() || null,
        category,
        note: note?.trim() || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("POST report database exception:", err);
    return NextResponse.json({ error: "Could not save report to database." }, { status: 500 });
  }
}

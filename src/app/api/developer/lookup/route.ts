import { NextResponse } from "next/server";
import { normalizePhone, lookupWithLocalDB } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  phone: z.string().min(1, "Phone number is required."),
  api_key: z.string().min(1, "API key is required."),
});

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`dev-api-${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = lookupSchema.safeParse({
    phone: searchParams.get("phone"),
    api_key: searchParams.get("api_key"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { phone, api_key } = parsed.data;

  const validApiKeys = (process.env.DEVELOPER_API_KEYS || "").split(",").filter(Boolean);
  if (validApiKeys.length === 0 || !validApiKeys.includes(api_key)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
  }

  const lookup = await lookupWithLocalDB(normalized.e164);

  return NextResponse.json({
    status: 200,
    data: {
      e164: normalized.e164,
      valid: normalized.valid,
      carrier: lookup.carrierName,
      location: lookup.neutrinoValidate?.location || lookup.numlookup?.location || [lookup.ipqs?.city, lookup.ipqs?.region].filter(Boolean).join(", ") || normalized.lineTypeIntelligence.countryName,
      lineType: lookup.lineType || normalized.lineTypeIntelligence.lineType,
      fraudScore: lookup.ipqs?.fraud_score ?? lookup.combinedSpamScore,
      isVoip: lookup.ipqs?.VOIP ?? normalized.lineTypeIntelligence.isVoip,
      isPrepaid: lookup.ipqs?.prepaid ?? false,
      tcpaBlacklist: lookup.ipqs?.tcpa_blacklist ?? false,
      callerName: lookup.callerName,
      isRoaming: lookup.isRoaming,
      isPorted: lookup.isPorted,
      isSpam: lookup.localSpam.isSpam,
      spamSources: lookup.localSpam.sources,
      localSpamScore: lookup.localSpam.spamScore,
    },
  });
}

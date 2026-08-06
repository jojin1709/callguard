import { NextResponse } from "next/server";
import { normalizePhone, fetchNumlookupData, fetchIpqsData } from "@/lib/phone";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  numbers: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`bulk-${ip}`, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { numbers } = parsed.data;
    const cleanNumbers = numbers.map((n) => normalizePhone(n)).filter(Boolean);

    const results = await Promise.all(
      cleanNumbers.map(async (norm) => {
        if (!norm) return null;
        const [numlookup, ipqs] = await Promise.all([
          fetchNumlookupData(norm.e164),
          fetchIpqsData(norm.e164),
        ]);

        return {
          e164: norm.e164,
          valid: numlookup?.valid || ipqs?.valid || norm.valid,
          carrier: numlookup?.carrier || ipqs?.carrier || norm.lineTypeIntelligence.carrierName,
          location: numlookup?.location || [ipqs?.city, ipqs?.region].filter(Boolean).join(", ") || norm.lineTypeIntelligence.countryName,
          lineType: numlookup?.line_type || ipqs?.line_type || norm.lineTypeIntelligence.lineType,
          fraudScore: ipqs?.fraud_score ?? 0,
          recentAbuse: ipqs?.recent_abuse ?? false,
          voip: ipqs?.VOIP ?? norm.lineTypeIntelligence.isVoip,
          name: ipqs?.name && ipqs.name !== "N/A" ? ipqs.name : null,
        };
      })
    );

    return NextResponse.json({ results: results.filter(Boolean) });
  } catch (err) {
    console.error("Bulk lookup API exception:", err);
    return NextResponse.json({ error: "Failed to process bulk lookup." }, { status: 500 });
  }
}

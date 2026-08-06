import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

function neutrinoHeaders(): Record<string, string> {
  const userId = process.env.NEUTRINO_API_USER_ID;
  const apiKey = process.env.NEUTRINO_API_KEY;
  if (!userId || !apiKey) return {};
  return { "User-ID": userId, "API-Key": apiKey };
}

const schema = z.object({
  ip: z.string().min(1, "IP address is required."),
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`ip-lookup-${ip}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({ ip: searchParams.get("ip") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (!process.env.NEUTRINO_API_USER_ID || !process.env.NEUTRINO_API_KEY) {
    return NextResponse.json({ error: "IP lookup not configured." }, { status: 503 });
  }

  try {
    const res = await fetch("https://neutrinoapi.net/ip-info", {
      method: "POST",
      headers: { ...neutrinoHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ ip: parsed.data.ip, "reverse-lookup": "true" }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "IP lookup failed." }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      status: 200,
      data: {
        ip: data.ip,
        valid: data.valid,
        hostname: data.hostname,
        "host-domain": data["host-domain"],
        country: data.country,
        "country-code": data["country-code"],
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.id || null,
        "language-code": data["language-code"],
        "currency-code": data["currency-code"],
        "is-v6": data["is-v6"],
        "is-bogon": data["is-bogon"],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "IP lookup failed." }, { status: 500 });
  }
}

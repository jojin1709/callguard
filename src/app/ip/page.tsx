"use client";

import { useState } from "react";

type IpResult = {
  ip: string;
  valid: boolean;
  hostname: string;
  "host-domain": string;
  country: string;
  "country-code": string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  "language-code": string;
  "currency-code": string;
  "is-v6": boolean;
  "is-bogon": boolean;
};

export default function IpLookupPage() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IpResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!ip.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/developer/ip?ip=${encodeURIComponent(ip)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResult(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">IP Lookup</h1>
        <p className="mt-1 text-sm text-mist">Get geolocation, hostname, and network info for any IP address.</p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
            className="input font-mono flex-1"
            placeholder="8.8.8.8"
          />
          <button onClick={lookup} disabled={loading || !ip.trim()} className="btn-primary shrink-0">
            {loading ? "Checking..." : "Lookup IP"}
          </button>
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${result.valid ? "bg-signal" : "bg-alert"}`} />
            <h2 className="font-mono text-lg font-bold text-fog">{result.ip}</h2>
            {result["is-v6"] && <span className="rounded bg-brand/10 border border-brand/30 px-2 py-0.5 text-xs font-mono text-brand">IPv6</span>}
            {result["is-bogon"] && <span className="rounded bg-alert/10 border border-alert/30 px-2 py-0.5 text-xs font-mono text-alert">BOGON</span>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="Country" value={result.country || "Unknown"} />
            <InfoCard label="Region" value={result.region || "Unknown"} />
            <InfoCard label="City" value={result.city || "Unknown"} />
            <InfoCard label="Timezone" value={result.timezone || "Unknown"} />
            <InfoCard label="Hostname" value={result.hostname || "N/A"} />
            <InfoCard label="Domain" value={result["host-domain"] || "N/A"} />
            <InfoCard label="Language" value={result["language-code"] || "N/A"} />
            <InfoCard label="Currency" value={result["currency-code"] || "N/A"} />
          </div>

          {result.latitude && result.longitude && (
            <div className="rounded border border-line bg-panel2 p-3">
              <p className="text-[10px] font-mono text-mist uppercase">Coordinates</p>
              <p className="text-sm font-mono text-fog">{result.latitude}, {result.longitude}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-panel2 p-3">
      <p className="text-[10px] font-mono text-mist uppercase">{label}</p>
      <p className="text-sm font-semibold text-fog mt-0.5">{value}</p>
    </div>
  );
}

"use client";

import { useState } from "react";

type DomainResult = {
  domain: string;
  valid: boolean;
  "is-malicious": boolean;
  "is-adult": boolean;
  "is-gov": boolean;
  rank: number;
  age: number;
  "registered-date": string;
  "expiry-date": string;
  registrar: string;
  tld: string;
  "dns-provider": string;
  "mail-provider": string;
  "mail-status": string;
  "website-provider": string;
  "website-status": string;
};

export default function DomainLookupPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<DomainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/developer/domain?domain=${encodeURIComponent(domain)}`);
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
        <h1 className="font-display text-2xl font-bold text-fog">Domain Lookup</h1>
        <p className="mt-1 text-sm text-mist">Check domain reputation, registration details, DNS, and security status.</p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
            className="input font-mono flex-1"
            placeholder="example.com"
          />
          <button onClick={lookup} disabled={loading || !domain.trim()} className="btn-primary shrink-0">
            {loading ? "Checking..." : "Lookup Domain"}
          </button>
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${result.valid && !result["is-malicious"] ? "bg-signal" : "bg-alert"}`} />
            <h2 className="font-mono text-lg font-bold text-fog">{result.domain}</h2>
            {result["is-malicious"] && <span className="rounded bg-alert/10 border border-alert/30 px-2 py-0.5 text-xs font-mono text-alert">MALICIOUS</span>}
            {result["is-gov"] && <span className="rounded bg-brand/10 border border-brand/30 px-2 py-0.5 text-xs font-mono text-brand">GOV</span>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="TLD" value={result.tld || "N/A"} />
            <InfoCard label="Rank" value={result.rank ? `#${result.rank.toLocaleString()}` : "N/A"} />
            <InfoCard label="Age (days)" value={result.age ? String(result.age) : "N/A"} />
            <InfoCard label="Registrar" value={result.registrar || "N/A"} />
            <InfoCard label="Registered" value={result["registered-date"] || "N/A"} />
            <InfoCard label="Expires" value={result["expiry-date"] || "N/A"} />
            <InfoCard label="DNS Provider" value={result["dns-provider"] || "N/A"} />
            <InfoCard label="Website Provider" value={result["website-provider"] || "N/A"} />
            <InfoCard label="Mail Provider" value={result["mail-provider"] || "N/A"} />
            <InfoCard label="Mail Status" value={result["mail-status"] || "N/A"} good={result["mail-status"] === "ok"} />
            <InfoCard label="Website Status" value={result["website-status"] || "N/A"} good={result["website-status"] === "ok"} />
            <InfoCard label="Adult" value={result["is-adult"] ? "Yes" : "No"} good={!result["is-adult"]} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded border border-line bg-panel2 p-3">
      <p className="text-[10px] font-mono text-mist uppercase">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${good === true ? "text-signal" : good === false ? "text-alert" : "text-fog"}`}>{value}</p>
    </div>
  );
}

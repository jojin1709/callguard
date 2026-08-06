"use client";

import { useState } from "react";

type EmailResult = {
  email: string;
  valid: boolean;
  verified: boolean;
  domain: string;
  isDisposable: boolean;
  isFreemail: boolean;
  isPersonal: boolean;
  isCatchAll: boolean;
  isDeferred: boolean;
  smtpStatus: string;
  mxIp: string;
  provider: string;
  domainStatus: string;
};

export default function EmailLookupPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/developer/email?email=${encodeURIComponent(email)}`);
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
        <h1 className="font-display text-2xl font-bold text-fog">Email Lookup</h1>
        <p className="mt-1 text-sm text-mist">Verify email addresses — check validity, disposable status, provider, and domain health.</p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
            className="input font-mono flex-1"
            placeholder="user@example.com"
          />
          <button onClick={lookup} disabled={loading || !email.trim()} className="btn-primary shrink-0">
            {loading ? "Checking..." : "Verify Email"}
          </button>
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className={`h-3 w-3 rounded-full ${result.valid && result.verified ? "bg-signal" : result.valid ? "bg-yellow-500" : "bg-alert"}`} />
              <h2 className="font-display text-lg font-bold text-fog">{result.email}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-mono font-semibold ${result.valid ? "bg-signal/10 text-signal border border-signal/30" : "bg-alert/10 text-alert border border-alert/30"}`}>
                {result.valid ? "VALID" : "INVALID"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard label="Verified" value={result.verified ? "Yes" : "No"} good={result.verified} />
              <InfoCard label="Disposable" value={result.isDisposable ? "Yes" : "No"} good={!result.isDisposable} />
              <InfoCard label="Freemail" value={result.isFreemail ? "Yes" : "No"} />
              <InfoCard label="Catch-All" value={result.isCatchAll ? "Yes" : "No"} />
              <InfoCard label="Provider" value={result.provider || "Unknown"} />
              <InfoCard label="Domain" value={result.domain} />
              <InfoCard label="SMTP Status" value={result.smtpStatus} good={result.smtpStatus === "ok"} />
              <InfoCard label="MX IP" value={result.mxIp || "N/A"} />
            </div>
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

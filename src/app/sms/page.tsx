"use client";

import { useState } from "react";

type SmsResult = {
  isSpam: boolean;
  category: string | null;
  matchedKeywords: string[];
  riskLevel: string;
};

export default function SmsCheckerPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SmsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/developer/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const riskColors: Record<string, string> = {
    high: "bg-alert/10 text-alert border-alert/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-signal/10 text-signal border-signal/30",
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">SMS Spam Checker</h1>
        <p className="mt-1 text-sm text-mist">Paste an SMS message to check for phishing, scam, and spam patterns.</p>
      </div>

      <div className="card space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input font-mono min-h-[120px] resize-y"
          placeholder="Paste SMS text here..."
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-mist">{text.length}/1000 characters</p>
          <button onClick={check} disabled={loading || !text.trim()} className="btn-primary">
            {loading ? "Scanning..." : "Check SMS"}
          </button>
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${result.isSpam ? "bg-alert" : "bg-signal"}`} />
            <h2 className="font-display text-lg font-bold text-fog">
              {result.isSpam ? "Spam Detected" : "Looks Safe"}
            </h2>
            <span className={`rounded border px-2 py-0.5 text-xs font-mono font-semibold ${riskColors[result.riskLevel] || riskColors.low}`}>
              {result.riskLevel.toUpperCase()} RISK
            </span>
          </div>

          {result.isSpam && (
            <div className="space-y-3">
              {result.category && (
                <div className="rounded border border-line bg-panel2 p-3">
                  <p className="text-[10px] font-mono text-mist uppercase">Category</p>
                  <p className="text-sm font-semibold text-alert mt-0.5">{result.category}</p>
                </div>
              )}
              {result.matchedKeywords.length > 0 && (
                <div className="rounded border border-line bg-panel2 p-3">
                  <p className="text-[10px] font-mono text-mist uppercase mb-1">Matched Patterns</p>
                  <div className="flex flex-wrap gap-1">
                    {result.matchedKeywords.map((kw, i) => (
                      <span key={i} className="rounded bg-alert/10 border border-alert/30 px-2 py-0.5 text-xs font-mono text-alert">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

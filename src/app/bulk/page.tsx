"use client";

import { useState } from "react";

type BulkResult = {
  e164: string;
  valid: boolean;
  carrier: string;
  location: string;
  lineType: string;
  fraudScore: number;
  recentAbuse: boolean;
  voip: boolean;
  name: string | null;
};

export default function BulkLookupPage() {
  const [inputText, setInputText] = useState("+919876543210\n+12069220880\n+447911123456");
  const [results, setResults] = useState<BulkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBulkScan() {
    setLoading(true);
    setError(null);
    setResults([]);

    const numbers = inputText.split("\n").map((n) => n.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/bulk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to scan numbers.");
      } else {
        setResults(data.results || []);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Bulk Phone Scanner</h1>
        <p className="mt-1 text-sm text-mist">Scan up to 10 phone numbers at once. Get carrier, fraud score, and line type for each.</p>
      </div>

      <div className="card space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-mist">Enter phone numbers (one per line, max 10)</span>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            className="input font-mono resize-y"
            placeholder="+919876543210&#10;+12069220880"
          />
        </label>
        <button onClick={handleBulkScan} disabled={loading} className="btn-primary">
          {loading ? "Scanning..." : "Scan Numbers"}
        </button>
      </div>

      {error && <p className="text-alert text-sm">{error}</p>}

      {results.length > 0 && (
        <div className="card">
          <h2 className="font-display text-lg font-medium text-fog mb-4">Results ({results.length} numbers)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-fog border-collapse">
              <thead>
                <tr className="border-b border-line text-xs font-mono text-mist uppercase">
                  <th className="py-2.5 px-3">Number</th>
                  <th className="py-2.5 px-3">Carrier</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Line Type</th>
                  <th className="py-2.5 px-3">Fraud Score</th>
                  <th className="py-2.5 px-3">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {results.map((r) => (
                  <tr key={r.e164} className="hover:bg-panel2/50 transition">
                    <td className="py-3 px-3 font-mono font-bold">{r.e164}</td>
                    <td className="py-3 px-3">{r.carrier}</td>
                    <td className="py-3 px-3">{r.location}</td>
                    <td className="py-3 px-3 capitalize">{r.lineType}</td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-bold ${r.fraudScore >= 50 ? "text-alert" : r.fraudScore >= 20 ? "text-warn" : "text-signal"}`}>
                        {r.fraudScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3">{r.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

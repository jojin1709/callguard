"use client";

import { useState } from "react";

export default function DeveloperApiPage() {
  const [phone, setPhone] = useState("+919876543210");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function testApi() {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/lookup?phone=${encodeURIComponent(phone)}&api_key=${encodeURIComponent(apiKey)}`);
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch {
      setResponse(JSON.stringify({ error: "Network error" }, null, 2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Developer API</h1>
        <p className="mt-1 text-sm text-mist">Integrate CallGuard phone intelligence into your applications via JSON API.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold text-fog">GET /api/developer/lookup</h2>
        <p className="text-sm text-mist">Query live phone number intelligence via HTTP GET request.</p>

        <div className="rounded-lg bg-ink p-4 border border-line">
          <p className="text-xs font-mono text-mist uppercase mb-1">Example Request</p>
          <code className="text-sm font-mono text-signal break-all">
            GET /api/developer/lookup?phone=+919876543210&amp;api_key=YOUR_API_KEY
          </code>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input font-mono flex-1"
            placeholder="+919876543210"
          />
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input font-mono flex-1"
            placeholder="Your API key"
          />
          <button onClick={testApi} disabled={loading} className="btn-primary shrink-0">
            {loading ? "Testing..." : "Test API"}
          </button>
        </div>

        {response && (
          <div className="rounded-lg bg-ink p-4 border border-line">
            <p className="text-xs font-mono text-mist uppercase mb-2">Response</p>
            <pre className="text-xs font-mono text-fog overflow-x-auto p-2 bg-panel2/80 rounded border border-line/50">
              {response}
            </pre>
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-bold text-fog">Response Fields</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex gap-2"><code className="text-signal font-mono">e164</code><span className="text-mist">— Phone number in E.164 format</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">valid</code><span className="text-mist">— Whether the number is valid</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">carrier</code><span className="text-mist">— Telecom operator name</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">location</code><span className="text-mist">— Region / circle</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">lineType</code><span className="text-mist">— mobile, landline, voip, toll_free</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">fraudScore</code><span className="text-mist">— 0-100 risk rating</span></div>
          <div className="flex gap-2"><code className="text-signal font-mono">callerName</code><span className="text-mist">— Known caller name if available</span></div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

type TabType = "phone" | "email" | "ip" | "domain" | "sms";

export default function DeveloperApiPage() {
  const [activeTab, setActiveTab] = useState<TabType>("phone");
  const [phone, setPhone] = useState("+919876543210");
  const [email, setEmail] = useState("user@example.com");
  const [ipAddr, setIpAddr] = useState("8.8.8.8");
  const [domain, setDomain] = useState("example.com");
  const [smsText, setSmsText] = useState("Congratulations! You won a free iPhone. Click here to claim.");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function testPhone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/lookup?phone=${encodeURIComponent(phone)}&api_key=${encodeURIComponent(apiKey)}`);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch { setResponse(JSON.stringify({ error: "Network error" }, null, 2)); }
    finally { setLoading(false); }
  }

  async function testEmail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/email?email=${encodeURIComponent(email)}`);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch { setResponse(JSON.stringify({ error: "Network error" }, null, 2)); }
    finally { setLoading(false); }
  }

  async function testIp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/ip?ip=${encodeURIComponent(ipAddr)}`);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch { setResponse(JSON.stringify({ error: "Network error" }, null, 2)); }
    finally { setLoading(false); }
  }

  async function testDomain() {
    setLoading(true);
    try {
      const res = await fetch(`/api/developer/domain?domain=${encodeURIComponent(domain)}`);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch { setResponse(JSON.stringify({ error: "Network error" }, null, 2)); }
    finally { setLoading(false); }
  }

  async function testSms() {
    setLoading(true);
    try {
      const res = await fetch("/api/developer/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smsText }),
      });
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch { setResponse(JSON.stringify({ error: "Network error" }, null, 2)); }
    finally { setLoading(false); }
  }

  const tabs: { id: TabType; label: string; method: string; endpoint: string }[] = [
    { id: "phone", label: "Phone", method: "GET", endpoint: "/api/developer/lookup?phone=+12106100045&api_key=KEY" },
    { id: "email", label: "Email", method: "GET", endpoint: "/api/developer/email?email=user@example.com" },
    { id: "ip", label: "IP", method: "GET", endpoint: "/api/developer/ip?ip=8.8.8.8" },
    { id: "domain", label: "Domain", method: "GET", endpoint: "/api/developer/domain?domain=example.com" },
    { id: "sms", label: "SMS Spam", method: "POST", endpoint: "/api/developer/sms" },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Developer API</h1>
        <p className="mt-1 text-sm text-mist">Integrate CallGuard intelligence into your apps — phone, email, IP, domain, and SMS spam detection.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setResponse(null); }}
            className={`rounded px-3 py-1.5 text-xs font-mono font-semibold transition ${activeTab === t.id ? "bg-fog text-midnight" : "bg-panel2 text-mist hover:text-fog border border-line"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card space-y-4">
        <div className="rounded-lg bg-ink p-4 border border-line">
          <p className="text-xs font-mono text-mist uppercase mb-1">Endpoint</p>
          <code className="text-sm font-mono text-signal break-all">
            {tabs.find((t) => t.id === activeTab)?.method} {tabs.find((t) => t.id === activeTab)?.endpoint}
          </code>
        </div>

        {activeTab === "phone" && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input font-mono flex-1" placeholder="+919876543210" />
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="input font-mono flex-1" placeholder="API key (required)" />
            <button onClick={testPhone} disabled={loading} className="btn-primary shrink-0">{loading ? "Testing..." : "Test"}</button>
          </div>
        )}

        {activeTab === "email" && (
          <div className="flex gap-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input font-mono flex-1" placeholder="user@example.com" />
            <button onClick={testEmail} disabled={loading} className="btn-primary shrink-0">{loading ? "Testing..." : "Test"}</button>
          </div>
        )}

        {activeTab === "ip" && (
          <div className="flex gap-3">
            <input value={ipAddr} onChange={(e) => setIpAddr(e.target.value)} className="input font-mono flex-1" placeholder="8.8.8.8" />
            <button onClick={testIp} disabled={loading} className="btn-primary shrink-0">{loading ? "Testing..." : "Test"}</button>
          </div>
        )}

        {activeTab === "domain" && (
          <div className="flex gap-3">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} className="input font-mono flex-1" placeholder="example.com" />
            <button onClick={testDomain} disabled={loading} className="btn-primary shrink-0">{loading ? "Testing..." : "Test"}</button>
          </div>
        )}

        {activeTab === "sms" && (
          <div className="space-y-3">
            <textarea value={smsText} onChange={(e) => setSmsText(e.target.value)} className="input font-mono min-h-[80px] resize-y" placeholder="Paste SMS text..." />
            <button onClick={testSms} disabled={loading} className="btn-primary">{loading ? "Testing..." : "Test SMS Check"}</button>
          </div>
        )}
      </div>

      {response && (
        <div className="card">
          <p className="text-xs font-mono text-mist uppercase mb-2">Response</p>
          <pre className="rounded-lg bg-ink p-4 border border-line overflow-x-auto text-sm font-mono text-fog whitespace-pre-wrap">{response}</pre>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-bold text-fog">API Endpoints</h2>
        <div className="space-y-2 text-sm">
          <EndpointRow method="GET" path="/api/developer/lookup?phone=&api_key=" desc="Phone number intelligence (requires API key)" />
          <EndpointRow method="GET" path="/api/developer/email?email=" desc="Email validation & disposable check" />
          <EndpointRow method="GET" path="/api/developer/ip?ip=" desc="IP geolocation & hostname" />
          <EndpointRow method="GET" path="/api/developer/domain?domain=" desc="Domain reputation & registration" />
          <EndpointRow method="POST" path="/api/developer/sms" desc="SMS spam/phishing detection (JSON body: {text})" />
        </div>
      </div>
    </div>
  );
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded border border-line bg-panel2 p-2">
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${method === "GET" ? "bg-signal/10 text-signal" : "bg-brand/10 text-brand"}`}>{method}</span>
      <code className="font-mono text-xs text-fog break-all">{path}</code>
      <span className="text-xs text-mist sm:ml-auto">{desc}</span>
    </div>
  );
}

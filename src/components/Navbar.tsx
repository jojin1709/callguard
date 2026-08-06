"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("callguard_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("callguard_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 flex-wrap gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-brand/60">
            <span className="h-2 w-2 rounded-full bg-signal" />
          </span>
          <span className="font-display text-lg tracking-tight text-fog">
            Call<span className="text-brand">Guard</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-xs font-mono flex-wrap">
          <Link href="/" className="text-mist transition hover:text-fog">
            Phone
          </Link>
          <Link href="/email" className="text-mist transition hover:text-fog">
            Email
          </Link>
          <Link href="/ip" className="text-mist transition hover:text-fog">
            IP
          </Link>
          <Link href="/domain" className="text-mist transition hover:text-fog">
            Domain
          </Link>
          <Link href="/sms" className="text-mist transition hover:text-fog">
            SMS
          </Link>
          <Link href="/bulk" className="text-mist transition hover:text-fog">
            Bulk
          </Link>
          <Link href="/history" className="text-mist transition hover:text-fog">
            History
          </Link>
          <Link href="/developer" className="text-mist transition hover:text-fog">
            Dev API
          </Link>
          <Link href="/dashboard" className="rounded-full bg-brand/10 border border-brand/30 px-3 py-1 font-medium text-brand hover:bg-brand/20 transition">
            Contacts
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-line bg-panel2 px-2.5 py-1 text-xs font-mono text-mist hover:text-fog transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}

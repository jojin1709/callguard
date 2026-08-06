import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-brand/60">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            <span className="font-display text-sm tracking-tight text-fog">
              Call<span className="text-brand">Guard</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-mist">
            <Link href="/" className="hover:text-fog transition">Lookup</Link>
            <Link href="/bulk" className="hover:text-fog transition">Bulk</Link>
            <Link href="/developer" className="hover:text-fog transition">Dev API</Link>
            <Link href="/privacy" className="hover:text-fog transition">Privacy</Link>
            <Link href="/terms" className="hover:text-fog transition">Terms</Link>
            <a
              href="https://github.com/jojin1709/callguard"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fog transition"
            >
              GitHub
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-mist">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/jojin-john/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                JOJIN JOHN
              </a>
            </p>
            <p className="mt-1 text-[10px] text-mist/60">
              &copy; {new Date().getFullYear()} CallGuard. MIT License.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

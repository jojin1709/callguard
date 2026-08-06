export default function PrivacyPolicy() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Privacy Policy</h1>
        <p className="mt-1 text-sm text-mist">Last updated: August 2026</p>
      </div>

      <div className="card space-y-4 text-sm text-mist leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Information We Collect</h2>
          <p>CallGuard collects phone numbers you search, reports you submit, and basic usage data to provide the service. We do not collect personal identifiers beyond what you voluntarily provide.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">How We Use Information</h2>
          <p>Search data is used to build a community-powered caller identification database. Reports and votes help other users identify spam, scam, and legitimate callers.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Data Storage</h2>
          <p>Data is stored in a PostgreSQL database hosted on Neon. API lookups are cached in memory temporarily. We do not sell or share your data with third parties.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Cookies</h2>
          <p>We use essential cookies for authentication and theme preferences. No tracking or advertising cookies are used.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Contact</h2>
          <p>For privacy concerns, contact us via <a href="https://www.linkedin.com/in/jojin-john/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">LinkedIn</a>.</p>
        </section>
      </div>
    </div>
  );
}

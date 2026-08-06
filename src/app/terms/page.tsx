export default function Terms() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-fog">Terms of Service</h1>
        <p className="mt-1 text-sm text-mist">Last updated: August 2026</p>
      </div>

      <div className="card space-y-4 text-sm text-mist leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Usage</h2>
          <p>CallGuard is provided as-is for informational purposes. Caller identification data is crowd-sourced and may not always be accurate.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">User Responsibilities</h2>
          <p>You are responsible for the accuracy of reports you submit. Do not submit false or malicious reports. Do not abuse the API or attempt to disrupt the service.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Limitation of Liability</h2>
          <p>CallGuard is not liable for decisions made based on the information provided. Always verify caller identity through official channels.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-medium text-fog mb-2">Contact</h2>
          <p>For questions about these terms, contact us via <a href="https://www.linkedin.com/in/jojin-john/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">LinkedIn</a>.</p>
        </section>
      </div>
    </div>
  );
}

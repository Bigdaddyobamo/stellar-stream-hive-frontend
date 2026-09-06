export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <p>Stellar Stream Hive — an open-source Stellar Development Foundation grant project.</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Stellar-Hive/stellar-stream-hive-contract"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            Contracts
          </a>
          <a
            href="https://github.com/Stellar-Hive/stellar-stream-hive-api"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            API
          </a>
          <a
            href="https://github.com/Stellar-Hive/stellar-stream-hive-frontend"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            Frontend
          </a>
        </div>
      </div>
    </footer>
  );
}

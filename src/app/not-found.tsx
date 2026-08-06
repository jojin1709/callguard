export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <h1 className="font-display text-4xl font-bold text-fog">404</h1>
      <p className="text-mist text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <a href="/" className="btn-primary mt-4">
        Go Home
      </a>
    </div>
  );
}

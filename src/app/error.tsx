"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <h1 className="font-display text-4xl font-bold text-alert">Something went wrong</h1>
      <p className="text-mist text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button onClick={reset} className="btn-primary mt-4">
        Try Again
      </button>
    </div>
  );
}

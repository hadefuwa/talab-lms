"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-gray-400 mb-2">An unexpected error occurred.</p>
        {error.digest && (
          <p className="text-xs text-gray-600 font-mono mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-talab-600 hover:bg-talab-700 text-white font-medium rounded-xl transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

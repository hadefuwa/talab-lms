import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-gray-800 mb-2">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8">
          This page doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-talab-600 hover:bg-talab-700 text-white font-medium rounded-xl transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

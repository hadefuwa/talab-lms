"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  lessonId: string;
  r2Key: string;
}

export default function VideoPlayer({ lessonId, r2Key }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function fetchSignedUrl() {
      try {
        const res = await fetch(`/api/video-token?key=${encodeURIComponent(r2Key)}`);
        if (!res.ok) {
          const { error: err } = await res.json();
          setError(err ?? "Failed to load video");
          return;
        }
        const { url } = await res.json();
        setSrc(url);
      } catch {
        setError("Network error loading video");
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [r2Key]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-2 border-talab-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading secure video...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-red-900/50">
        <div className="text-center text-red-400">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-800 bg-black">
      <video
        ref={videoRef}
        src={src ?? undefined}
        controls
        controlsList="nodownload"
        className="w-full aspect-video"
        onContextMenu={(e) => e.preventDefault()}
        playsInline
      >
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
}

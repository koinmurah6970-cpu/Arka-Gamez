"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { GameMedia } from "@/lib/supabase/types";

function HlsVideo({ src, poster }: { src: string; poster?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (src.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
    // Safari plays HLS natively; anything else (direct mp4/webm) just works too.
    video.src = src;
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      poster={poster ?? undefined}
      className="w-full h-full"
    />
  );
}

export function GameMediaGallery({
  media,
  fallbackImage,
  gameName,
}: {
  media: GameMedia[];
  fallbackImage: string | null;
  gameName: string;
}) {
  const items: GameMedia[] =
    media.length > 0
      ? media
      : fallbackImage
        ? [
            {
              id: "fallback",
              game_id: "",
              media_type: "image",
              url: fallbackImage,
              thumbnail_url: fallbackImage,
              sort_order: 0,
            },
          ]
        : [];

  const isCoverOnly = media.length === 0 && !!fallbackImage;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`rounded-2xl overflow-hidden shadow-md relative border border-border-subtle flex items-center justify-center ${
          isCoverOnly
            ? "aspect-[3/4] max-h-[520px] mx-auto bg-surface"
            : "aspect-video bg-black"
        }`}
      >
        {!active && (
          <span className="text-muted text-sm">Belum ada media</span>
        )}
        {active?.media_type === "video" ? (
          <HlsVideo key={active.url} src={active.url} poster={active.thumbnail_url} />
        ) : active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.url}
            alt={gameName}
            className={`w-full h-full ${isCoverOnly ? "object-contain" : "object-cover"}`}
          />
        ) : null}
      </div>

      {items.length > 1 && (
        <div className="grid grid-cols-5 gap-2 overflow-x-auto no-scrollbar py-1">
          {items.map((m, index) => (
            <div
              key={m.id}
              onClick={() => setActiveIndex(index)}
              className={`thumb-media aspect-video bg-surface rounded-lg overflow-hidden border-2 border-border-subtle opacity-60 ${
                index === activeIndex ? "active" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumbnail_url ?? m.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {m.media_type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-white/80 p-1 rounded-full text-black">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

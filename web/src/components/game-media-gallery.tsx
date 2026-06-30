"use client";

import { useState } from "react";
import type { GameMedia } from "@/lib/supabase/types";

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
        className={`rounded-2xl overflow-hidden shadow-md relative border border-gray-100 flex items-center justify-center ${
          isCoverOnly
            ? "aspect-[3/4] max-h-[520px] mx-auto bg-gray-100"
            : "aspect-video bg-black"
        }`}
      >
        {!active && (
          <span className="text-gray-500 text-sm">Belum ada media</span>
        )}
        {active?.media_type === "video" ? (
          <video
            key={active.url}
            controls
            className="w-full h-full"
            src={active.url}
          />
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
              className={`thumb-media aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-200 opacity-60 ${
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

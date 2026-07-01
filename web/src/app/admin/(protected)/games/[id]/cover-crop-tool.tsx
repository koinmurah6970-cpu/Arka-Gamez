"use client";

import { useRef, useState } from "react";
import { findOriginalCover, saveCroppedCover } from "../actions";

const TARGET_W = 600;
const TARGET_H = 800;
const PREVIEW_W = 240;
const PREVIEW_H = 320; // same 3:4 ratio as TARGET, just smaller for on-screen dragging

export function CoverCropTool({ gameId, gameName }: { gameId: string; gameName: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ left: 0, top: 0 }); // image top-left within the preview box, px
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  function baseScale(w: number, h: number) {
    return Math.max(PREVIEW_W / w, PREVIEW_H / h);
  }

  function clamp(nextLeft: number, nextTop: number, w: number, h: number, z: number) {
    const scale = baseScale(w, h) * z;
    const dispW = w * scale;
    const dispH = h * scale;
    const minLeft = PREVIEW_W - dispW;
    const minTop = PREVIEW_H - dispH;
    return {
      left: Math.min(0, Math.max(minLeft, nextLeft)),
      top: Math.min(0, Math.max(minTop, nextTop)),
    };
  }

  async function handleFetchOriginal() {
    setStatus("loading");
    setError(null);
    const result = await findOriginalCover(gameId);
    if ("error" in result) {
      setError(result.error);
      setStatus("error");
      return;
    }
    setProxiedUrl(`/admin/games/cover-source?url=${encodeURIComponent(result.url)}`);
    // status flips to "ready" once the <img onLoad> fires with real dimensions
  }

  function handleImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    const scale = baseScale(w, h);
    setPos({ left: (PREVIEW_W - w * scale) / 2, top: (PREVIEW_H - h * scale) / 2 });
    setZoom(1);
    setStatus("ready");
  }

  function handleZoomChange(nextZoom: number) {
    if (!natural.w) return;
    setZoom(nextZoom);
    setPos((prev) => clamp(prev.left, prev.top, natural.w, natural.h, nextZoom));
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: pos.left, startTop: pos.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !natural.w) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.startLeft + dx, dragRef.current.startTop + dy, natural.w, natural.h, zoom));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function handleSaveCrop() {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    setStatus("saving");

    const scale = baseScale(natural.w, natural.h) * zoom;
    const sx = -pos.left / scale;
    const sy = -pos.top / scale;
    const sw = PREVIEW_W / scale;
    const sh = PREVIEW_H / scale;

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) {
      setError("Gagal bikin gambar hasil crop.");
      setStatus("error");
      return;
    }

    const formData = new FormData();
    formData.set("cropped_file", new File([blob], "cover.webp", { type: "image/webp" }));

    try {
      await saveCroppedCover(gameId, formData);
      setStatus("idle");
      setProxiedUrl(null);
    } catch {
      setError("Gagal nyimpen cover baru.");
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {status === "idle" && (
        <button
          type="button"
          onClick={handleFetchOriginal}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          🔄 Ambil gambar asli &amp; atur crop
        </button>
      )}

      {status === "loading" && <p className="text-xs text-gray-400">Nyari gambar asli buat &quot;{gameName}&quot;...</p>}

      {status === "error" && (
        <div>
          <p className="text-xs text-red-500 mb-1">{error}</p>
          <button type="button" onClick={handleFetchOriginal} className="text-xs font-semibold text-blue-600 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      {proxiedUrl && (status === "ready" || status === "saving") && (
        <div>
          <div
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-move touch-none"
            style={{ width: PREVIEW_W, height: PREVIEW_H }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={proxiedUrl}
              alt=""
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: natural.w * baseScale(natural.w || 1, natural.h || 1) * zoom,
                height: natural.h * baseScale(natural.w || 1, natural.h || 1) * zoom,
                maxWidth: "none",
              }}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-gray-400">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={status === "saving"}
              className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {status === "saving" ? "Nyimpen..." : "Simpan Crop"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setProxiedUrl(null);
              }}
              className="text-xs font-semibold text-gray-400 hover:underline"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

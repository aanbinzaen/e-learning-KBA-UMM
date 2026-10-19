"use client";
import { useState } from "react";

// Memuat thumbnail dulu (ringan); iframe YouTube baru dimuat saat diputar.
export default function YouTubePlayer({ id, judul }) {
  const [putar, setPutar] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {putar ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={judul}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPutar(true)} className="absolute inset-0 w-full" aria-label={`Putar video: ${judul}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-kuning">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#14582A" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

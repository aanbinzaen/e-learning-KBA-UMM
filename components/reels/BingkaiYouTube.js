"use client";
import { useEffect, useRef, useState } from "react";
import { dariDetik } from "@/lib/youtube";

// Layar penuh 9:16: rekaman YouTube otomatis terpotong (mulai–selesai) dan tampil di dalam bingkai KBA-UMM.
// Cocok untuk direkam dengan fitur rekam layar HP (suara ikut terekam).
export default function BingkaiYouTube({ id, mulai, selesai, judul, pemateri, kelas, ke, subtitle = true, onTutup }) {
  const [skala, setSkala] = useState(0.3);
  const [putar, setPutar] = useState(false);
  const [menu, setMenu] = useState(true);
  const akar = useRef(null);
  useEffect(() => {
    const atur = () => setSkala(Math.min(window.innerWidth / 1080, window.innerHeight / 1920));
    atur(); window.addEventListener("resize", atur); return () => window.removeEventListener("resize", atur);
  }, []);
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1${subtitle ? "&cc_load_policy=1&cc_lang_pref=id&hl=id" : ""}${mulai != null ? `&start=${mulai}` : ""}${selesai != null ? `&end=${selesai}` : ""}`;
  const ar = /[؀-ۿ]/.test(judul);

  return (
    <div ref={akar} className="fixed inset-0 z-[100] flex items-center justify-center bg-black" role="dialog" aria-label="Reels klip kajian">
      <div style={{ width: 1080 * skala, height: 1920 * skala, position: "relative", overflow: "hidden" }}>
        <div style={{ width: 1080, height: 1920, transform: `scale(${skala})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0, background: "linear-gradient(160deg,#1E7B34 0%,#14582A 55%,#0E3F1F 100%)", color: "#fff", fontFamily: "var(--font-poppins), sans-serif", textAlign: "center" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 22%, rgba(245,184,0,0.2), transparent 55%)" }} />
          <p style={{ position: "absolute", top: 70, left: 0, right: 0, fontSize: 50, fontWeight: 800, letterSpacing: 10 }}>KBA-UMM</p>
          <p style={{ position: "absolute", top: 142, left: 0, right: 0, fontSize: 26, fontWeight: 500, color: "#F5B800" }}>Kuliah Bahasa Arab Untuk Meraih Mahabatullah</p>
          <h2 dir="auto" style={{ position: "absolute", top: 230, left: 75, right: 75, fontSize: judul.length > 40 ? 64 : 84, lineHeight: 1.25, fontWeight: 800, fontFamily: ar ? undefined : "inherit" }}>{judul}</h2>
          <div style={{ position: "absolute", top: 575, left: 480, width: 120, height: 8, borderRadius: 4, background: "#F5B800" }} />
          {pemateri && (
            <p style={{ position: "absolute", top: 625, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: "#F5B800", color: "#14582A", fontWeight: 600, fontSize: 32, padding: "12px 44px 12px 30px", borderRadius: 40, display: "flex", alignItems: "center", gap: 16 }}>
              <svg width="34" height="38" viewBox="0 0 24 28" fill="none" stroke="#14582A" strokeWidth="2.4" strokeLinecap="round" aria-hidden><rect x="8" y="1.5" width="8" height="14" rx="4" fill="#14582A" /><path d="M4 12a8 8 0 0 0 16 0M12 20v5M7.5 25h9" /></svg>
              {pemateri}
            </p>
          )}

          <div style={{ position: "absolute", left: 60, right: 60, top: 760, aspectRatio: "16 / 9", borderRadius: 26, overflow: "hidden", border: "6px solid #F5B800", background: "#000", boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}>
            {putar ? (
              <iframe src={src} title={judul} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ width: "100%", height: "100%", border: 0 }} />
            ) : (
              <button type="button" onClick={() => { setPutar(true); setMenu(false); }} style={{ width: "100%", height: "100%", position: "relative", background: "none", border: 0, cursor: "pointer" }} aria-label="Putar klip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.3)" }}>
                  <span style={{ width: 150, height: 150, borderRadius: 75, background: "#F5B800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="#14582A" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </span>
              </button>
            )}
          </div>
          <p style={{ position: "absolute", top: 760 + 585 + 36, left: 0, right: 0, fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,.92)" }}>
            Potongan Rekaman{ke ? ` Pertemuan ke-${ke}` : ""}{mulai != null ? ` · ${dariDetik(mulai)}${selesai != null ? `–${dariDetik(selesai)}` : ""}` : ""}
          </p>
          {kelas && <p style={{ position: "absolute", top: 760 + 585 + 90, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontWeight: 700, fontSize: 32, padding: "12px 45px", borderRadius: 40, border: "3px solid #F5B800", background: "rgba(255,255,255,.12)" }}>{kelas}</p>}

          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "rgba(0,0,0,.3)", borderTop: "4px solid #F5B800" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-rumah-dakwah-putih.png" alt="" style={{ position: "absolute", left: 40, top: 57, height: 56 }} />
            <p style={{ position: "absolute", left: 0, right: 0, top: 68, fontSize: 24, fontWeight: 600 }}>Rumah Dakwah Malang · Pesantren Online</p>
            <span style={{ position: "absolute", right: 40, top: 39, width: 92, height: 92, borderRadius: 46, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo-pesantren-online.png" alt="" style={{ width: 82, height: 82 }} />
            </span>
          </div>
        </div>
      </div>

      {/* kontrol kecil di luar bingkai/di pojok; ketuk layar tepi untuk memunculkan */}
      <div className="absolute right-2 top-2 flex gap-2" onClick={() => setMenu((m) => !m)}>
        {menu && <button type="button" onClick={(e) => { e.stopPropagation(); onTutup(); }} className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">Tutup ✕</button>}
      </div>
      {menu && !putar && (
        <p className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/70 p-3 text-center text-sm text-white">
          Untuk menyimpan sebagai video: nyalakan <b>Rekam Layar</b> di HP (aktifkan suara dalam), lalu ketuk tombol putar. Layar akan mengikuti ukuran 9:16.
        </p>
      )}
    </div>
  );
}

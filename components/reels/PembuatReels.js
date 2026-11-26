"use client";
import { useEffect, useRef, useState } from "react";
import { W, H, siapkanReels, gambarReels, pilihFormatRekam } from "@/lib/reels";
import { keDetik, dariDetik } from "@/lib/youtube";

const tombolGaris = "btn !min-h-[46px] !px-4 border-2 border-hijau/30 text-sm text-hijau hover:bg-hijau-muda disabled:opacity-60";

export default function PembuatReels({ pengajar = "" }) {
  const [mode, setMode] = useState("video");
  const [judul, setJudul] = useState("Faidah Kajian Pekan Ini");
  const [sub, setSub] = useState(pengajar ? `Ustadz ${pengajar.replace(/^Ustadz\s+/i, "")}` : "");
  const [isi, setIsi] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [durasiKartu, setDurasiKartu] = useState(10);
  const [hd, setHd] = useState(false);
  const [berkas, setBerkas] = useState(null);
  const [durVideo, setDurVideo] = useState(0);
  const [galat, setGalat] = useState("");
  const [status, setStatus] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null); // { url, ext, blob }
  const kanvasRef = useRef(null), asetRef = useRef(null), videoRef = useRef(null), stateRef = useRef({});
  const format = typeof window !== "undefined" ? pilihFormatRekam() : null;

  const mulaiDt = keDetik(mulai), selesaiDt = keDetik(selesai);
  stateRef.current = { mode, judul, sub, isi, video: mode === "video" ? videoRef.current : null, sibuk };

  // pratinjau
  useEffect(() => {
    let batal = false, raf = 0;
    (async () => {
      asetRef.current = await siapkanReels();
      const t0 = performance.now();
      const loop = () => {
        if (batal) return;
        const k = kanvasRef.current;
        if (k && !stateRef.current.sibuk) {
          const st = stateRef.current, det = (performance.now() - t0) / 1000;
          const t = st.mode === "video" ? Math.min(det % 7, 3.2) : det % 11;
          gambarReels(k.getContext("2d"), { ...st, label: "" }, asetRef.current, t, 10);
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => { batal = true; cancelAnimationFrame(raf); };
  }, []);

  function pilihBerkas(f) {
    setGalat(""); setHasil(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) { setGalat("Pilih berkas video (MP4/MOV/WebM)."); return; }
    if (videoRef.current) URL.revokeObjectURL(videoRef.current.src);
    const v = document.createElement("video");
    v.preload = "auto"; v.playsInline = true; v.crossOrigin = "anonymous"; v.src = URL.createObjectURL(f);
    v.onloadedmetadata = () => { setDurVideo(v.duration); v.currentTime = Math.min(0.1, v.duration / 2); };
    v.onerror = () => setGalat("Video tidak bisa dibaca peramban ini. Coba format MP4 (H.264).");
    videoRef.current = v; setBerkas(f);
  }

  async function buat() {
    setGalat(""); setHasil(null);
    if (!format) return setGalat("Peramban ini belum mendukung perekaman video. Gunakan Chrome terbaru di HP atau komputer.");
    if (!judul.trim()) return setGalat("Judul wajib diisi.");
    let awal = 0, akhir = durasiKartu;
    if (mode === "video") {
      const v = videoRef.current;
      if (!v || !berkas) return setGalat("Pilih video kajian lebih dulu.");
      if (Number.isNaN(mulaiDt) || Number.isNaN(selesaiDt)) return setGalat("Format waktu tidak dikenali. Contoh: 10.22");
      awal = mulaiDt ?? 0; akhir = selesaiDt ?? Math.min(v.duration, awal + 60);
      if (akhir > v.duration) akhir = v.duration;
      if (akhir <= awal) return setGalat("Waktu selesai harus setelah waktu mulai.");
      if (akhir - awal > 180) return setGalat("Reels maksimal 3 menit. Perpendek klipnya.");
    } else if (!isi.trim()) return setGalat("Tulis isi teks reels, atau pilih mode video.");

    setSibuk(true); setStatus("Merekam… jangan tutup atau pindah halaman.");
    const k = document.createElement("canvas"); k.width = hd ? 1080 : 720; k.height = hd ? 1920 : 1280;
    const ctx = k.getContext("2d");
    const dur = akhir - awal, aset = asetRef.current || await siapkanReels();
    let ac = null;
    try {
      const alur = k.captureStream(30);
      const v = mode === "video" ? videoRef.current : null;
      if (v) {
        ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
        const sumber = ac.createMediaElementSource(v), tujuan = ac.createMediaStreamDestination();
        sumber.connect(tujuan); tujuan.stream.getAudioTracks().forEach((a) => alur.addTrack(a));
        v.currentTime = awal; await new Promise((ok) => { const f = () => { v.removeEventListener("seeked", f); ok(); }; v.addEventListener("seeked", f); });
      }
      const rec = new MediaRecorder(alur, { mimeType: format.mime, videoBitsPerSecond: hd ? 6_000_000 : 3_500_000 });
      const potong = []; rec.ondataavailable = (e) => e.data.size && potong.push(e.data);
      const selesaiRekam = new Promise((ok) => { rec.onstop = ok; });
      const st = { judul, sub, isi, video: v, label: mode === "video" ? `Klip kajian · ${dariDetik(awal)}–${dariDetik(akhir)}` : "" };
      rec.start(500);
      const t0 = performance.now();
      if (v) await v.play();
      await new Promise((ok) => {
        const loop = () => {
          const t = v ? v.currentTime - awal : (performance.now() - t0) / 1000;
          gambarReels(ctx, st, aset, Math.max(0, t), dur);
          if (t >= dur || (v && v.ended)) return ok();
          setStatus(`Merekam… ${Math.min(100, Math.round((t / dur) * 100))}%`);
          requestAnimationFrame(loop);
        };
        loop();
      });
      if (v) v.pause();
      await new Promise((r) => setTimeout(r, 300));
      rec.stop(); await selesaiRekam;
      const blob = new Blob(potong, { type: format.mime.split(";")[0] });
      setHasil({ url: URL.createObjectURL(blob), ext: format.ext, blob });
      setStatus("Selesai. Reels siap diunduh.");
    } catch (e) {
      setGalat("Perekaman gagal: " + (e?.message || "coba lagi dengan Chrome terbaru."));
      setStatus("");
    } finally { setSibuk(false); if (ac) ac.close().catch(() => {}); }
  }

  const nama = `reels-kba-umm-${judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "klip"}.${hasil?.ext || "mp4"}`;
  async function bagikan() {
    const f = new File([hasil.blob], nama, { type: hasil.blob.type });
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: judul }); } catch { /* dibatalkan */ } }
    else setGalat("Berbagi langsung belum didukung di perangkat ini. Gunakan tombol Unduh.");
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex gap-2">
          {[["video", "Dari video kajian"], ["kartu", "Kartu teks saja"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setMode(k)} className={`btn !min-h-[46px] !px-4 text-sm ${mode === k ? "bg-hijau text-white" : "border-2 border-hijau/30 text-hijau"}`}>{l}</button>
          ))}
        </div>

        <div><label className="label" htmlFor="rj">Judul reels</label><input id="rj" className="input" value={judul} onChange={(e) => setJudul(e.target.value)} maxLength={120} /></div>
        <div><label className="label" htmlFor="rs">Keterangan di bawah judul (kelas / pengajar)</label><input id="rs" className="input" value={sub} onChange={(e) => setSub(e.target.value)} maxLength={70} placeholder="Kelas Imam Ibnu Hisyam · Ustadz Aan" /></div>

        {mode === "video" ? (
          <>
            <div>
              <label className="label" htmlFor="rv">Video kajian (dari galeri / hasil unduhan rekaman)</label>
              <input id="rv" type="file" accept="video/*" className="input" onChange={(e) => pilihBerkas(e.target.files?.[0])} />
              {durVideo > 0 && <p className="mt-1 text-sm text-tinta/70">Durasi video: {dariDetik(durVideo)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="rm">Mulai</label><input id="rm" className="input" inputMode="numeric" placeholder="10.22" value={mulai} onChange={(e) => setMulai(e.target.value)} /></div>
              <div><label className="label" htmlFor="rk">Selesai</label><input id="rk" className="input" inputMode="numeric" placeholder="11.40" value={selesai} onChange={(e) => setSelesai(e.target.value)} /></div>
            </div>
            <p className="text-sm text-tinta/70">Tulis menit.detik, contoh 10.22. Kosongkan untuk mulai dari awal; bila selesai kosong, diambil 1 menit.</p>
          </>
        ) : (
          <>
            <div><label className="label" htmlFor="ri">Isi teks (faidah, ayat, kutipan)</label><textarea id="ri" className="input min-h-[140px]" value={isi} onChange={(e) => setIsi(e.target.value)} placeholder={"Setiap baris akan muncul satu per satu.\nBoleh teks Arab."} dir="auto" /></div>
            <div><label className="label" htmlFor="rd">Durasi: {durasiKartu} detik</label><input id="rd" type="range" min="6" max="25" value={durasiKartu} onChange={(e) => setDurasiKartu(+e.target.value)} className="w-full" /></div>
          </>
        )}

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hd} onChange={(e) => setHd(e.target.checked)} /> Kualitas HD 1080×1920 (lebih berat; bawaan 720×1280 sudah cukup untuk Reels/Status)</label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={buat} disabled={sibuk} className="btn-hijau !min-h-[46px] disabled:opacity-60">{sibuk ? "Merekam…" : "Buat Reels"}</button>
          {hasil && <a href={hasil.url} download={nama} className="btn-kuning !min-h-[46px]">Unduh {hasil.ext.toUpperCase()}</a>}
          {hasil && <button type="button" onClick={bagikan} className={tombolGaris}>Bagikan…</button>}
        </div>
        {status && <p className="text-sm text-hijau" role="status">{status}</p>}
        {galat && <p className="text-sm font-medium text-red-700" role="alert">{galat}</p>}
        {hasil?.ext === "webm" && <p className="text-sm text-tinta/70">Peramban ini menghasilkan WebM. Bila Instagram menolak, buka halaman ini di Chrome terbaru (menghasilkan MP4) atau ubah dulu ke MP4.</p>}
      </div>

      <div className="space-y-2 md:sticky md:top-4 md:self-start">
        <p className="text-sm font-medium text-hijau-tua">Pratinjau</p>
        <canvas ref={kanvasRef} width={360} height={640} className="w-full max-w-[300px] rounded-2xl border border-hijau/20 bg-black" aria-label="Pratinjau reels" />
        {hasil && <video src={hasil.url} controls playsInline className="w-full max-w-[300px] rounded-2xl" />}
      </div>
    </div>
  );
}

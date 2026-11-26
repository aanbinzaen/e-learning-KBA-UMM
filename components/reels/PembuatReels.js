"use client";
import { useEffect, useRef, useState } from "react";
import { W, H, siapkanReels, gambarReels, gambarPenutup, bunyiWhoosh, DURASI_PENUTUP, pilihFormatRekam } from "@/lib/reels";
import { keDetik, dariDetik, idYouTube } from "@/lib/youtube";
import BingkaiYouTube from "./BingkaiYouTube";
import { jadikanProgresif } from "@/lib/mp4Lurus";

const labelPotongan = (ke, a, b) => `Potongan Rekaman${ke ? ` Pertemuan ke-${ke}` : ""}${a ? ` · ${a}${b ? `–${b}` : ""}` : ""}`;
function susunCaption({ judul, pemateri, kelas, ke, isi, mode, idYt, mulai, host }) {
  const b = [];
  b.push(`✨ ${(judul || "Faidah Kajian").trim()}`);
  if (pemateri?.trim()) b.push(`🎙️ ${pemateri.trim()}`);
  const kls = [kelas?.trim(), ke ? `Pertemuan ke-${ke}` : ""].filter(Boolean).join(" · ");
  if (kls) b.push(`📚 ${kls}`);
  if (mode === "kartu" && isi?.trim()) b.push("", isi.trim());
  b.push("", mode === "video" ? "Potongan rekaman kajian KBA-UMM (Kuliah Bahasa Arab Untuk Meraih Mahabatullah)." : "Faidah dari kajian KBA-UMM (Kuliah Bahasa Arab Untuk Meraih Mahabatullah).");
  if (idYt) b.push(`▶️ Rekaman lengkap: https://youtu.be/${idYt}${Number.isFinite(mulai) && mulai ? `?t=${mulai}` : ""}`);
  if (host) b.push(`🌐 Belajar bersama di e-learning: https://${host}`);
  b.push("", "Semoga bermanfaat, jangan lupa bagikan 🤲", "", "#KBAUMM #BelajarBahasaArab #KajianBahasaArab #RumahDakwahMalang #PesantrenOnline");
  return b.join("\n");
}
const tombolGaris = "btn !min-h-[46px] !px-4 border-2 border-hijau/30 text-sm text-hijau hover:bg-hijau-muda disabled:opacity-60";

export default function PembuatReels({ pengajar = "", rekaman = [] }) {
  const [tautan, setTautan] = useState("");
  const [bingkai, setBingkai] = useState(false);
  const [subYt, setSubYt] = useState(true);
  const [mode, setMode] = useState("video");
  const [judul, setJudul] = useState("Faidah Kajian Pekan Ini");
  const [pemateri, setPemateri] = useState(pengajar ? `Ustadz ${pengajar.replace(/^Ustadz\s+/i, "")}` : "");
  const [kelas, setKelas] = useState("");
  const [ke, setKe] = useState("");
  const [isi, setIsi] = useState("");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [durasiKartu, setDurasiKartu] = useState(10);
  const [hd, setHd] = useState(false);
  const [musik, setMusik] = useState(null);
  const [efek, setEfek] = useState(true);
  const [volMusik, setVolMusik] = useState(12);
  const [berkas, setBerkas] = useState(null);
  const [durVideo, setDurVideo] = useState(0);
  const [galat, setGalat] = useState("");
  const [status, setStatus] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null); // { url, ext, blob }
  const kanvasRef = useRef(null), asetRef = useRef(null), videoRef = useRef(null), stateRef = useRef({});
  const format = typeof window !== "undefined" ? pilihFormatRekam() : null;

  const mulaiDt = keDetik(mulai), selesaiDt = keDetik(selesai), idYt = idYouTube(tautan);
  const judulDiubah = useRef(false);
  const [captionManual, setCaptionManual] = useState(null);
  const [tersalin, setTersalin] = useState(false);
  const host = typeof window !== "undefined" ? window.location.host : "";
  const captionOtomatis = susunCaption({ judul, pemateri, kelas, ke, isi, mode, idYt, mulai: mulaiDt, host });
  const caption = captionManual ?? captionOtomatis;
  async function salinCaption() {
    try { await navigator.clipboard.writeText(caption); setTersalin(true); setTimeout(() => setTersalin(false), 2000); } catch { setGalat("Caption tidak bisa disalin otomatis. Tekan lama teks caption lalu salin."); }
  }
  stateRef.current = { mode, judul, pemateri, kelas, label: labelPotongan(ke, mulai, selesai), isi, video: mode === "video" ? videoRef.current : null, sibuk };

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
          gambarReels(k.getContext("2d"), st, asetRef.current, t, 10);
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
      if (!v || !berkas) return setGalat("Untuk berkas MP4, pilih video yang sudah diunduh. Untuk tanpa unduh, pakai tombol \"Putar klip dalam bingkai Reels\" di atas.");
      if (Number.isNaN(mulaiDt) || Number.isNaN(selesaiDt)) return setGalat("Format waktu tidak dikenali. Contoh: 10.22");
      awal = mulaiDt ?? 0; akhir = selesaiDt ?? Math.min(v.duration, awal + 60);
      if (akhir > v.duration) akhir = v.duration;
      if (akhir <= awal) return setGalat("Waktu selesai harus setelah waktu mulai.");
      if (akhir - awal > 210) return setGalat("Reels maksimal 3 menit 30 detik. Perpendek klipnya.");
    } else if (!isi.trim()) return setGalat("Tulis isi teks reels, atau pilih mode video.");

    setSibuk(true); setStatus("Merekam… jangan tutup atau pindah halaman.");
    const k = document.createElement("canvas"); k.width = hd ? 1080 : 720; k.height = hd ? 1920 : 1280;
    const ctx = k.getContext("2d");
    const dur = akhir - awal, aset = asetRef.current || await siapkanReels();
    let ac = null, lagu = null, gainLagu = null;
    try {
      const alur = k.captureStream(30);
      const v = mode === "video" ? videoRef.current : null;
      let tujuan = null;
      {
        ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
        tujuan = ac.createMediaStreamDestination();
        if (v) ac.createMediaElementSource(v).connect(tujuan);
        if (musik) {
          lagu = new Audio(); lagu.src = URL.createObjectURL(musik); lagu.loop = true; lagu.preload = "auto";
          await new Promise((ok, gagal) => { lagu.oncanplaythrough = ok; lagu.onerror = () => gagal(new Error("berkas musik tidak bisa dibaca")); lagu.load(); });
          gainLagu = ac.createGain(); gainLagu.gain.value = 0;
          ac.createMediaElementSource(lagu).connect(gainLagu); gainLagu.connect(tujuan);
        }
        tujuan.stream.getAudioTracks().forEach((a) => alur.addTrack(a));
      }
      if (v) { v.currentTime = awal; await new Promise((ok) => { const f = () => { v.removeEventListener("seeked", f); ok(); }; v.addEventListener("seeked", f); }); }
      const rec = new MediaRecorder(alur, { mimeType: format.mime, videoBitsPerSecond: dur > 120 ? (hd ? 4_000_000 : 2_200_000) : (hd ? 6_000_000 : 3_500_000) });
      const potong = []; rec.ondataavailable = (e) => e.data.size && potong.push(e.data);
      const selesaiRekam = new Promise((ok) => { rec.onstop = ok; });
      const st = { judul, pemateri, kelas, isi, video: v, label: mode === "video" ? labelPotongan(ke, dariDetik(awal), dariDetik(akhir)) : "" };
      rec.start(500);
      const t0 = performance.now();
      if (efek) bunyiWhoosh(ac, tujuan, { naik: true, volume: 0.45 });
      if (v) await v.play();
      if (lagu) await lagu.play();
      await new Promise((ok) => {
        let macet = false;
        const loop = () => {
          const wall = (performance.now() - t0) / 1000;
          const t = v ? v.currentTime - awal : wall;
          // video tersendat (memuat/decode): jeda perekam agar waktu macet tidak ikut terekam & durasi tetap sesuai
          if (v) {
            const tersendat = v.readyState < 3 && !v.ended;
            if (tersendat && !macet && rec.state === "recording") { rec.pause(); macet = true; if (lagu) lagu.pause(); }
            else if (!tersendat && macet && rec.state === "paused") { rec.resume(); macet = false; if (lagu) lagu.play().catch(() => {}); }
          }
          gambarReels(ctx, st, aset, Math.max(0, t), dur);
          // backsound lirih: masuk perlahan, keluar perlahan di akhir
          if (gainLagu) gainLagu.gain.value = (volMusik / 100) * Math.max(0, Math.min(1, t / 1.2, (dur - t) / 1.5));
          if (t >= dur - 0.02 || (v && v.ended) || wall > dur * 2 + 30) return ok();
          setStatus(`Merekam… ${Math.min(100, Math.round((t / dur) * 100))}%`);
          requestAnimationFrame(loop);
        };
        loop();
      });
      if (v) v.pause();
      // penutup: logo Rumah Dakwah dan Pesantren Online, dengan efek whoosh di awalnya
      if (efek) {
        if (gainLagu) gainLagu.gain.value = 0;
        bunyiWhoosh(ac, tujuan, { naik: false, volume: 0.45, durasi: 0.9 });
        await new Promise((ok) => {
          const tp = performance.now();
          const loopP = () => { const x = (performance.now() - tp) / 1000; gambarPenutup(ctx, aset, x); if (x >= DURASI_PENUTUP) return ok(); setStatus("Menambah penutup…"); requestAnimationFrame(loopP); };
          loopP();
        });
      }
      if (lagu) lagu.pause();
      await new Promise((r) => setTimeout(r, 300));
      rec.stop(); await selesaiRekam;
      let blob = new Blob(potong, { type: format.mime.split(";")[0] });
      if (format.ext === "mp4") {
        // MP4 hasil perekam bertipe "terpecah": galeri memutar penuh, tetapi WhatsApp hanya membaca ± 3 detik pertama.
        // Ditata ulang menjadi MP4 biasa dengan durasi lengkap (tanpa menyandi ulang).
        try { const lurus = jadikanProgresif(new Uint8Array(await blob.arrayBuffer())); if (lurus) blob = new Blob([lurus], { type: "video/mp4" }); } catch { /* pakai hasil asli */ }
      }
      setHasil({ url: URL.createObjectURL(blob), ext: format.ext, blob });
      setStatus("Selesai. Reels siap diunduh.");
    } catch (e) {
      setGalat("Perekaman gagal: " + (e?.message || "coba lagi dengan Chrome terbaru."));
      setStatus("");
    } finally { setSibuk(false); if (lagu) { lagu.pause(); URL.revokeObjectURL(lagu.src); } if (ac) ac.close().catch(() => {}); }
  }

  const nama = `reels-kba-umm-${judul.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "klip"}.${hasil?.ext || "mp4"}`;
  async function bagikan() {
    const f = new File([hasil.blob], nama, { type: hasil.blob.type });
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: judul, text: caption }); } catch { /* dibatalkan */ } }
    else setGalat("Berbagi langsung belum didukung di perangkat ini. Gunakan tombol Unduh.");
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_300px]">
      {bingkai && idYt && <BingkaiYouTube id={idYt} mulai={Number.isFinite(mulaiDt) ? mulaiDt : null} selesai={Number.isFinite(selesaiDt) ? selesaiDt : null} judul={judul || "Judul Reels"} pemateri={pemateri} kelas={kelas} ke={ke} subtitle={subYt} onTutup={() => setBingkai(false)} />}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[["video", "Dari video kajian"], ["kartu", "Kartu teks saja"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setMode(k)} className={`btn !min-h-[46px] !px-4 text-sm ${mode === k ? "bg-hijau text-white" : "border-2 border-hijau/30 text-hijau"}`}>{l}</button>
          ))}
        </div>

        <div><label className="label" htmlFor="rj">Judul reels</label><input id="rj" className="input" value={judul} onChange={(e) => { judulDiubah.current = true; setJudul(e.target.value); }} maxLength={120} /></div>
        <div><label className="label" htmlFor="rp">Nama pemateri (tampil dengan ikon mikrofon)</label><input id="rp" className="input" value={pemateri} onChange={(e) => setPemateri(e.target.value)} maxLength={60} placeholder="Ustadz Aan Bin Zaen, S.Pd" /></div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div><label className="label" htmlFor="rkl">Kelas (tampil di bawah kotak rekaman)</label><input id="rkl" className="input" value={kelas} onChange={(e) => setKelas(e.target.value)} maxLength={60} placeholder="Kelas Abul Aswad Ad-Du'aliy" /></div>
          <div><label className="label" htmlFor="rke">Pertemuan ke</label><input id="rke" className="input" inputMode="numeric" value={ke} onChange={(e) => setKe(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} placeholder="4" /></div>
        </div>

        {mode === "video" ? (
          <>
            <div className="space-y-3 rounded-2xl border-2 border-hijau/15 p-4">
              <p className="font-medium text-hijau-tua">Langkah 1 · Cari menit di rekaman YouTube</p>
              {rekaman.length > 0 && (
                <div><label className="label" htmlFor="rr">Pilih dari rekaman kelas</label>
                  <select id="rr" className="input" value="" onChange={(e) => { if (e.target.value) { setTautan(`https://youtu.be/${e.target.value}`); const r = rekaman.find((x) => x.youtube_id === e.target.value); if (r) { const m = r.pertemuan.match(/pertemuan\s*(?:ke)?[-\s]*(\d+)/i) || r.judul.match(/pertemuan\s*(?:ke)?[-\s]*(\d+)/i); if (m) setKe(m[1]); if (!judulDiubah.current) setJudul(r.judul); } } }}>
                    <option value="">— pilih rekaman —</option>
                    {rekaman.map((r) => <option key={r.id} value={r.youtube_id}>{r.pertemuan ? `${r.pertemuan} · ` : ""}{r.judul}</option>)}
                  </select>
                </div>
              )}
              <div><label className="label" htmlFor="rt">atau tempel tautan YouTube</label><input id="rt" className="input" value={tautan} onChange={(e) => setTautan(e.target.value)} placeholder="https://youtu.be/…" /></div>
              {idYt && (
                <>
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                    <iframe key={`${idYt}-${mulaiDt ?? 0}`} src={`https://www.youtube-nocookie.com/embed/${idYt}?rel=0${Number.isFinite(mulaiDt) && mulaiDt != null ? `&start=${mulaiDt}` : ""}`} title="Pratinjau rekaman" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" />
                  </div>
                  <p className="text-sm text-tinta/70">Putar dan catat menit mulai dan selesai bagian yang diinginkan, lalu isi kolom Mulai dan Selesai di bawah.</p>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={subYt} onChange={(e) => setSubYt(e.target.checked)} /> Tampilkan subtitle otomatis YouTube (bila tersedia)</label>
                  <button type="button" onClick={() => { if (Number.isNaN(mulaiDt) || Number.isNaN(selesaiDt)) setGalat("Format waktu tidak dikenali. Contoh: 10.22"); else if (selesaiDt != null && selesaiDt <= (mulaiDt ?? 0)) setGalat("Waktu selesai harus setelah waktu mulai."); else { setGalat(""); setBingkai(true); } }} className="btn-hijau !min-h-[46px] w-full">Putar klip dalam bingkai Reels (otomatis terpotong)</button>
                  <p className="text-sm text-tinta/70">Isi Mulai dan Selesai di bawah dulu. Klip langsung tampil di bingkai KBA-UMM layar penuh 9:16; untuk menyimpannya jadi video, gunakan Rekam Layar HP.</p>
                  <a href={`https://studio.youtube.com/video/${idYt}/edit`} target="_blank" rel="noopener noreferrer" className={tombolGaris}>Buka di YouTube Studio untuk mengunduh video</a>
                  <p className="text-sm text-tinta/70">Di YouTube Studio: ikon titik tiga (Opsi) → <b>Unduh</b>. Hanya pemilik channel yang bisa mengunduh videonya. Setelah terunduh, lanjut ke langkah 2.</p>
                </>
              )}
              {tautan.trim() && !idYt && <p className="text-sm font-medium text-red-700">Tautan YouTube tidak dikenali.</p>}
            </div>
            <div>
              <label className="label" htmlFor="rv">Opsi berkas MP4 · Pilih video yang sudah diunduh (atau dari galeri)</label>
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

        <div className="space-y-2 rounded-2xl border-2 border-hijau/15 p-4">
          <label className="label" htmlFor="rmu">Backsound (opsional)</label>
          <input id="rmu" type="file" accept="audio/*" className="input" onChange={(e) => setMusik(e.target.files?.[0] || null)} />
          {musik ? (
            <>
              <label className="label" htmlFor="rvol">Volume backsound: {volMusik}%{mode === "video" ? " (kajian tetap 100%)" : ""}</label>
              <input id="rvol" type="range" min="3" max="40" value={volMusik} onChange={(e) => setVolMusik(+e.target.value)} className="w-full" />
              <p className="text-sm text-tinta/70">Masuk perlahan di awal, mengecil di akhir, dan diulang bila lebih pendek dari video. Bawaan 12% agar tidak menutupi suara kajian.</p>
              <button type="button" onClick={() => setMusik(null)} className="text-sm font-medium text-hijau underline">Hapus backsound</button>
            </>
          ) : <p className="text-sm text-tinta/70">Pilih berkas MP3/M4A dari HP. Kosongkan bila tidak ingin musik.</p>}
        </div>

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={efek} onChange={(e) => setEfek(e.target.checked)} /> Efek suara whoosh di awal dan akhir + penutup logo Rumah Dakwah &amp; Pesantren Online</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hd} onChange={(e) => setHd(e.target.checked)} /> Kualitas HD 1080×1920 (lebih berat; bawaan 720×1280 sudah cukup untuk Reels/Status)</label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={buat} disabled={sibuk} className="btn-hijau !min-h-[46px] disabled:opacity-60">{sibuk ? "Merekam…" : "Buat Reels"}</button>
          {hasil && <a href={hasil.url} download={nama} className="btn-kuning !min-h-[46px]">Unduh {hasil.ext.toUpperCase()}</a>}
          {hasil && <button type="button" onClick={bagikan} className={tombolGaris}>Bagikan…</button>}
        </div>
        {status && <p className="text-sm text-hijau" role="status">{status}</p>}
        {galat && <p className="text-sm font-medium text-red-700" role="alert">{galat}</p>}
        <div className="space-y-2 rounded-2xl border-2 border-hijau/15 p-4">
          <div className="flex items-center justify-between gap-2">
            <label className="label !mb-0" htmlFor="rcap">Caption otomatis (siap dibagikan)</label>
            <button type="button" onClick={salinCaption} className={tombolGaris}>{tersalin ? "Tersalin ✓" : "Salin caption"}</button>
          </div>
          <textarea id="rcap" className="input min-h-[190px] text-sm" value={caption} onChange={(e) => setCaptionManual(e.target.value)} dir="auto" />
          {captionManual !== null && <button type="button" onClick={() => setCaptionManual(null)} className="text-sm font-medium text-hijau underline">Kembalikan caption otomatis</button>}
          <p className="text-sm text-tinta/70">Caption mengikuti isian di atas. Tempel saat mengunggah ke Instagram, TikTok, atau grup WhatsApp. Tombol Bagikan juga ikut membawa caption.</p>
        </div>
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

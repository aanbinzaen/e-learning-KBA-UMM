"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { JENIS, TEMA, FORMAT_FLYER, dariTemplat, susunTeksWa } from "@/lib/flyer";

const tombolGaris = "btn !min-h-[46px] !px-4 border-2 border-hijau/30 text-sm text-hijau hover:bg-hijau-muda disabled:opacity-60";
const NAMA_BERKAS = (j, k) => `flyer-${j}${k ? `-${k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : ""}.png`;

export default function PembuatFlyer({ tujuan = [], admin = false, pengajar = "" }) {
  const [jenis, setJenis] = useState("hadir");
  const [tema, setTema] = useState("hijau");
  const [format, setFormat] = useState("potret");
  const [iTujuan, setITujuan] = useState(0);
  const [d, setD] = useState(() => dariTemplat("hadir", { pengajar, kelas: tujuan[0]?.nama || "", tautan: "" }));
  const [teksManual, setTeksManual] = useState(null);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");
  const [petunjuk, setPetunjuk] = useState(null);
  const [siap, setSiap] = useState(false);
  const wadah = useRef(null);
  const blobRef = useRef(null);
  const nomor = useRef(0);

  const tj = tujuan[iTujuan] || null;
  const teksOtomatis = useMemo(() => susunTeksWa(d), [d]);
  const teks = teksManual ?? teksOtomatis;
  const ubah = (kunci, nilai) => setD((x) => ({ ...x, [kunci]: nilai }));
  const ubahBaris = (i, kunci, nilai) => setD((x) => ({ ...x, baris: x.baris.map((b, k) => (k === i ? { ...b, [kunci]: nilai } : b)) }));

  function pilihJenis(j) {
    const host = typeof window !== "undefined" ? `${window.location.host}/dashboard` : "";
    setJenis(j); setTeksManual(null); setPetunjuk(null);
    setD((x) => dariTemplat(j, { pengajar: pengajar || x.penandatangan || "", kelas: x.kelas, tautan: host }));
  }
  function pilihTujuan(i) {
    setITujuan(i); setPetunjuk(null);
    if (tujuan[i]) ubah("kelas", tujuan[i].nama);
  }

  // Pratinjau: digambar ulang sebentar setelah isian berhenti diubah.
  useEffect(() => {
    const id = ++nomor.current;
    setSiap(false);
    const t = setTimeout(async () => {
      try {
        const { buatFlyer } = await import("@/lib/gambarFlyer");
        const k = await buatFlyer(d, format, tema);
        if (id !== nomor.current || !wadah.current) return;
        k.style.width = "100%"; k.style.height = "auto"; k.style.display = "block";
        wadah.current.replaceChildren(k);
        k.toBlob((b) => { if (id === nomor.current) { blobRef.current = b; setSiap(!!b); } }, "image/png");
        setGalat("");
      } catch { if (id === nomor.current) setGalat("Pratinjau gagal dibuat. Muat ulang halaman lalu coba lagi."); }
    }, 280);
    return () => clearTimeout(t);
  }, [d, format, tema]);

  const berkas = NAMA_BERKAS(jenis, tj?.nama || d.kelas);

  function simpan() {
    const b = blobRef.current; if (!b) return;
    const url = URL.createObjectURL(b), a = document.createElement("a");
    a.href = url; a.download = berkas; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  async function salinTeks() {
    try { await navigator.clipboard.writeText(teks); setInfo("Teks pengumuman disalin."); } catch { setInfo("Gagal menyalin. Tekan lama pada teks lalu salin manual."); }
    setTimeout(() => setInfo(""), 3500);
  }
  async function kirim() {
    const b = blobRef.current; if (!b) return;
    setPetunjuk(null); setInfo("");
    const file = new File([b], berkas, { type: "image/png" });
    // Ponsel: lembar bagikan bawaan, pilih WhatsApp lalu grupnya (gambar dan teks terbawa sekaligus).
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: teks, title: d.judul }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    // Komputer: salin gambar ke papan klip, unduh cadangan, buka grup WhatsApp.
    let tersalin = false;
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); tersalin = true; } catch { /* peramban tidak mengizinkan */ }
    simpan();
    if (tj) window.open(tj.link, "_blank", "noopener");
    setPetunjuk({ tersalin });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      {/* ---------------- Formulir ---------------- */}
      <div className="order-2 space-y-5 lg:order-1">
        <section className="kartu space-y-3">
          <h2 className="font-semibold text-hijau">1. Pilih templat</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Templat pengumuman">
            {Object.entries(JENIS).map(([k, v]) => (
              <button key={k} type="button" onClick={() => pilihJenis(k)} aria-pressed={jenis === k}
                className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-medium transition ${jenis === k ? "border-hijau bg-hijau text-white" : "border-hijau/20 bg-white text-hijau hover:bg-hijau-muda"}`}>{v.label}</button>
            ))}
          </div>
          <p className="text-xs text-tinta/60">Mengganti templat mengganti isian di bawah dengan contoh isi templat tersebut.</p>
        </section>

        <section className="kartu space-y-4">
          <h2 className="font-semibold text-hijau">2. Isi pengumuman</h2>
          <div><label className="label" htmlFor="fl-judul">Judul</label><input id="fl-judul" className="input" value={d.judul} maxLength={90} onChange={(e) => ubah("judul", e.target.value)} /></div>
          <div><label className="label" htmlFor="fl-kelas">Untuk kelas / grup</label><input id="fl-kelas" className="input" value={d.kelas} maxLength={60} onChange={(e) => ubah("kelas", e.target.value)} placeholder="Contoh: Kelas Imam Sibawaih (boleh dikosongkan)" /></div>
          <div><label className="label" htmlFor="fl-isi">Kalimat pengantar</label><textarea id="fl-isi" className="input !min-h-[96px] py-3" rows={3} value={d.isi} maxLength={400} onChange={(e) => ubah("isi", e.target.value)} /></div>

          <fieldset className="space-y-2">
            <legend className="label">Rincian (hari, waktu, tempat, dan lain-lain)</legend>
            {d.baris.map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-hijau/15 bg-krem/60 p-2 sm:grid-cols-[170px_1fr_auto]">
                <input aria-label={`Nama rincian ${i + 1}`} className="input !min-h-[44px] sm:col-auto" value={b.label} maxLength={30} onChange={(e) => ubahBaris(i, "label", e.target.value)} />
                <button type="button" aria-label={`Hapus rincian ${b.label || i + 1}`} onClick={() => setD((x) => ({ ...x, baris: x.baris.filter((_, k) => k !== i) }))} className="order-2 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50 sm:order-3">Hapus</button>
                <input aria-label={`Isi rincian ${b.label || i + 1}`} className="input !min-h-[44px] col-span-2 sm:order-2 sm:col-span-1" type={b.tipe === "tanggal" ? "date" : "text"} value={b.nilai} maxLength={140} onChange={(e) => ubahBaris(i, "nilai", e.target.value)} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={tombolGaris} onClick={() => setD((x) => ({ ...x, baris: [...x.baris, { label: "", nilai: "", tipe: "teks" }] }))}>+ Tambah rincian</button>
              <button type="button" className={tombolGaris} onClick={() => setD((x) => ({ ...x, baris: [...x.baris, { label: "Tanggal", nilai: "", tipe: "tanggal" }] }))}>+ Tambah tanggal</button>
            </div>
            <p className="text-xs text-tinta/60">Rincian yang isinya kosong tidak ditampilkan di flyer.</p>
          </fieldset>

          <div><label className="label" htmlFor="fl-ajakan">Kalimat penutup / ajakan</label><input id="fl-ajakan" className="input" value={d.ajakan} maxLength={120} onChange={(e) => ubah("ajakan", e.target.value)} /></div>
          <div><label className="label" htmlFor="fl-tautan">Tautan di flyer (opsional)</label><input id="fl-tautan" className="input" value={d.tautan} maxLength={80} onChange={(e) => ubah("tautan", e.target.value)} placeholder="Contoh: alamat situs atau tautan Zoom" /></div>
          <div><label className="label" htmlFor="fl-ttd">Nama penandatangan</label><input id="fl-ttd" className="input" value={d.penandatangan} maxLength={60} onChange={(e) => ubah("penandatangan", e.target.value)} placeholder={admin ? "Contoh: Admin KBA-UMM" : "Nama pengajar"} /></div>
        </section>

        <section className="kartu space-y-4">
          <h2 className="font-semibold text-hijau">3. Tampilan</h2>
          <div>
            <p className="label">Warna</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Warna flyer">
              {Object.entries(TEMA).map(([k, v]) => (
                <button key={k} type="button" aria-pressed={tema === k} onClick={() => setTema(k)}
                  className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-medium ${tema === k ? "border-hijau bg-hijau-muda text-hijau-tua" : "border-hijau/20 bg-white text-tinta/80 hover:bg-krem"}`}>{v.label}</button>
              ))}
            </div>
          </div>
          <div><label className="label" htmlFor="fl-format">Ukuran gambar</label>
            <select id="fl-format" className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
              {Object.entries(FORMAT_FLYER).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
        </section>

        <section className="kartu space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-hijau">Teks pengumuman (untuk WhatsApp)</h2>
            {teksManual != null && <button type="button" className="text-sm font-semibold text-hijau underline" onClick={() => setTeksManual(null)}>Setel ulang teks</button>}
          </div>
          <textarea aria-label="Teks pengumuman" className="input !min-h-[220px] py-3 font-mono text-sm leading-relaxed" value={teks} onChange={(e) => setTeksManual(e.target.value)} />
          <p className="text-xs text-tinta/60">Teks dibuat otomatis dari isian di atas dan boleh Anda sunting. Tanda * dan _ akan menjadi huruf tebal dan miring di WhatsApp.</p>
        </section>
      </div>

      {/* ---------------- Pratinjau + kirim ---------------- */}
      <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start" aria-label="Pratinjau dan pengiriman">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(20,88,42,.45)] ring-1 ring-hijau/15">
          <div ref={wadah} className="flex min-h-[200px] items-center justify-center text-sm text-tinta/50" role="img" aria-label="Pratinjau flyer">Menyiapkan pratinjau…</div>
        </div>
        {galat && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{galat}</p>}

        <div className="kartu space-y-3">
          <h2 className="font-semibold text-hijau">Kirim ke grup WhatsApp</h2>
          {tujuan.length > 0 ? (
            <div><label className="label" htmlFor="fl-tujuan">Grup tujuan</label>
              <select id="fl-tujuan" className="input" value={iTujuan} onChange={(e) => pilihTujuan(Number(e.target.value))}>
                {tujuan.map((t, i) => <option key={t.link} value={i}>{t.nama}</option>)}
              </select></div>
          ) : (
            <p className="rounded-2xl bg-kuning/20 p-3 text-sm text-hijau-tua">Tautan grup WhatsApp untuk kelas Anda belum tersedia. Minta admin mengisinya di menu Kelas &amp; Grup. Flyer tetap bisa diunduh dan dibagikan manual.</p>
          )}
          <button type="button" onClick={kirim} disabled={!siap} className="btn-hijau w-full disabled:opacity-60">Kirim ke WhatsApp</button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={simpan} disabled={!siap} className={tombolGaris}>Unduh PNG</button>
            <button type="button" onClick={salinTeks} className={tombolGaris}>Salin teks</button>
          </div>
          {tj && <a href={tj.link} target="_blank" rel="noopener noreferrer" className="block text-center text-sm font-semibold text-hijau underline">Buka grup {tj.nama}</a>}
          {info && <p role="status" className="text-sm font-medium text-hijau">{info}</p>}
          {petunjuk && (
            <ol className="list-decimal space-y-1 rounded-2xl bg-hijau-muda p-3 pl-7 text-sm text-hijau-tua">
              <li>{petunjuk.tersalin ? "Gambar flyer sudah disalin dan juga diunduh." : "Gambar flyer sudah diunduh."}</li>
              <li>Di grup WhatsApp yang terbuka, {petunjuk.tersalin ? "klik kolom pesan lalu tekan Ctrl+V" : "lampirkan gambar yang baru diunduh"}.</li>
              <li>Tekan <b>Salin teks</b>, lalu tempel sebagai keterangan gambar dan kirim.</li>
            </ol>
          )}
          <p className="text-xs leading-relaxed text-tinta/60">Di ponsel, tombol kirim membuka menu bagikan: pilih WhatsApp lalu grupnya, gambar dan teks ikut terbawa. Situs tidak dapat mengirim ke WhatsApp secara otomatis, jadi tahap memilih grup dan menekan kirim tetap dilakukan di WhatsApp.</p>
        </div>
      </aside>
    </div>
  );
}

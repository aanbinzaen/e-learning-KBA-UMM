"use client";
import { useEffect, useRef, useState } from "react";
import BilahFormat from "@/components/BilahFormat";
import { tombolPintas } from "@/lib/formatTeks";
import { bacaDiagram, buatGambarDiagram, UKURAN, DAFTAR_TEMA, DAFTAR_TATA, DAFTAR_RATA, DAFTAR_GAYA, DAFTAR_RATA_KOTAK, CONTOH_DIAGRAM, CONTOH_CATATAN } from "@/lib/diagram";

const CONTOH_ARAB = "الكلام | قول مفيد\n  الاسم\n    مرفوع\n    منصوب\n    مجرور\n  الفعل\n    ماض\n    مضارع\n    أمر\n  الحرف";
const slug = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "hierarki";
const NAMA_ARAH = { v: "atas ke bawah", kk: "kiri ke kanan", rtl: "kanan ke kiri" };

export default function PembuatDiagram() {
  const [judul, setJudul] = useState("Pembagian Kata dalam Bahasa Arab");
  const [teks, setTeks] = useState(CONTOH_DIAGRAM);
  const [catatan, setCatatan] = useState(CONTOH_CATATAN);
  const [rata, setRata] = useState("otomatis");
  const [gayaNama, setGayaNama] = useState("otomatis");
  const [gayaKet, setGayaKet] = useState("otomatis");
  const [gayaCatatan, setGayaCatatan] = useState("otomatis");
  const [rataKotak, setRataKotak] = useState("tengah");
  const [ukuran, setUkuran] = useState("lanskap169");
  const [tata, setTata] = useState("otomatis");
  const [tema, setTema] = useState("terang");
  const [piksel, setPiksel] = useState(1);
  const [info, setInfo] = useState(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [bisaBagi, setBisaBagi] = useState(false);
  const kanvasRef = useRef(null);
  const isiRef = useRef(null);
  const catRef = useRef(null);
  const urutan = useRef(0);
  const opsiDasar = { judul, ukuran, tata, tema, catatan, rataCatatan: rata, gayaNama, gayaKet, gayaCatatan, rataKotak, situs: process.env.NEXT_PUBLIC_SITE_URL };

  useEffect(() => {
    try { setBisaBagi(!!(navigator.canShare && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }))); } catch { /* tidak didukung */ }
  }, []);

  // Pratinjau langsung (ditunda sebentar agar tidak berat saat mengetik)
  useEffect(() => {
    const id = ++urutan.current;
    const t = setTimeout(async () => {
      const h = bacaDiagram(teks, judul);
      if (h.galat) { setGalat(h.galat); setInfo(null); return; }
      try {
        const r = await buatGambarDiagram(h, { ...opsiDasar, piksel: 1 });
        if (id !== urutan.current || !kanvasRef.current) return;
        const c = kanvasRef.current;
        c.width = r.kanvas.width; c.height = r.kanvas.height;
        c.getContext("2d").drawImage(r.kanvas, 0, 0);
        setGalat(""); setInfo({ jumlah: h.jumlah, jenjang: h.jenjang, arah: r.arah, skala: r.skala });
      } catch { if (id === urutan.current) setGalat("Pratinjau gagal dibuat."); }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teks, judul, catatan, rata, gayaNama, gayaKet, gayaCatatan, rataKotak, ukuran, tata, tema]);

  async function buatBlob() {
    const h = bacaDiagram(teks, judul);
    if (h.galat) throw new Error(h.galat);
    const r = await buatGambarDiagram(h, { ...opsiDasar, piksel });
    return new Promise((ok) => r.kanvas.toBlob(ok, "image/png"));
  }
  const namaBerkas = () => `diagram-${slug(judul)}-${ukuran}${piksel === 2 ? "-hd" : ""}.png`;

  async function unduh() {
    setSibuk(true); setGalat("");
    try {
      const blob = await buatBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = namaBerkas(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { setGalat(e.message || "Gambar gagal dibuat. Coba kualitas Standar."); }
    setSibuk(false);
  }
  async function bagikan() {
    setSibuk(true); setGalat("");
    try {
      const blob = await buatBlob();
      await navigator.share({ files: [new File([blob], namaBerkas(), { type: "image/png" })], title: judul || "Diagram hierarki" });
    } catch (e) { if (e?.name !== "AbortError") setGalat("Gagal membagikan. Gunakan tombol Unduh PNG."); }
    setSibuk(false);
  }

  const pilih = "input";
  return (
    <div className="space-y-5">
      <section className="kartu space-y-4">
        <div><label className="label" htmlFor="judul-dg">Judul diagram (opsional)</label>
          <input id="judul-dg" dir="auto" value={judul} onChange={(e) => setJudul(e.target.value)} maxLength={120} className="input" /></div>
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <label className="label !mb-0" htmlFor="teks-dg">Isi diagram (satu butir per baris)</label>
            <span className="flex gap-3 text-sm font-medium text-hijau">
              <button type="button" onClick={() => { setTeks(CONTOH_DIAGRAM); setJudul("Pembagian Kata dalam Bahasa Arab"); setCatatan(CONTOH_CATATAN); }} className="underline">Contoh</button>
              <button type="button" onClick={() => { setTeks(CONTOH_ARAB); setJudul("أقسام الكلام"); setCatatan("ينقسم الكلام إلى ثلاثة أقسام."); setTata("kanan-kiri"); }} className="underline">Contoh Arab</button>
              <button type="button" onClick={() => { setTeks(""); setCatatan(""); }} className="underline">Kosongkan</button>
            </span>
          </div>
          <BilahFormat taRef={isiRef} nilai={teks} setNilai={setTeks} />
          <textarea id="teks-dg" ref={isiRef} onKeyDown={(e) => tombolPintas(e, isiRef.current, teks, setTeks)} rows="11" dir="auto" value={teks} onChange={(e) => setTeks(e.target.value)} className="input !py-3 font-mono text-sm leading-relaxed" placeholder={"Kalam\n  Isim\n  Fi'il\n    Madhi\n    Mudhari'\n  Harf"} spellCheck={false} />
          <p className="mt-2 text-xs leading-relaxed text-tinta/60">Tandai anak dengan <b>spasi di depan</b> (dua spasi tiap jenjang), atau gunakan nomor <b>1</b>, <b>1.1</b>, <b>1.2.1</b>. Tanda - atau * di depan butir boleh dipakai. Jika ada beberapa butir di jenjang teratas, judul menjadi induknya.</p>
          <p className="mt-2 rounded-2xl bg-hijau-muda px-4 py-3 text-xs leading-relaxed text-hijau-tua"><b>Keterangan di dalam kotak:</b> tambahkan tanda <b>|</b> lalu tulisan singkat, misalnya <span className="font-mono">Isim | kata benda</span>. Tulisan setelah tanda | tampil kecil di bawah nama.</p>
          <p className="mt-2 rounded-2xl bg-hijau-muda px-4 py-3 text-xs leading-relaxed text-hijau-tua"><b>Tebal dan miring:</b> blok kata atau kalimat, lalu tekan <b>Ctrl+B</b> (tebal) atau <b>Ctrl+I</b> (miring); <b>Ctrl+Spasi</b> menghapus gaya. Di kolom ini gaya tampak sebagai tanda <span className="font-mono">**tebal**</span> dan <span className="font-mono">*miring*</span>; hasilnya terlihat di pratinjau di bawah. Miring hanya untuk tulisan Latin.</p>
        </div>
      </section>

      <section className="kartu">
        <label className="label" htmlFor="cat-dg">Keterangan diagram (opsional)</label>
        <BilahFormat taRef={catRef} nilai={catatan} setNilai={setCatatan} />
        <textarea id="cat-dg" ref={catRef} onKeyDown={(e) => tombolPintas(e, catRef.current, catatan, setCatatan)} rows="3" dir="auto" value={catatan} onChange={(e) => setCatatan(e.target.value)} maxLength={600} className="input !py-3" placeholder="Catatan singkat yang tampil di bagian bawah gambar, misalnya penjelasan atau sumber materi." />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium" htmlFor="rata-dg">Rata tulisan keterangan</label>
          <select id="rata-dg" value={rata} onChange={(e) => setRata(e.target.value)} className="input !w-auto">{DAFTAR_RATA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <p className="mt-2 text-xs text-tinta/60">Tampil sebagai kotak catatan di atas pita bawah, maksimal sekitar 5 baris. Boleh memuat kalimat Indonesia dan kata Arab sekaligus.</p>
      </section>

      <section className="kartu space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Gaya tulisan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="gn-dg">Nama butir (judul di dalam kotak)</label>
          <select id="gn-dg" value={gayaNama} onChange={(e) => setGayaNama(e.target.value)} className={pilih}>{DAFTAR_GAYA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="gk-dg">Keterangan di dalam kotak</label>
          <select id="gk-dg" value={gayaKet} onChange={(e) => setGayaKet(e.target.value)} className={pilih}>{DAFTAR_GAYA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="gc-dg">Keterangan diagram (kotak bawah)</label>
          <select id="gc-dg" value={gayaCatatan} onChange={(e) => setGayaCatatan(e.target.value)} className={pilih}>{DAFTAR_GAYA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="rk-dg">Rata tulisan di dalam kotak</label>
          <select id="rk-dg" value={rataKotak} onChange={(e) => setRataKotak(e.target.value)} className={pilih}>{DAFTAR_RATA_KOTAK.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        </div>
        <p className="text-xs leading-relaxed text-tinta/60">Pilihan <b>Otomatis</b> memakai gaya bawaan. Gaya <b>miring</b> hanya berlaku untuk tulisan Latin; huruf Arab tetap tegak. Tulisan yang Anda blok dengan Ctrl+B atau Ctrl+I ditambahkan pada pilihan di sini.</p>
      </section>

      <section className="kartu grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="uk">Ukuran gambar</label>
          <select id="uk" value={ukuran} onChange={(e) => setUkuran(e.target.value)} className={pilih}>{Object.entries(UKURAN).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.w}×{v.h})</option>)}</select></div>
        <div><label className="label" htmlFor="tt">Tata letak</label>
          <select id="tt" value={tata} onChange={(e) => setTata(e.target.value)} className={pilih}>{DAFTAR_TATA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="tm">Warna</label>
          <select id="tm" value={tema} onChange={(e) => setTema(e.target.value)} className={pilih}>{DAFTAR_TEMA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="kl">Kualitas unduhan</label>
          <select id="kl" value={piksel} onChange={(e) => setPiksel(Number(e.target.value))} className={pilih}><option value={1}>Standar</option><option value={2}>HD (2×, untuk dicetak)</option></select></div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-hijau">Pratinjau</h2>
          {info && <p className="text-xs text-tinta/60">{info.jumlah} butir · {info.jenjang} jenjang · tata letak {NAMA_ARAH[info.arah]}</p>}
        </div>
        {galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{galat}</p>}
        {info && info.skala < 0.45 && <p className="rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-900">Diagram cukup besar sehingga tulisan jadi kecil. Coba ukuran 16:9 atau 9:16, tata letak lain, atau kurangi jumlah butir.</p>}
        <div className="overflow-hidden rounded-2xl border border-hijau/20 bg-white shadow">
          <canvas ref={kanvasRef} className="block h-auto w-full" aria-label="Pratinjau diagram hierarki" />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={unduh} disabled={sibuk || !!galat} className="btn-kuning disabled:opacity-60">{sibuk ? "Membuat gambar…" : "Unduh PNG"}</button>
          {bisaBagi && <button type="button" onClick={bagikan} disabled={sibuk || !!galat} className="btn-garis !border-hijau !text-hijau disabled:opacity-60">Bagikan gambar</button>}
        </div>
        {piksel === 2 && <p className="text-xs text-tinta/60">Kualitas HD membuat berkas besar dan butuh memori lebih banyak. Bila gagal di HP, gunakan Standar.</p>}
      </section>
    </div>
  );
}

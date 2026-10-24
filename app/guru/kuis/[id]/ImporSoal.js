"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseTeks, dariBaris, CONTOH_TEKS, KOLOM_TEMPLATE, CONTOH_BARIS } from "@/lib/soal";
import { imporSoal } from "@/app/guru/actions";
import { useReaksiHasil } from "@/lib/useReaksi";

const rapikan = (h) => String(h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");

async function bacaBerkas(file) {
  const nama = file.name.toLowerCase();
  if (nama.endsWith(".txt")) return parseTeks(await file.text());
  if (nama.endsWith(".xlsx")) {
    const { default: readXlsx } = await import("read-excel-file");
    const baris = await readXlsx(file);
    const kepala = baris[0].map(rapikan);
    return dariBaris(baris.slice(1).map((r) => Object.fromEntries(kepala.map((k, i) => [k, r[i] ?? ""]))));
  }
  const Papa = (await import("papaparse")).default;
  const rows = await new Promise((ok, gagal) => Papa.parse(file, { header: true, skipEmptyLines: true, transformHeader: rapikan, complete: (r) => ok(r.data), error: gagal }));
  return dariBaris(rows);
}

function unduhTemplate() {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const isi = "\uFEFF" + [KOLOM_TEMPLATE, ...CONTOH_BARIS].map((r) => r.map(esc).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  a.download = "templat-soal-kbumm.csv"; a.click();
}

export default function ImporSoal({ kuisId }) {
  const [teks, setTeks] = useState("");
  const [daftar, setDaftar] = useState(null);
  const [pesan, setPesan] = useState(null);
  const [sibuk, setSibuk] = useState(false);
  const router = useRouter();
  useReaksiHasil(pesan);
  const valid = (daftar || []).filter((d) => d.nilai);

  async function pilihBerkas(e) {
    const file = e.target.files?.[0];
    setPesan(null); setDaftar(null);
    if (!file) return;
    try { setSibuk(true); setDaftar(await bacaBerkas(file)); }
    catch { setPesan({ galat: "Berkas tidak bisa dibaca. Gunakan .csv, .xlsx, atau .txt sesuai contoh." }); }
    setSibuk(false);
  }
  function bacaTeks() {
    setPesan(null);
    const d = parseTeks(teks);
    if (!d.length) return setPesan({ galat: "Tidak ada soal terbaca. Mulai tiap soal dengan nomor, misalnya 1. atau 2)" });
    setDaftar(d);
  }
  async function simpan() {
    setSibuk(true); setPesan(null);
    const r = await imporSoal(kuisId, valid.map((d) => d.nilai));
    setSibuk(false); setPesan(r);
    if (r.ok) { setDaftar(null); setTeks(""); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl bg-hijau-muda p-4 text-sm leading-relaxed">
        <p><b>Cara 1, berkas:</b> unggah .csv, .xlsx (kolom: {KOLOM_TEMPLATE.join(", ")}) atau .txt.</p>
        <p><b>Cara 2, tempel teks</b> dari Word atau catatan, dengan format di bawah.</p>
        <button type="button" onClick={unduhTemplate} className="btn-garis !min-h-[44px] !border-hijau !text-hijau">Unduh templat CSV</button>
      </div>
      <div><label className="label" htmlFor="berkas-soal">Unggah berkas soal</label><input id="berkas-soal" type="file" accept=".csv,.xlsx,.txt" onChange={pilihBerkas} disabled={sibuk} className="input !py-2.5" /></div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2"><label className="label !mb-0" htmlFor="teks-soal">Atau tempel teks soal</label>
          <button type="button" onClick={() => setTeks(CONTOH_TEKS)} className="text-sm font-medium text-hijau underline">Isi contoh format</button></div>
        <textarea id="teks-soal" rows="10" dir="auto" value={teks} onChange={(e) => setTeks(e.target.value)} className="input !py-3 font-mono text-sm" placeholder={"1. Pertanyaan?\nA. pilihan\nB. pilihan\n*C. pilihan benar\nPembahasan: ..."} />
        <button type="button" onClick={bacaTeks} disabled={!teks.trim()} className="btn-hijau mt-2 w-full disabled:opacity-50">Baca soal dari teks</button>
        <p className="mt-2 text-xs text-tinta/60">Tanda * di depan pilihan, atau baris "Jawaban: C", menentukan jawaban benar. Soal tanpa pilihan menjadi esai (atau tulis [Esai] setelah nomor). Opsional: "Bobot: 2", "Kunci: ...", "Pembahasan: ...".</p>
      </div>

      {daftar && (
        <div className="space-y-3">
          <p className="font-semibold text-hijau-tua">Pratinjau: {valid.length} soal siap disimpan{daftar.length - valid.length > 0 ? `, ${daftar.length - valid.length} perlu diperbaiki` : ""}</p>
          <ul className="max-h-96 space-y-2 overflow-auto">
            {daftar.map((d, i) => (
              <li key={i} className={`rounded-2xl border-2 px-4 py-3 text-sm ${d.galat ? "border-red-300 bg-red-50" : "border-hijau/20"}`}>
                <p dir="auto"><b>{d.galat ? "✗" : "✓"} Soal {d.nomor}</b> · {d.tipe === "esai" ? "Esai" : "Pilihan ganda"}{d.nilai ? ` · bobot ${d.nilai.bobot}` : ""}</p>
                <p className="text-tinta/80" dir="auto">{d.pratinjau}</p>
                {d.galat && <p className="font-medium text-red-700">{d.galat}</p>}
              </li>
            ))}
          </ul>
          <button type="button" onClick={simpan} disabled={sibuk || !valid.length} className="btn-kuning w-full disabled:opacity-50">{sibuk ? "Menyimpan…" : `Simpan ${valid.length} soal`}</button>
          {daftar.length > valid.length && <p className="text-xs text-tinta/60">Soal yang bertanda ✗ tidak ikut disimpan. Perbaiki di berkas/teks lalu baca ulang, atau tambahkan manual.</p>}
        </div>
      )}
      {pesan?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan.galat}</p>}
      {pesan?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{pesan.ok}</p>}
    </div>
  );
}

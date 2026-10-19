"use client";
import { useState } from "react";
import Link from "next/link";
import { pratinjau, impor } from "./actions";

const KOLOM = ["jenis_kelamin", "nama_lengkap", "kelas", "grup", "pengajar", "email", "whatsapp"];
const WARNA = { baru: "bg-hijau-muda text-hijau-tua", duplikat: "bg-yellow-100 text-yellow-800", gagal: "bg-red-100 text-red-700", berhasil: "bg-hijau-muda text-hijau-tua" };

async function bacaBerkas(file) {
  const nama = file.name.toLowerCase();
  const rapikan = (h) => String(h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
  if (nama.endsWith(".xlsx")) {
    const { default: readXlsx } = await import("read-excel-file");
    const baris = await readXlsx(file);
    const kepala = baris[0].map(rapikan);
    return baris.slice(1).map((r) => Object.fromEntries(kepala.map((k, i) => [k, r[i] ?? ""])));
  }
  const Papa = (await import("papaparse")).default;
  return new Promise((ok, gagal) =>
    Papa.parse(file, { header: true, skipEmptyLines: true, transformHeader: rapikan, complete: (r) => ok(r.data), error: gagal })
  );
}

function unduhCSV(nama, baris) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const isi = "\uFEFF" + baris.map((r) => r.map(esc).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([isi], { type: "text/csv;charset=utf-8" }));
  a.download = nama; a.click();
}

export default function FormImpor() {
  const [mentah, setMentah] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [laporan, setLaporan] = useState(null);
  const [sibuk, setSibuk] = useState("");
  const [galat, setGalat] = useState("");

  async function pilih(e) {
    const file = e.target.files?.[0];
    setHasil(null); setLaporan(null); setGalat("");
    if (!file) return;
    try {
      setSibuk("Membaca berkas…");
      const rows = (await bacaBerkas(file)).map((r, i) => ({ ...r, __baris: i + 2 }));
      const hilang = KOLOM.filter((k) => rows[0] && !(k in rows[0]));
      if (hilang.length) throw new Error(`Kolom tidak ditemukan: ${hilang.join(", ")}`);
      setMentah(rows);
      setSibuk("Memeriksa data…");
      const r = await pratinjau(rows);
      if (r.galat) throw new Error(r.galat);
      setHasil(r.hasil);
    } catch (err) { setGalat(err.message || "Berkas tidak bisa dibaca."); setMentah(null); }
    setSibuk("");
  }

  async function mulai() {
    const rows = mentah.filter((_, i) => hasil[i].status === "baru");
    const semua = [];
    try {
      for (let i = 0; i < rows.length; i += 15) {
        setSibuk(`Membuat akun ${Math.min(i + 15, rows.length)} dari ${rows.length}…`);
        const r = await impor(rows.slice(i, i + 15));
        if (r.galat) throw new Error(r.galat);
        semua.push(...r.hasil);
      }
    } catch (err) { setGalat(err.message); }
    setLaporan(semua); setSibuk("");
  }

  const hitung = (s) => (hasil || []).filter((h) => h.status === s).length;
  const gagalLap = (laporan || []).filter((x) => x.status === "gagal");

  return (
    <div className="space-y-5">
      <div className="kartu">
        <label htmlFor="berkas" className="label">Pilih berkas CSV atau Excel (.xlsx)</label>
        <input id="berkas" type="file" accept=".csv,.xlsx" onChange={pilih} disabled={!!sibuk} className="input !py-2.5" />
        <p className="mt-2 text-sm text-tinta/70">Kolom wajib: {KOLOM.join(", ")}. Email dan WhatsApp boleh kosong.</p>
      </div>
      {sibuk && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 font-medium text-hijau-tua">{sibuk}</p>}
      {galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">{galat}</p>}

      {hasil && !laporan && (
        <div className="kartu space-y-4">
          <h2 className="text-lg font-semibold text-hijau">Pratinjau</h2>
          <p className="text-sm">Siap diimpor: <b>{hitung("baru")}</b> · Duplikat (dilewati): <b>{hitung("duplikat")}</b> · Gagal: <b>{hitung("gagal")}</b></p>
          <div className="max-h-96 overflow-auto rounded-2xl border border-hijau/15">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-hijau-muda"><tr><th className="p-2">Baris</th><th className="p-2">Nama</th><th className="p-2">Grup</th><th className="p-2">Status</th><th className="p-2">Catatan</th></tr></thead>
              <tbody>{hasil.map((h) => (
                <tr key={h.baris} className="border-t border-hijau/10">
                  <td className="p-2">{h.baris}</td><td className="p-2">{h.nama}</td><td className="p-2">{h.grup}</td>
                  <td className="p-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${WARNA[h.status]}`}>{h.status}</span></td>
                  <td className="p-2 text-tinta/70">{h.pesan}</td>
                </tr>))}
              </tbody>
            </table>
          </div>
          <button onClick={mulai} disabled={!!sibuk || hitung("baru") === 0} className="btn-hijau w-full disabled:opacity-50">
            Impor {hitung("baru")} peserta
          </button>
        </div>
      )}

      {laporan && (
        <div className="kartu space-y-4">
          <h2 className="text-lg font-semibold text-hijau">Laporan impor</h2>
          <p>Berhasil: <b>{laporan.filter((x) => x.status === "berhasil").length}</b> · Duplikat: <b>{laporan.filter((x) => x.status === "duplikat").length}</b> · Gagal: <b>{gagalLap.length}</b></p>
          {gagalLap.length > 0 && (
            <>
              <ul className="space-y-1 text-sm text-red-700">{gagalLap.map((x) => <li key={x.baris}>Baris {x.baris} ({x.nama}): {x.pesan}</li>)}</ul>
              <button className="btn-garis !border-hijau !text-hijau" onClick={() => unduhCSV("baris-gagal.csv", [["baris", "nama", "grup", "alasan"], ...gagalLap.map((x) => [x.baris, x.nama, x.grup, x.pesan])])}>Unduh baris gagal (CSV)</button>
            </>
          )}
          <Link href="/admin/kredensial" className="btn-kuning w-full">Lihat kode dan password awal</Link>
        </div>
      )}
    </div>
  );
}

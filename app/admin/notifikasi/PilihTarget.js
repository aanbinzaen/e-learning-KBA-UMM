"use client";
import { useState } from "react";

// Pilihan penerima: semua pengguna, atau beberapa kelas (grup) sekaligus
function Daftar({ judul, isi, dipilih, ubah }) {
  if (!isi.length) return null;
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-semibold text-hijau-tua">{judul}</legend>
      {isi.map((g) => (
        <label key={g.id} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2 ${dipilih.includes(g.id) ? "border-hijau bg-hijau-muda" : "border-hijau/20 bg-white"}`}>
          <input type="checkbox" name="grup" value={g.id} checked={dipilih.includes(g.id)} onChange={() => ubah(g.id)} className="h-6 w-6 shrink-0 accent-[#1E7B34]" />
          <span className="min-w-0 flex-1 text-sm leading-snug">{g.nama}<span className="block text-xs text-tinta/60">{g.tingkat} · {g.jumlah} peserta</span></span>
        </label>
      ))}
    </fieldset>
  );
}

export default function PilihTarget({ grup }) {
  const [mode, setMode] = useState("semua");
  const [dipilih, setDipilih] = useState([]);
  const ikhwan = grup.filter((g) => g.jk === "Ikhwan"), akhwat = grup.filter((g) => g.jk === "Akhwat");
  const ubah = (id) => setDipilih((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const set = (daftar) => setDipilih([...new Set(daftar.map((g) => g.id))]);
  const jumlah = grup.filter((g) => dipilih.includes(g.id)).reduce((a, g) => a + g.jumlah, 0);
  const kecil = "min-h-[40px] rounded-xl border-2 border-hijau/25 px-3 text-sm font-medium text-hijau hover:bg-hijau-muda";

  return (
    <div className="space-y-3">
      <p className="label !mb-0">Kirim kepada</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Penerima">
        {[["semua", "Semua pengguna"], ["pilih", "Pilih kelas"]].map(([v, l]) => (
          <label key={v} className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-2xl border-2 px-4 text-sm font-medium ${mode === v ? "border-hijau bg-hijau text-white" : "border-hijau/25 text-hijau"}`}>
            <input type="radio" name="target" value={v} checked={mode === v} onChange={() => setMode(v)} className="sr-only" />{l}
          </label>
        ))}
      </div>

      {mode === "pilih" && (
        <div className="space-y-4 rounded-2xl bg-krem p-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={kecil} onClick={() => set(grup)}>Pilih semua kelas</button>
            <button type="button" className={kecil} onClick={() => set(ikhwan)}>Semua Ikhwan</button>
            <button type="button" className={kecil} onClick={() => set(akhwat)}>Semua Akhwat</button>
            <button type="button" className={kecil} onClick={() => setDipilih([])}>Kosongkan</button>
          </div>
          <Daftar judul="Ikhwan" isi={ikhwan} dipilih={dipilih} ubah={ubah} />
          <Daftar judul="Akhwat" isi={akhwat} dipilih={dipilih} ubah={ubah} />
          <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium"><input type="checkbox" name="pengajar" defaultChecked className="h-6 w-6 accent-[#1E7B34]" /> Sertakan pengajar kelas yang dipilih</label>
          <p role="status" className="text-sm font-semibold text-hijau-tua">{dipilih.length ? `${dipilih.length} kelas dipilih · ${jumlah} peserta` : "Belum ada kelas dipilih"}</p>
        </div>
      )}
    </div>
  );
}

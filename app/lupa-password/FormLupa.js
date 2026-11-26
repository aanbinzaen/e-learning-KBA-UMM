"use client";
import { useState } from "react";
import { ADMIN_KELAS, DAFTAR_KELAS, linkWaAdmin } from "@/lib/adminKelas";

export default function FormLupa() {
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [kelas, setKelas] = useState("");
  const pilih = DAFTAR_KELAS.find((x) => x.kelas === kelas);
  const teks = (k) => `Assalamu'alaikum, saya lupa password KB-UMM.\nNama: ${nama || "-"}\nKode peserta: ${kode || "-"}\nKelas: ${k || "-"}\nMohon dibantu atur ulang password. Jazakumullahu khairan.`;
  return (
    <div className="space-y-4">
      <div><label className="label" htmlFor="ln">Nama lengkap</label><input id="ln" className="input" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" /></div>
      <div><label className="label" htmlFor="lk">Kode peserta (jika ingat)</label><input id="lk" className="input" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="BISMILLAH-001" autoCapitalize="characters" /></div>
      <div>
        <label className="label" htmlFor="lkl">Kelas Anda</label>
        <select id="lkl" className="input" value={kelas} onChange={(e) => setKelas(e.target.value)}>
          <option value="">— pilih kelas —</option>
          {DAFTAR_KELAS.map((x) => <option key={x.kelas} value={x.kelas}>{x.kelas}</option>)}
          <option value="lain">Kelas lain / tidak tahu</option>
        </select>
      </div>
      {pilih && (
        <a href={linkWaAdmin(pilih.admin, teks(pilih.kelas))} target="_blank" rel="noopener noreferrer" className="btn-hijau w-full">
          Hubungi {pilih.admin.nama} lewat WhatsApp
        </a>
      )}
      {kelas === "lain" && (
        <div className="space-y-2">
          <p className="text-sm text-tinta/70">Pilih admin yang mengurus kelas Anda:</p>
          {ADMIN_KELAS.map((a) => (
            <a key={a.nama} href={linkWaAdmin(a, teks(""))} target="_blank" rel="noopener noreferrer" className="btn-garis !border-hijau !text-hijau w-full">
              {a.nama} · {a.kelas.map((k) => k.replace("Kelas ", "")).join(", ")}
            </a>
          ))}
        </div>
      )}
      <ul className="space-y-1 rounded-2xl bg-hijau-muda p-4 text-sm">
        {ADMIN_KELAS.map((a) => <li key={a.nama}><b>{a.nama}</b> ({a.tampil}): {a.kelas.join(", ")}</li>)}
      </ul>
    </div>
  );
}

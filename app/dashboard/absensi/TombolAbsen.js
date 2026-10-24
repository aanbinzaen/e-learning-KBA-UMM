"use client";
import { useState, useTransition } from "react";
import { isiAbsensi } from "./actions";
import { useReaksiHasil } from "@/lib/useReaksi";

const PILIHAN = [
  ["hadir", "Hadir", "btn-kuning w-full !min-h-[56px] text-lg"],
  ["izin", "Izin", "btn-garis w-full"],
  ["sakit", "Sakit", "btn-garis w-full"],
];
const NAMA = { hadir: "Hadir", izin: "Izin", sakit: "Sakit" };

export default function TombolAbsen({ pertemuanId, awal, dikunci }) {
  const [status, setStatus] = useState(awal);
  const [pesan, setPesan] = useState(null);
  const [sibuk, mulai] = useTransition();
  useReaksiHasil(pesan);

  if (dikunci) return <p className="rounded-2xl bg-white/15 px-4 py-3 font-medium">Dicatat oleh pengajar: {NAMA[awal]}</p>;

  function pilih(st) {
    mulai(async () => {
      const r = await isiAbsensi(pertemuanId, st);
      if (r.ok) setStatus(r.status);
      setPesan(r);
    });
  }

  return (
    <div className="space-y-3">
      {status && <p className="rounded-2xl bg-white/15 px-4 py-3 font-medium">Pilihan Anda: {NAMA[status]} ✓</p>}
      <p className="text-sm text-white/90">{status ? "Salah pilih? Ketuk pilihan lain selama absensi masih dibuka." : "Pilih salah satu:"}</p>
      <div className="grid gap-3">
        {PILIHAN.map(([nilai, label, kelas]) => (
          <button key={nilai} type="button" disabled={sibuk} aria-pressed={status === nilai} onClick={() => pilih(nilai)}
            className={`${kelas} disabled:opacity-60 ${status === nilai ? "ring-4 ring-white" : ""}`}>
            {sibuk ? "Mencatat…" : label}
          </button>
        ))}
      </div>
      {pesan && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${pesan.ok ? "bg-white/15" : "bg-red-100 text-red-800"}`}>{pesan.pesan}</p>}
    </div>
  );
}

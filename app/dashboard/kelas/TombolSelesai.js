"use client";
import { useState, useTransition } from "react";
import { ubahSelesai } from "./actions";

export default function TombolSelesai({ jenis, itemId, awal }) {
  const [selesai, setSelesai] = useState(awal);
  const [sibuk, mulai] = useTransition();
  return (
    <button
      type="button" disabled={sibuk} aria-pressed={selesai}
      onClick={() => mulai(async () => { const r = await ubahSelesai(jenis, itemId); if (!r.galat) setSelesai(r.selesai); })}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors ${selesai ? "bg-hijau text-white" : "border-2 border-hijau/30 text-hijau hover:bg-hijau-muda"}`}
    >
      <span aria-hidden>{selesai ? "✓" : "○"}</span>{selesai ? "Selesai" : "Tandai selesai"}
    </button>
  );
}

"use client";
import { useState, useTransition } from "react";
import { isiHadir } from "./actions";

export default function TombolHadir({ pertemuanId }) {
  const [hasil, setHasil] = useState(null);
  const [sibuk, mulai] = useTransition();
  return (
    <div className="space-y-2">
      <button type="button" disabled={sibuk || hasil?.ok} onClick={() => mulai(async () => setHasil(await isiHadir(pertemuanId)))}
        className="btn-kuning w-full !min-h-[56px] text-lg disabled:opacity-60">{sibuk ? "Mencatat…" : hasil?.ok ? "Tercatat ✓" : "Hadir"}</button>
      {hasil && <p role="status" className={`text-sm ${hasil.ok ? "text-hijau-tua" : "text-red-700"}`}>{hasil.pesan}</p>}
    </div>
  );
}

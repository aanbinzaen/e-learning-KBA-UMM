"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { masuk } from "./actions";
import { useReaksiHasil } from "@/lib/useReaksi";
import { AWALAN_PERAN } from "@/lib/identitas";

function Kirim() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-hijau w-full disabled:opacity-60">{pending ? "Memeriksa…" : "Masuk"}</button>;
}

const PERAN = [["peserta", "Peserta"], ["pengajar", "Pengajar"], ["admin", "Admin"]];

export default function FormMasuk() {
  const [state, aksi] = useFormState(masuk, null);
  const [lihat, setLihat] = useState(false);
  const [peran, setPeran] = useState("peserta");
  const [id, setId] = useState(AWALAN_PERAN.peserta);
  useReaksiHasil(state);
  const pilihPeran = (p) => { setPeran(p); setId(AWALAN_PERAN[p]); };
  const polaKode = /^[A-Za-z]+-\d*$/.test(id);
  return (
    <form action={aksi} className="space-y-4" noValidate>
      <div role="tablist" aria-label="Masuk sebagai" className="grid grid-cols-3 gap-2">
        {PERAN.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={peran === k} onClick={() => pilihPeran(k)}
            className={`rounded-2xl border-2 px-2 py-2.5 text-sm font-semibold ${peran === k ? "border-hijau bg-hijau text-white" : "border-hijau/25 text-hijau hover:bg-hijau-muda"}`}>{l}</button>
        ))}
      </div>
      <div>
        <label htmlFor="identitas" className="label">Kode {PERAN.find((x) => x[0] === peran)[1].toLowerCase()} — cukup tulis angkanya</label>
        <input id="identitas" name="identitas" className="input font-semibold tracking-wide" autoComplete="username" autoCapitalize="characters" inputMode={polaKode ? "numeric" : "text"}
          value={id} onChange={(e) => setId(e.target.value)} placeholder={`${AWALAN_PERAN[peran]}001`} required />
        <p className="mt-1 text-xs text-tinta/60">Email atau nomor WhatsApp juga bisa: hapus tulisan di atas lalu ketik.</p>
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <div className="relative">
          <input id="password" name="password" type={lihat ? "text" : "password"} className="input pr-24" autoComplete="current-password" required />
          <button type="button" onClick={() => setLihat(!lihat)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-medium text-hijau">{lihat ? "Sembunyikan" : "Tampilkan"}</button>
        </div>
      </div>
      {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.galat}</p>}
      <Kirim />
    </form>
  );
}

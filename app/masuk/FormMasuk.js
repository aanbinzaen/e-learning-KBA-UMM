"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { masuk } from "./actions";
import { useReaksiHasil } from "@/lib/useReaksi";

function Kirim() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-hijau w-full disabled:opacity-60">{pending ? "Memeriksa…" : "Masuk"}</button>;
}

export default function FormMasuk() {
  const [state, aksi] = useFormState(masuk, null);
  const [lihat, setLihat] = useState(false);
  useReaksiHasil(state);
  return (
    <form action={aksi} className="space-y-4" noValidate>
      <div>
        <label htmlFor="identitas" className="label">Kode peserta, email, atau nomor WhatsApp</label>
        <input id="identitas" name="identitas" className="input" autoComplete="username" autoCapitalize="characters" placeholder="BISMILLAH-001" required />
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

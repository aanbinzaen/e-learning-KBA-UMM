"use client";
import { useFormState, useFormStatus } from "react-dom";
import { gantiPassword } from "./actions";
import { useReaksiHasil } from "@/lib/useReaksi";

function Kirim() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-hijau w-full disabled:opacity-60">{pending ? "Menyimpan…" : "Simpan password"}</button>;
}
export default function FormGanti() {
  const [state, aksi] = useFormState(gantiPassword, null);
  useReaksiHasil(state);
  return (
    <form action={aksi} className="space-y-4">
      <div><label htmlFor="baru" className="label">Password baru</label>
        <input id="baru" name="baru" type="password" className="input" autoComplete="new-password" minLength={8} required /></div>
      <div><label htmlFor="ulang" className="label">Ulangi password baru</label>
        <input id="ulang" name="ulang" type="password" className="input" autoComplete="new-password" minLength={8} required /></div>
      {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.galat}</p>}
      <Kirim />
    </form>
  );
}

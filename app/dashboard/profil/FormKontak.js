"use client";
import { useFormState, useFormStatus } from "react-dom";
import { simpanKontak } from "./actions";

function Simpan() { const { pending } = useFormStatus(); return <button disabled={pending} className="btn-hijau w-full disabled:opacity-60">{pending ? "Menyimpan…" : "Simpan"}</button>; }

export default function FormKontak({ email, whatsapp }) {
  const [state, aksi] = useFormState(simpanKontak, null);
  return (
    <form action={aksi} className="space-y-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={email || ""} className="input" autoComplete="email" /></div>
      <div><label className="label" htmlFor="whatsapp">Nomor WhatsApp</label><input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={whatsapp || ""} className="input" placeholder="0812xxxxxxx" autoComplete="tel" /></div>
      {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.galat}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{state.ok}</p>}
      <Simpan />
    </form>
  );
}

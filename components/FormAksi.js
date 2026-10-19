"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";

function Kirim({ label, kelas }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={`${kelas} disabled:opacity-60`}>{pending ? "Menyimpan…" : label}</button>;
}

export default function FormAksi({ aksi, kirim = "Simpan", kelasTombol = "btn-hijau w-full", reset = false, className = "space-y-4", children }) {
  const [state, jalankan] = useFormState(aksi, null);
  const ref = useRef(null);
  useEffect(() => { if (state?.ok && reset) ref.current?.reset(); }, [state, reset]);
  return (
    <form ref={ref} action={jalankan} className={className}>
      {children}
      {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.galat}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{state.ok}</p>}
      <Kirim label={kirim} kelas={kelasTombol} />
    </form>
  );
}

"use client";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useReaksiHasil } from "@/lib/useReaksi";

function Kirim() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-kuning !min-h-[52px] shrink-0 !px-6 disabled:opacity-60">{pending ? "…" : "Kirim"}</button>;
}

// Kotak dialog: Ctrl+Enter (atau Cmd+Enter) mengirim pesan
export default function KotakPesan({ aksi }) {
  const [state, jalankan] = useFormState(aksi, null);
  const form = useRef(null), ta = useRef(null);
  useReaksiHasil(state);
  useEffect(() => { if (state?.ok) { form.current?.reset(); ta.current?.focus(); } }, [state]);
  return (
    <form ref={form} action={jalankan} className="space-y-2">
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="isi-pesan">Tulis pesan</label>
        <textarea id="isi-pesan" ref={ta} name="isi" rows="2" maxLength={3000} dir="auto" required placeholder="Tulis pesan… (Ctrl+Enter untuk kirim)"
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); form.current?.requestSubmit(); } }}
          className="input !py-3" />
        <Kirim />
      </div>
      {state?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{state.galat}</p>}
    </form>
  );
}

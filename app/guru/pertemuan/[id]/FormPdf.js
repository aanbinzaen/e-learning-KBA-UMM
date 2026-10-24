"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { simpanMateriPdf } from "@/app/guru/actions";
import { useReaksiHasil } from "@/lib/useReaksi";

const BATAS = 20 * 1024 * 1024;

export default function FormPdf({ pertemuanId, grupId }) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null);
  const formRef = useRef(null);
  const router = useRouter();
  useReaksiHasil(pesan);

  async function kirim(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("berkas"), judul = String(fd.get("judul") || "").trim();
    if (!judul) return setPesan({ galat: "Judul wajib diisi." });
    if (!file || !file.size) return setPesan({ galat: "Pilih berkas PDF." });
    if (file.type !== "application/pdf") return setPesan({ galat: "Berkas harus berformat PDF." });
    if (file.size > BATAS) return setPesan({ galat: "Ukuran maksimal 20 MB." });
    setSibuk(true); setPesan(null);
    // Unggah langsung ke Supabase Storage agar tidak terkena batas ukuran server
    const path = `${grupId}/${crypto.randomUUID()}.pdf`;
    const { error } = await supabaseBrowser().storage.from("materi").upload(path, file, { contentType: "application/pdf" });
    if (error) { setSibuk(false); return setPesan({ galat: "Gagal mengunggah. Pastikan Anda pengampu grup ini dan file di bawah 20 MB." }); }
    const r = await simpanMateriPdf(pertemuanId, grupId, judul, path);
    setSibuk(false); setPesan(r);
    if (r.ok) { formRef.current?.reset(); router.refresh(); }
  }

  return (
    <form ref={formRef} onSubmit={kirim} className="space-y-4">
      <div><label className="label" htmlFor="judul-pdf">Judul materi</label><input id="judul-pdf" name="judul" className="input" required /></div>
      <div><label className="label" htmlFor="berkas">Berkas PDF (maks. 20 MB)</label><input id="berkas" name="berkas" type="file" accept="application/pdf" className="input !py-2.5" required /></div>
      {pesan?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan.galat}</p>}
      {pesan?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{pesan.ok}</p>}
      <button disabled={sibuk} className="btn-hijau w-full disabled:opacity-60">{sibuk ? "Mengunggah…" : "Unggah PDF"}</button>
    </form>
  );
}

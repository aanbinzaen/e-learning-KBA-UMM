"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { simpanMateriGambar } from "@/app/guru/actions";
import { useReaksiHasil } from "@/lib/useReaksi";

const BATAS = 10 * 1024 * 1024;
const SISI_MAKS = 2400;

// Foto dari ponsel sering sangat besar: kecilkan ke sisi terpanjang 2400 px sebelum diunggah (jenis berkas tetap).
async function kecilkan(file) {
  try {
    const bmp = await createImageBitmap(file);
    const skala = Math.min(1, SISI_MAKS / Math.max(bmp.width, bmp.height));
    if (skala === 1 && file.size <= 2.5 * 1024 * 1024) { bmp.close?.(); return file; }
    const k = document.createElement("canvas"); k.width = Math.round(bmp.width * skala); k.height = Math.round(bmp.height * skala);
    k.getContext("2d").drawImage(bmp, 0, 0, k.width, k.height); bmp.close?.();
    const blob = await new Promise((ok) => k.toBlob(ok, file.type, 0.88));
    return blob && blob.size < file.size ? new File([blob], file.name, { type: file.type }) : file;
  } catch { return file; }
}

export default function FormGambar({ pertemuanId, grupId }) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null);
  const formRef = useRef(null);
  const router = useRouter();
  useReaksiHasil(pesan);

  async function kirim(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const judul = String(fd.get("judul") || "").trim();
    const berkas = fd.getAll("berkas").filter((f) => f && f.size);
    if (!judul) return setPesan({ galat: "Judul wajib diisi." });
    if (!berkas.length) return setPesan({ galat: "Pilih gambar PNG atau JPG." });
    if (berkas.some((f) => !["image/png", "image/jpeg"].includes(f.type))) return setPesan({ galat: "Gambar harus berformat PNG atau JPG." });
    setSibuk(true); setPesan(null);
    let sukses = 0, gagal = "";
    for (let i = 0; i < berkas.length; i++) {
      const f = await kecilkan(berkas[i]);
      if (f.size > BATAS) { gagal = "Ada gambar yang lebih dari 10 MB."; continue; }
      const png = f.type === "image/png";
      const path = `${grupId}/${crypto.randomUUID()}.${png ? "png" : "jpg"}`;
      const { error } = await supabaseBrowser().storage.from("materi").upload(path, f, { contentType: f.type });
      if (error) { gagal = "Gagal mengunggah. Pastikan SQL 14 sudah dijalankan dan Anda pengampu grup ini."; continue; }
      const r = await simpanMateriGambar(pertemuanId, grupId, berkas.length > 1 ? `${judul} (${i + 1})` : judul, path);
      if (r.ok) sukses++; else gagal = r.galat || "Gagal menyimpan.";
    }
    setSibuk(false);
    if (sukses) { setPesan({ ok: `${sukses} gambar ditambahkan.${gagal ? ` ${gagal}` : ""}` }); formRef.current?.reset(); router.refresh(); }
    else setPesan({ galat: gagal || "Gagal mengunggah." });
  }

  return (
    <form ref={formRef} onSubmit={kirim} className="space-y-4">
      <div><label className="label" htmlFor="judul-gambar">Judul materi</label><input id="judul-gambar" name="judul" className="input" required /></div>
      <div><label className="label" htmlFor="berkas-gambar">Gambar PNG atau JPG (boleh pilih beberapa, maks. 10 MB per gambar)</label>
        <input id="berkas-gambar" name="berkas" type="file" multiple accept="image/png,image/jpeg" className="input !py-2.5" required /></div>
      <p className="text-xs text-tinta/60">Foto yang terlalu besar dikecilkan otomatis agar cepat dibuka peserta. Bila memilih beberapa gambar, judulnya diberi nomor urut.</p>
      {pesan?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan.galat}</p>}
      {pesan?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{pesan.ok}</p>}
      <button disabled={sibuk} className="btn-hijau w-full disabled:opacity-60">{sibuk ? "Mengunggah…" : "Unggah gambar"}</button>
    </form>
  );
}

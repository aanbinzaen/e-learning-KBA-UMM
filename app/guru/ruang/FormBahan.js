"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import FormAksi from "@/components/FormAksi";
import { useReaksiHasil } from "@/lib/useReaksi";
import { tambahTautan, simpanBerkas } from "./actions";

const BATAS = 30 * 1024 * 1024;
const TIPE = {
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
};

function Bidang() {
  return (
    <>
      <div><label className="label">Judul</label><input name="judul" maxLength={200} className="input" placeholder="Contoh: Matan Al-Ajurrumiyyah (PDF)" required /></div>
      <div><label className="label">Jenis bahan</label>
        <select name="kategori" defaultValue="kitab" className="input"><option value="kitab">Kitab / referensi</option><option value="materi">Bahan materi</option><option value="lainnya">Lainnya</option></select></div>
      <div><label className="label">Keterangan (opsional)</label><textarea name="deskripsi" rows="2" maxLength={2000} dir="auto" className="input !py-3" placeholder="Misalnya: dipakai untuk kelas Lanjutan, bab 1 sampai 3" /></div>
    </>
  );
}

export default function FormBahan({ userId }) {
  const [mode, setMode] = useState("berkas");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(null);
  const formRef = useRef(null);
  const router = useRouter();
  useReaksiHasil(pesan);

  async function kirimBerkas(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("berkas"), judul = String(fd.get("judul") || "").trim();
    if (!judul) return setPesan({ galat: "Judul wajib diisi." });
    if (!file || !file.size) return setPesan({ galat: "Pilih berkas dulu." });
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!TIPE[ext]) return setPesan({ galat: "Jenis berkas belum didukung. Gunakan PDF, Word, PowerPoint, Excel, TXT, JPG, atau PNG." });
    if (file.size > BATAS) return setPesan({ galat: "Ukuran berkas maksimal 30 MB. Untuk berkas lebih besar, simpan di penyimpanan lain lalu tambahkan sebagai tautan." });
    setSibuk(true); setPesan(null);
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseBrowser().storage.from("ruang-pengajar").upload(path, file, { contentType: TIPE[ext] });
    if (error) { setSibuk(false); return setPesan({ galat: "Berkas gagal diunggah. Pastikan SQL 12 sudah dijalankan dan ukuran di bawah 30 MB." }); }
    const r = await simpanBerkas(path, file.name, file.size, judul, String(fd.get("kategori")), String(fd.get("deskripsi") || ""));
    setSibuk(false); setPesan(r);
    if (r.ok) { formRef.current?.reset(); router.refresh(); }
  }

  const pil = (m, l) => (
    <button type="button" onClick={() => { setMode(m); setPesan(null); }} aria-pressed={mode === m}
      className={`min-h-[44px] rounded-2xl border-2 px-4 text-sm font-medium ${mode === m ? "border-hijau bg-hijau text-white" : "border-hijau/25 text-hijau hover:bg-hijau-muda"}`}>{l}</button>
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">{pil("berkas", "Unggah berkas")}{pil("tautan", "Tambah tautan")}</div>
      {mode === "berkas" ? (
        <form ref={formRef} onSubmit={kirimBerkas} className="space-y-4">
          <Bidang />
          <div><label className="label" htmlFor="berkas-ruang">Berkas (maks. 30 MB)</label>
            <input id="berkas-ruang" name="berkas" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png" className="input !py-2.5" required /></div>
          {pesan?.galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan.galat}</p>}
          {pesan?.ok && <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-sm text-hijau-tua">{pesan.ok}</p>}
          <button disabled={sibuk} className="btn-hijau w-full disabled:opacity-60">{sibuk ? "Mengunggah…" : "Unggah ke perpustakaan"}</button>
        </form>
      ) : (
        <FormAksi aksi={tambahTautan} kirim="Simpan tautan" reset>
          <Bidang />
          <div><label className="label" htmlFor="tautan-ruang">Tautan (Google Drive, situs, YouTube, dan lainnya)</label>
            <input id="tautan-ruang" name="tautan" type="url" className="input" placeholder="https://" required /></div>
        </FormAksi>
      )}
    </div>
  );
}

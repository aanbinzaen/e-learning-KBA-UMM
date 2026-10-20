"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

// Memotong foto menjadi persegi (fokus ke bagian atas agar wajah tidak terpotong), mengecilkan ke 600 px,
// lalu mengunggah ke penyimpanan foto. Hasilnya berupa alamat gambar yang dikirim bersama formulir.
async function siapkan(file, sisi = 600) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { bmp = await createImageBitmap(file); }
  const s = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - s) / 2;
  const sy = bmp.height > bmp.width ? (bmp.height - s) * 0.2 : (bmp.height - s) / 2;
  const kanvas = document.createElement("canvas");
  kanvas.width = kanvas.height = Math.min(sisi, s);
  kanvas.getContext("2d").drawImage(bmp, sx, sy, s, s, 0, 0, kanvas.width, kanvas.height);
  return new Promise((ok) => kanvas.toBlob(ok, "image/jpeg", 0.85));
}

export default function FotoUnggah({ awal, nama, folder, name = "foto_url" }) {
  const [url, setUrl] = useState(awal || "");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  async function pilih(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setGalat("Gunakan foto JPG, PNG, atau WebP.");
    if (file.size > 15 * 1024 * 1024) return setGalat("Foto terlalu besar (maks. 15 MB sebelum dikecilkan).");
    setSibuk(true); setGalat("");
    try {
      const blob = await siapkan(file);
      const db = supabaseBrowser();
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error } = await db.storage.from("foto").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      setUrl(db.storage.from("foto").getPublicUrl(path).data.publicUrl);
    } catch { setGalat("Foto gagal diunggah. Pastikan Anda masuk sebagai admin dan SQL 08 sudah dijalankan."); }
    setSibuk(false);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar nama={nama || "?"} src={url || null} ukuran={88} />
      <div className="space-y-2">
        <input type="hidden" name={name} value={url} />
        <label className="btn-garis !min-h-[44px] cursor-pointer !border-hijau !px-4 text-sm !text-hijau">
          {sibuk ? "Mengunggah…" : url ? "Ganti foto" : "Pilih foto"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pilih} disabled={sibuk} className="sr-only" />
        </label>
        {url && !sibuk && <button type="button" onClick={() => setUrl("")} className="block text-sm font-medium text-red-700 underline">Hapus foto</button>}
        {galat && <p role="alert" className="text-sm text-red-700">{galat}</p>}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Mengecilkan foto lebar (maks. 1600 px) lalu mengunggahnya; hasilnya alamat gambar publik.
async function siapkan(file, maks = 1600) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { bmp = await createImageBitmap(file); }
  const skala = Math.min(1, maks / bmp.width);
  const k = document.createElement("canvas");
  k.width = Math.round(bmp.width * skala); k.height = Math.round(bmp.height * skala);
  k.getContext("2d").drawImage(bmp, 0, 0, k.width, k.height);
  return new Promise((ok) => k.toBlob(ok, "image/jpeg", 0.82));
}

export default function LatarUnggah({ url, onUbah }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  async function pilih(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setGalat("Gunakan foto JPG, PNG, atau WebP.");
    if (file.size > 20 * 1024 * 1024) return setGalat("Foto terlalu besar (maks. 20 MB).");
    setSibuk(true); setGalat("");
    try {
      const blob = await siapkan(file);
      const db = supabaseBrowser();
      const path = `hero/${crypto.randomUUID()}.jpg`;
      const { error } = await db.storage.from("foto").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      onUbah(db.storage.from("foto").getPublicUrl(path).data.publicUrl);
    } catch { setGalat("Foto gagal diunggah. Pastikan Anda masuk sebagai admin dan SQL 08 sudah dijalankan."); }
    setSibuk(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-garis !min-h-[44px] cursor-pointer !border-hijau !px-4 text-sm !text-hijau">
          {sibuk ? "Mengunggah…" : url ? "Ganti foto latar" : "Pilih foto latar"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pilih} disabled={sibuk} className="sr-only" />
        </label>
        {url && !sibuk && <button type="button" onClick={() => onUbah("")} className="text-sm font-medium text-red-700 underline">Hapus foto</button>}
      </div>
      {galat && <p role="alert" className="text-sm text-red-700">{galat}</p>}
    </div>
  );
}

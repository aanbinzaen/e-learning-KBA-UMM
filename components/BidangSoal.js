"use client";
import { useEffect, useRef, useState } from "react";

const HURUF = "ABCDE";

export default function BidangSoal({ s }) {
  const [tipe, setTipe] = useState(s?.tipe || "pilihan_ganda");
  const ref = useRef(null);
  const opsi = s?.opsi || [];

  // Saat formulir dikosongkan (setelah soal ditambah), tampilan ikut kembali ke Pilihan ganda
  useEffect(() => {
    const f = ref.current?.closest("form");
    if (!f) return;
    const h = () => setTimeout(() => setTipe(ref.current?.value || "pilihan_ganda"), 0);
    f.addEventListener("reset", h);
    return () => f.removeEventListener("reset", h);
  }, []);

  return (
    <>
      <div><label className="label">Jenis soal</label>
        <select ref={ref} name="tipe" defaultValue={s?.tipe || "pilihan_ganda"} onChange={(e) => setTipe(e.target.value)} className="input">
          <option value="pilihan_ganda">Pilihan ganda (dinilai otomatis)</option>
          <option value="esai">Esai (dinilai pengajar)</option>
        </select></div>
      <div><label className="label">Pertanyaan</label><textarea name="pertanyaan" rows="3" dir="auto" defaultValue={s?.pertanyaan || ""} className="input !py-3" required /></div>
      {tipe === "pilihan_ganda" ? (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}><label className="label">Pilihan {HURUF[i - 1]}{i > 2 ? " (opsional)" : ""}</label>
              <input name={`o${i}`} dir="auto" defaultValue={opsi[i - 1] || ""} className="input" required={i <= 2} /></div>
          ))}
          <div><label className="label">Jawaban benar</label>
            <select name="benar" defaultValue={String((s?.jawaban_benar ?? 0) + 1)} className="input">
              {[1, 2, 3, 4, 5].map((i) => <option key={i} value={i}>{HURUF[i - 1]}</option>)}
            </select></div>
        </>
      ) : (
        <div><label className="label">Kunci / pedoman jawaban (opsional, dibaca pengajar; peserta melihatnya setelah mengirim)</label>
          <textarea name="kunci_esai" rows="3" dir="auto" defaultValue={s?.kunci_esai || ""} className="input !py-3" /></div>
      )}
      <div><label className="label">Bobot nilai (1 sampai 100)</label><input name="bobot" type="number" min="1" max="100" defaultValue={s?.bobot || 1} className="input" required /></div>
      <div><label className="label">Pembahasan (ditampilkan setelah peserta mengirim)</label><textarea name="pembahasan" rows="2" dir="auto" defaultValue={s?.pembahasan || ""} className="input !py-3" /></div>
    </>
  );
}

"use client";
import { useState, useTransition } from "react";
import { kirimKuis } from "../actions";

const HURUF = "ABCDE";

function Hasil({ hasil, bolehUlang, ulangi }) {
  return (
    <div className="space-y-4">
      <section className="rounded-kartu bg-hijau p-6 text-center text-white" role="status">
        {hasil.nilai === null ? (
          <>
            <p>Jawaban Anda sudah terkirim</p>
            <p className="text-5xl font-bold text-kuning">{hasil.nilai_sementara}</p>
            <p className="text-sm">Nilai sementara dari soal pilihan ganda. Nilai akhir keluar setelah esai dinilai pengajar.</p>
          </>
        ) : (
          <>
            <p>Nilai Anda</p>
            <p className="text-6xl font-bold text-kuning">{hasil.nilai}</p>
            <p>{hasil.total_pg > 0 ? `${hasil.benar} benar dari ${hasil.total_pg} soal pilihan ganda` : "Seluruh soal dinilai pengajar"}</p>
          </>
        )}
      </section>

      {hasil.rincian.map((r, n) => (
        <article key={r.id} className="kartu space-y-3">
          <p className="font-semibold" dir="auto">{n + 1}. {r.pertanyaan} <span className="text-xs font-normal text-tinta/60">(bobot {r.bobot})</span></p>
          {r.tipe === "pilihan_ganda" ? (
            <>
              <ul className="space-y-2">
                {r.opsi.map((o, i) => {
                  const benar = i === r.benar_idx, dipilih = i === r.pilihan;
                  return (
                    <li key={i} dir="auto" className={`rounded-2xl border-2 px-4 py-3 text-sm ${benar ? "border-hijau bg-hijau-muda" : dipilih ? "border-red-300 bg-red-50" : "border-hijau/15"}`}>
                      <b>{HURUF[i]}.</b> {o}
                      {benar && <span className="ml-2 font-semibold text-hijau"> ✓ Jawaban benar</span>}
                      {dipilih && !benar && <span className="ml-2 font-semibold text-red-700"> ✗ Pilihan Anda</span>}
                      {dipilih && benar && <span className="ml-2 text-hijau"> (pilihan Anda)</span>}
                    </li>
                  );
                })}
              </ul>
              {r.pilihan === null && <p className="text-sm text-red-700">Soal ini tidak Anda jawab.</p>}
            </>
          ) : (
            <>
              <p className="whitespace-pre-line rounded-2xl border-2 border-hijau/15 px-4 py-3 text-sm" dir="auto"><b>Jawaban Anda:</b> {r.teks || "(tidak dijawab)"}</p>
              <p className="text-sm font-semibold">{r.skor === null ? "Menunggu penilaian pengajar" : `Skor: ${r.skor} dari ${r.bobot}`}</p>
              {r.catatan && <p className="rounded-2xl bg-yellow-50 p-3 text-sm" dir="auto"><b>Catatan pengajar:</b> {r.catatan}</p>}
              {r.kunci && <p className="rounded-2xl bg-hijau-muda p-3 text-sm" dir="auto"><b>Contoh jawaban:</b> {r.kunci}</p>}
            </>
          )}
          {r.pembahasan && <p className="rounded-2xl bg-hijau-muda p-3 text-sm leading-relaxed" dir="auto"><b>Pembahasan:</b> {r.pembahasan}</p>}
        </article>
      ))}
      {bolehUlang
        ? <button onClick={ulangi} className="btn-hijau w-full">Ulangi kuis</button>
        : <p className="rounded-2xl bg-hijau-muda p-4 text-center text-sm">Kuis ini hanya boleh dikerjakan satu kali.</p>}
    </div>
  );
}

export default function KerjakanKuis({ kuisId, soal, awal, bolehUlang }) {
  const [hasil, setHasil] = useState(awal);
  const [jawab, setJawab] = useState({});
  const [galat, setGalat] = useState("");
  const [sibuk, mulai] = useTransition();
  const belum = soal.filter((s) => jawab[s.id] === undefined || jawab[s.id] === "").length;

  function kirim() {
    if (belum && !confirm(`${belum} soal belum dijawab. Tetap kirim?`)) return;
    setGalat("");
    mulai(async () => {
      const r = await kirimKuis(kuisId, jawab);
      if (r.galat) return setGalat(r.galat);
      setHasil(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (hasil) return <Hasil hasil={hasil} bolehUlang={bolehUlang} ulangi={() => { setHasil(null); setJawab({}); }} />;

  return (
    <div className="space-y-4">
      {soal.map((s, n) => (
        <fieldset key={s.id} className="kartu space-y-3">
          <legend className="sr-only">Soal {n + 1}</legend>
          <p className="font-semibold" dir="auto">{n + 1}. {s.pertanyaan} <span className="text-xs font-normal text-tinta/60">(bobot {s.bobot})</span></p>
          {s.tipe === "esai" ? (
            <>
              <label className="sr-only" htmlFor={`e_${s.id}`}>Jawaban esai nomor {n + 1}</label>
              <textarea id={`e_${s.id}`} rows="5" maxLength={4000} dir="auto" value={jawab[s.id] || ""} onChange={(e) => setJawab({ ...jawab, [s.id]: e.target.value })} className="input !py-3" placeholder="Tulis jawaban Anda di sini" />
            </>
          ) : (
            s.opsi.map((o, i) => {
              const aktif = jawab[s.id] === i;
              return (
                <label key={i} className={`flex min-h-[48px] cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${aktif ? "border-hijau bg-hijau-muda" : "border-hijau/20"}`}>
                  <input type="radio" name={`s_${s.id}`} checked={aktif} onChange={() => setJawab({ ...jawab, [s.id]: i })} className="mt-1 h-5 w-5 accent-[#1E7B34]" />
                  <span dir="auto"><b>{HURUF[i]}.</b> {o}</span>
                </label>
              );
            })
          )}
        </fieldset>
      ))}
      {galat && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{galat}</p>}
      <button onClick={kirim} disabled={sibuk} className="btn-kuning w-full !min-h-[56px] text-lg disabled:opacity-60">
        {sibuk ? "Mengirim…" : belum ? `Kirim jawaban (${belum} belum dijawab)` : "Kirim jawaban"}
      </button>
    </div>
  );
}

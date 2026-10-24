"use client";
import { useState } from "react";
import FormAksi from "@/components/FormAksi";
import HeroBeranda from "@/components/HeroBeranda";
import LatarUnggah from "@/components/LatarUnggah";
import { simpanHero } from "./actions";

const LATAR = [["polos", "Hijau polos"], ["gradasi", "Hijau gradasi"], ["pola", "Pola islami"], ["foto", "Foto sendiri"]];
const TATA = [["kiri", "Teks di kiri"], ["tengah", "Teks di tengah"]];

function Pilihan({ name, daftar, nilai, ubah }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {daftar.map(([v, l]) => (
        <label key={v} className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-2xl border-2 px-4 text-sm font-medium ${nilai === v ? "border-hijau bg-hijau text-white" : "border-hijau/25 text-hijau"}`}>
          <input type="radio" name={name} value={v} checked={nilai === v} onChange={() => ubah(v)} className="sr-only" />{l}
        </label>
      ))}
    </div>
  );
}

export default function FormHero({ awal }) {
  const [h, setH] = useState(awal);
  const u = (k) => (v) => setH((x) => ({ ...x, [k]: v }));
  const t = (k) => ({ name: k, value: h[k], onChange: (e) => u(k)(e.target.value) });
  return (
    <FormAksi aksi={simpanHero} kirim="Simpan tampilan Beranda" className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-hijau-tua">Pratinjau langsung</p>
        <div aria-hidden className="pointer-events-none overflow-hidden rounded-2xl border border-hijau/20"><HeroBeranda h={h} kompak /></div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-hijau">Tulisan</h2>
        <div><label className="label" htmlFor="judul">Judul utama</label><input id="judul" className="input" maxLength={150} required {...t("judul")} /></div>
        <div><label className="label" htmlFor="subjudul">Kalimat di bawah judul</label><textarea id="subjudul" rows="2" className="input !py-3" maxLength={300} {...t("subjudul")} /></div>
        <div><label className="label" htmlFor="arab">Tulisan Arab (kosongkan bila tidak ingin ditampilkan)</label><input id="arab" dir="rtl" className="input font-arab text-2xl" maxLength={80} {...t("arab")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="t1">Tulisan tombol kuning</label><input id="t1" className="input" maxLength={30} {...t("tombol1")} /></div>
          <div><label className="label" htmlFor="t2">Tulisan tombol garis (kosongkan untuk menyembunyikan)</label><input id="t2" className="input" maxLength={30} {...t("tombol2")} /></div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-hijau">Latar belakang</h2>
        <Pilihan name="latar" daftar={LATAR} nilai={h.latar} ubah={u("latar")} />
        <input type="hidden" name="foto_url" value={h.foto_url} />
        {h.latar === "foto" && (
          <div className="space-y-4 rounded-2xl bg-hijau-muda p-4">
            <LatarUnggah url={h.foto_url} onUbah={u("foto_url")} />
            <div><label className="label" htmlFor="gelap">Kepekatan lapisan hijau di atas foto: {h.gelap}%</label>
              <input id="gelap" type="range" name="gelap" min="20" max="90" step="5" value={h.gelap} onChange={(e) => u("gelap")(Number(e.target.value))} className="w-full accent-[#1E7B34]" />
              <p className="mt-1 text-xs text-tinta/60">Makin pekat makin mudah dibaca. Gunakan foto mendatar (landscape) dengan objek tidak terlalu ramai.</p></div>
          </div>
        )}
        {h.latar !== "foto" && <input type="hidden" name="gelap" value={h.gelap} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-hijau">Tata letak</h2>
        <Pilihan name="tata" daftar={TATA} nilai={h.tata} ubah={u("tata")} />
      </section>
    </FormAksi>
  );
}

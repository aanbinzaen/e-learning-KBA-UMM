import { wajibGuru } from "@/lib/guru";
import { GRUP_WA, cariTautanWa, linkWaSah } from "@/lib/flyer";
import PembuatFlyer from "@/components/flyer/PembuatFlyer";

export const metadata = { title: "Pengumuman & Flyer" };

export default async function Pengumuman() {
  const { supabase, profil, grup } = await wajibGuru();
  const admin = profil.role === "admin";

  // Tautan grup WhatsApp: yang diisi di menu Kelas & Grup diutamakan, lalu cocokkan lewat nama grup.
  let tautanDb = {};
  if (grup.length) {
    const { data } = await supabase.from("grup_tautan").select("grup_id,link").in("grup_id", grup.map((g) => g.id));
    tautanDb = Object.fromEntries((data || []).map((t) => [t.grup_id, t.link]));
  }
  const dariGrup = grup.map((g) => ({ nama: g.nama, link: tautanDb[g.id] || cariTautanWa(g.nama) })).filter((t) => linkWaSah(t.link));

  const tujuan = [];
  const lihat = new Set();
  // Admin: enam grup resmi lebih dulu, lalu grup lain yang punya tautan. Pengajar: hanya grupnya sendiri.
  [...(admin ? GRUP_WA.map((g) => ({ nama: g.nama, link: g.link })) : []), ...dariGrup].forEach((t) => {
    const kunci = t.link.split("?")[0];
    if (!lihat.has(kunci)) { lihat.add(kunci); tujuan.push(t); }
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Pengumuman &amp; Flyer</h1>
        <p className="mt-1 text-tinta/70">Buat flyer ajakan hadir, pengumuman kelas dimulai, kuis atau rekaman terbit, atau pengumuman lain. Hasilnya berupa gambar siap dibagikan ke grup WhatsApp.</p>
      </div>
      <PembuatFlyer tujuan={tujuan} admin={admin} pengajar={profil.role === "pengajar" ? profil.nama_lengkap : ""} />
    </div>
  );
}

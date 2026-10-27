import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("nama_lengkap,kode,role").eq("id", user.id).maybeSingle();
  const peran = { peserta: "Peserta", pengajar: "Pengajar", admin: "Admin" }[p?.role] || "Peserta";

  const { data: pg } = await supabase.from("peserta_grup")
    .select("grup(id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama))").eq("profile_id", user.id).maybeSingle();
  const grup = pg?.grup;
  let tautan = null, teman = [], persen = 0, total = 0, selesai = 0, absenBuka = 0;
  if (grup) {
    const hitung = (t) => supabase.from(t).select("id", { count: "exact", head: true }).eq("grup_id", grup.id);
    const [m, r, k, s] = await Promise.all([
      hitung("materi"), hitung("rekaman"), hitung("kuis").eq("diterbitkan", true),
      supabase.from("progres").select("item_id", { count: "exact", head: true }).eq("profile_id", user.id).in("jenis", ["materi", "rekaman", "kuis"]),
    ]);
    absenBuka = (await supabase.from("pertemuan").select("id", { count: "exact", head: true }).eq("grup_id", grup.id).eq("absensi_buka", true)).count || 0;
    total = (m.count || 0) + (r.count || 0) + (k.count || 0); selesai = Math.min(s.count || 0, total);
    persen = total ? Math.round((selesai / total) * 100) : 0;
    tautan = (await supabase.from("grup_tautan").select("link").eq("grup_id", grup.id).maybeSingle()).data?.link;
    teman = (await supabase.rpc("teman_grup")).data || [];
  }

  return (
    <div className="space-y-5">
      <section className="rounded-kartu bg-hijau p-6 text-white">
        <p className="arab text-right text-3xl text-kuning" lang="ar">السلام عليكم</p>
        <h1 className="mt-2 text-2xl font-bold">Assalamu'alaikum, {p?.nama_lengkap}</h1>
        <p className="mt-1 text-white/90">{peran} · Kode {p?.kode}</p>
      </section>

      {grup ? (
        <section className="kartu space-y-3">
          <h2 className="text-lg font-semibold text-hijau">Kelas saya</h2>
          <p><b>{grup.kelas?.jenis_kelamin} · {grup.kelas?.tingkat}</b></p>
          <p>Grup: {grup.nama}</p>
          <p>Pengajar: {grup.pengajar?.nama || "belum ditentukan"}</p>
          {tautan ? <a href={tautan} target="_blank" rel="noopener noreferrer" className="btn-kuning w-full">Gabung Kelas</a>
                  : <p className="rounded-2xl bg-hijau-muda p-3 text-sm">Link kelas belum diisi pengajar atau admin.</p>}
        </section>
      ) : (
        <section className="kartu space-y-3">
          {p?.role === "peserta" ? <p className="text-sm">Anda belum ditempatkan di grup. Hubungi admin.</p> : (
            <>
              <p className="text-sm">Anda dapat membuka dan mengelola kelas dari menu berikut.</p>
              <Link href="/guru" className="btn-hijau w-full">Kelola Kelas</Link>
              <Link href="/dashboard/kelas" className="btn-garis !border-hijau !text-hijau w-full">Lihat Kelas (tampilan peserta)</Link>
              {p?.role === "admin" && <Link href="/admin" className="btn-kuning w-full">Menu Admin</Link>}
            </>
          )}
        </section>
      )}

      {grup && (
        <section className="kartu">
          <h2 className="text-lg font-semibold text-hijau">Teman satu grup ({teman.length})</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{teman.map((t) => <li key={t.nama_lengkap} className="py-1">{t.nama_lengkap}</li>)}</ul>
        </section>
      )}
      {absenBuka > 0 && p?.role === "peserta" && (
        <Link href="/dashboard/absensi" className="block rounded-kartu bg-kuning p-5 text-center text-lg font-bold text-hijau-tua">Absensi sedang dibuka. Ketuk untuk mengisi</Link>
      )}
      {grup && (
        <section className="kartu space-y-3">
          <h2 className="text-lg font-semibold text-hijau">Progres belajar</h2>
          <div className="h-3 overflow-hidden rounded-full bg-hijau-muda" role="progressbar" aria-valuenow={persen} aria-valuemin="0" aria-valuemax="100" aria-label="Progres belajar">
            <div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} />
          </div>
          <p className="text-sm">{persen}% · {selesai} dari {total} materi dan rekaman selesai</p>
          <Link href="/dashboard/kelas" className="btn-hijau w-full">Buka kelas</Link>
        </section>
      )}
      
    </div>
  );
}

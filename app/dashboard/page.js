import { supabaseServer } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("nama_lengkap,kode,role").eq("id", user.id).maybeSingle();
  const peran = { peserta: "Peserta", pengajar: "Pengajar", admin: "Admin" }[p?.role] || "Peserta";

  const { data: pg } = await supabase.from("peserta_grup")
    .select("grup(id,nama,kelas(jenis_kelamin,tingkat),pengajar(nama))").eq("profile_id", user.id).maybeSingle();
  const grup = pg?.grup;
  let tautan = null, teman = [];
  if (grup) {
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
        <section className="kartu"><p className="text-sm">{p?.role === "peserta" ? "Anda belum ditempatkan di grup. Hubungi admin." : "Fitur untuk peran ini akan hadir di tahap berikutnya."}</p></section>
      )}

      {grup && (
        <section className="kartu">
          <h2 className="text-lg font-semibold text-hijau">Teman satu grup ({teman.length})</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{teman.map((t) => <li key={t.nama_lengkap} className="py-1">{t.nama_lengkap}</li>)}</ul>
        </section>
      )}
      <section className="kartu"><p className="text-sm text-tinta/70">Materi, rekaman, absensi, dan kuis akan hadir di tahap berikutnya.</p></section>
    </div>
  );
}

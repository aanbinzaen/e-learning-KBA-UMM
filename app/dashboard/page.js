import { supabaseServer } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("nama_lengkap,role").eq("id", user.id).maybeSingle();
  const peran = { peserta: "Peserta", pengajar: "Pengajar", admin: "Admin" }[p?.role] || "Peserta";
  return (
    <div className="space-y-5">
      <section className="rounded-kartu bg-hijau p-6 text-white">
        <p className="arab text-right text-3xl text-kuning" lang="ar">السلام عليكم</p>
        <h1 className="mt-2 text-2xl font-bold">Assalamu'alaikum, {p?.nama_lengkap}</h1>
        <p className="mt-1 text-white/90">Anda masuk sebagai {peran}.</p>
      </section>
      <section className="kartu">
        <h2 className="text-lg font-semibold text-hijau">Segera hadir</h2>
        <p className="mt-2 text-sm leading-relaxed">Kelas, grup, materi, rekaman, absensi, dan kuis akan muncul di sini pada tahap berikutnya. Login Anda sudah berfungsi dengan baik.</p>
      </section>
    </div>
  );
}

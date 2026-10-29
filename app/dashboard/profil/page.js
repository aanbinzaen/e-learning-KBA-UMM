import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import FormKontak from "./FormKontak";
import AktifkanNotifikasi from "@/components/AktifkanNotifikasi";

export const metadata = { title: "Profil Saya" };

export default async function ProfilSaya() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("kode,nama_lengkap,jenis_kelamin,email,whatsapp").eq("id", user.id).maybeSingle();
  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Profil Saya</h1>
      <section className="kartu space-y-1">
        <p className="text-lg font-semibold">{p?.nama_lengkap}</p>
        <p className="text-sm text-tinta/70">Kode peserta: <span className="font-mono">{p?.kode}</span> · {p?.jenis_kelamin}</p>
        <p className="pt-2 text-sm text-tinta/70">Untuk mengubah nama, hubungi admin.</p>
      </section>
      <section className="kartu"><h2 className="mb-1 text-lg font-semibold text-hijau">Kontak untuk masuk</h2>
        <p className="mb-4 text-sm text-tinta/70">Kontak Anda tidak ditampilkan kepada peserta lain.</p>
        <FormKontak email={p?.email} whatsapp={p?.whatsapp} /></section>
      <AktifkanNotifikasi />
      <section className="kartu"><h2 className="mb-2 text-lg font-semibold text-hijau">Password</h2>
        <Link href="/ganti-password" className="btn-garis !border-hijau !text-hijau w-full">Ganti password</Link></section>
    </div>
  );
}

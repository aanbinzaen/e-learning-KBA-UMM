import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibAdmin } from "@/lib/auth";
import FormPeserta from "./FormPeserta";

export const metadata = { title: "Edit peserta" };

export default async function EditPeserta({ params }) {
  const { supabase } = await wajibAdmin();
  const { data: p } = await supabase.from("profiles").select("id,kode,nama_lengkap,jenis_kelamin,role,email,whatsapp,aktif").eq("id", params.id).maybeSingle();
  if (!p) notFound();
  const [{ data: pg }, { data: daftarGrup }] = await Promise.all([
    supabase.from("peserta_grup").select("grup_id").eq("profile_id", p.id).maybeSingle(),
    supabase.from("grup").select("id,nama,kelas(jenis_kelamin,tingkat)").order("nama"),
  ]);
  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/admin/peserta" className="text-sm font-medium text-hijau underline">← Kembali ke daftar</Link>
      <h1 className="text-2xl font-bold text-hijau-tua">{p.nama_lengkap} <span className="font-mono text-base text-tinta/60">{p.kode}</span></h1>
      <FormPeserta p={p} grupId={pg?.grup_id} daftarGrup={daftarGrup || []} />
    </div>
  );
}

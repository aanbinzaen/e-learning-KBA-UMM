import { wajibGuru } from "@/lib/guru";
import PembuatReels from "@/components/reels/PembuatReels";

export const metadata = { title: "Reels Klip Kajian" };

export default async function Reels() {
  const { supabase, profil } = await wajibGuru();
  const { data } = await supabase.from("rekaman").select("id,judul,youtube_id,pertemuan(judul)").order("dibuat_pada", { ascending: false }).limit(40);
  const rekaman = (data || []).map((r) => ({ id: r.id, judul: r.judul, youtube_id: r.youtube_id, pertemuan: r.pertemuan?.judul || "" }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Reels Klip Kajian</h1>
        <p className="text-tinta/80">Ubah potongan kajian menjadi video vertikal 9:16 dengan latar ciri khas KBA-UMM dan judul yang bisa Anda tulis sendiri. Hasilnya diunduh sebagai video untuk Instagram, Status WhatsApp, atau TikTok.</p>
      </div>
      <PembuatReels rekaman={rekaman} pengajar={profil.role === "admin" ? "" : (profil.nama_lengkap || "")} />
    </div>
  );
}

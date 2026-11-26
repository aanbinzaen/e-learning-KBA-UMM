import { wajibGuru } from "@/lib/guru";
import PembuatReels from "@/components/reels/PembuatReels";

export const metadata = { title: "Reels Klip Kajian" };

export default async function Reels() {
  const { profil } = await wajibGuru();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Reels Klip Kajian</h1>
        <p className="text-tinta/80">Ubah potongan kajian menjadi video vertikal 9:16 dengan latar ciri khas KBA-UMM dan judul yang bisa Anda tulis sendiri. Hasilnya diunduh sebagai video untuk Instagram, Status WhatsApp, atau TikTok.</p>
      </div>
      <PembuatReels pengajar={profil.role === "admin" ? "" : (profil.nama_lengkap || "")} />
    </div>
  );
}

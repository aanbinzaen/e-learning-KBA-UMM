import FormGanti from "./FormGanti";
export const metadata = { title: "Ganti password" };

export default function GantiPassword() {
  return (
    <div className="bagian max-w-md">
      <div className="kartu">
        <h1 className="text-2xl font-bold text-hijau-tua">Buat password baru</h1>
        <p className="mb-5 mt-1 text-sm text-tinta/70">Demi keamanan, ganti password awal Anda sebelum mulai belajar. Minimal 8 karakter, gabungan huruf dan angka.</p>
        <FormGanti />
      </div>
    </div>
  );
}

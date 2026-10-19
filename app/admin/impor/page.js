import FormImpor from "./FormImpor";
export const metadata = { title: "Impor peserta" };

export default function Impor() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-hijau-tua">Impor peserta</h1>
      <p className="max-w-2xl text-tinta/80">Sistem membuat akun, kode peserta (KBUMM-001, dst.), dan password awal. Kelas, grup, dan pengajar yang belum ada dibuat otomatis. Peserta dengan nama dan grup yang sama dilewati.</p>
      <FormImpor />
    </div>
  );
}

import PembuatDiagram from "./PembuatDiagram";

export const metadata = { title: "Diagram hierarki" };

export default function Diagram() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Diagram hierarki</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta/70">Tulis butir-butirnya berjenjang, diagram tersusun otomatis. Unduh dalam ukuran 4:5, 5:4, 9:16, 16:9, atau 1:1. Teks Arab didukung, termasuk tata letak kanan ke kiri.</p>
      </div>
      <PembuatDiagram />
    </div>
  );
}

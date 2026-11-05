import TabRuang from "./TabRuang";
export const metadata = { title: "Ruang Pengajar", robots: { index: false } };

export default function RuangLayout({ children }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-hijau-tua">Ruang Pengajar</h1>
        <p className="mt-1 text-sm leading-relaxed text-tinta/70">Tempat sesama pengajar berbagi bahan materi dan kitab rujukan, serta berdiskusi. Hanya terlihat oleh pengajar dan admin.</p>
      </div>
      <TabRuang />
      {children}
    </div>
  );
}

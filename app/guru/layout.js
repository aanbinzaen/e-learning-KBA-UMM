import { wajibGuru } from "@/lib/guru";
export const metadata = { title: "Kelola Kelas", robots: { index: false } };

export default async function GuruLayout({ children }) {
  await wajibGuru();
  return <div className="bagian !max-w-4xl">{children}</div>;
}

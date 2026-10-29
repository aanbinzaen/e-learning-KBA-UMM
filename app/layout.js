import { Poppins, Amiri } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReaksiGlobal from "@/components/ReaksiGlobal";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });

const situs = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata = {
  metadataBase: new URL(situs),
  title: { default: "KB-UMM – Kuliah Bahasa Arab Untuk Meraih Mahabatullah", template: "%s | KB-UMM" },
  description: "Kuliah Bahasa Arab Untuk Meraih Mahabatullah (KB-UMM) oleh Rumah Dakwah Malang dan Pesantren Online. Belajar Bahasa Arab dari pemula hingga lanjutan.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "KBA-UMM", statusBarStyle: "default" },
  openGraph: {
    title: "KB-UMM – Kuliah Bahasa Arab Untuk Meraih Mahabatullah",
    description: "Program belajar Bahasa Arab Rumah Dakwah Malang dan Pesantren Online.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "id_ID", type: "website", siteName: "KB-UMM",
  },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1E7B34" };

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${poppins.variable} ${amiri.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ReaksiGlobal />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

import Link from "next/link";
import { MENU } from "./SiteHeader";
import { SITE, linkWA } from "@/lib/config";

export default function SiteFooter() {
  const wa = linkWA();
  return (
    <footer className="bg-hijau-tua text-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 md:grid-cols-3">
        <div className="space-y-4">
          {/* eslint-disable @next/next/no-img-element */}
          <img src="/img/logo-rumah-dakwah-putih.png" alt="Rumah Dakwah Malang" width="158" height="36" loading="lazy" className="h-9 w-auto" />
          <span className="inline-flex rounded-full bg-krem p-1.5">
            <img src="/img/logo-pesantren-online.png" alt="Pesantren Online" width="72" height="72" loading="lazy" className="h-[72px] w-[72px]" />
          </span>
        </div>
        <div>
          <p className="mb-3 font-semibold text-kuning">Tautan cepat</p>
          <ul className="space-y-1">
            {MENU.map((m) => (<li key={m.href}><Link href={m.href} className="inline-block py-1.5 hover:underline">{m.label}</Link></li>))}
            <li><Link href="/masuk" className="inline-block py-1.5 hover:underline">Masuk peserta</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-kuning">Kontak</p>
          <ul className="space-y-2 text-white/90">
            <li>{SITE.alamat}</li>
            {wa && <li><a href={wa} className="underline">WhatsApp admin</a></li>}
            {SITE.email && <li><a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-4 text-center text-sm text-white/80">
        © 2026 Rumah Dakwah Malang &amp; Pesantren Online
      </div>
    </footer>
  );
}

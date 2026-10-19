import Link from "next/link";

export const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil Rumah Dakwah" },
  { href: "/pendiri", label: "Pendiri" },
  { href: "/pengajar", label: "Pengajar" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-hijau text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" aria-label="Beranda KB-UMM" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-rumah-dakwah-putih.png" alt="Rumah Dakwah Malang" width="158" height="36" className="h-9 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu utama">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10">{m.label}</Link>
          ))}
          <Link href="/masuk" className="btn-kuning ml-2 !min-h-[44px] !px-5">Masuk</Link>
        </nav>
        <details className="group relative md:hidden">
          <summary className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-xl hover:bg-white/10" aria-label="Buka menu">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav className="absolute right-0 mt-2 w-64 rounded-kartu bg-hijau-tua p-3 shadow-xl" aria-label="Menu seluler">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} className="block rounded-xl px-4 py-3 font-medium hover:bg-white/10">{m.label}</Link>
            ))}
            <Link href="/masuk" className="btn-kuning mt-2 w-full">Masuk</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

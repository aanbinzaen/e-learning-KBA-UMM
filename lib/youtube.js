const POLA = /^[A-Za-z0-9_-]{11}$/;
// Menerima tautan YouTube (watch, youtu.be, shorts, embed, live) atau ID 11 karakter.
export function idYouTube(teks) {
  const t = String(teks || "").trim();
  if (POLA.test(t)) return t;
  try {
    const u = new URL(t);
    const h = u.hostname.replace(/^(www|m|music)\./, "");
    let id = null;
    if (h === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (h === "youtube.com" || h === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else { const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?]+)/); if (m) id = m[2]; }
    }
    return id && POLA.test(id) ? id : null;
  } catch { return null; }
}

// "10.22" (menit.detik), "1.05.00" (jam.menit.detik), "10:22", "65" atau "1m5s" -> detik; kosong -> null; tak valid -> NaN
export function keDetik(teks) {
  const t = String(teks || "").trim().toLowerCase().replace(/[.:,]/g, ":");
  if (!t) return null;
  let m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return NaN;
  return t.split(":").reduce((a, x) => a * 60 + +x, 0);
}
export function dariDetik(d) {
  d = Math.max(0, Math.round(+d || 0));
  const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = d % 60, dd = (x) => String(x).padStart(2, "0");
  return j ? `${j}.${dd(m)}.${dd(s)}` : `${m}.${dd(s)}`;
}

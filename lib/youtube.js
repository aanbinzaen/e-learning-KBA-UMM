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

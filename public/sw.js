// Service worker KBA-UMM: menampilkan notifikasi push dan membuka halaman terkait saat diketuk.
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { judul: "KBA-UMM", isi: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(d.judul || "KBA-UMM", {
    body: d.isi || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: d.tag || undefined,
    renotify: Boolean(d.tag),
    lang: "id",
    dir: "auto",
    data: { url: d.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = new URL("/", self.location.origin).href;
  try {
    const t = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
    if (t.origin === self.location.origin) url = t.href;   // hanya halaman milik situs ini
  } catch (e) { /* pakai beranda */ }
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
    for (const c of daftar) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});

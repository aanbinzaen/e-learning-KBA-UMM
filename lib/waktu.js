// Waktu di formulir selalu dianggap WIB (UTC+7).
export const dariInputWIB = (s) => (s ? `${s}:00+07:00` : null);
export const keInputWIB = (iso) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 16).replace(" ", "T");

// Waktu singkat untuk daftar dan pesan, contoh: "29 Okt 18.26" (WIB)
export const ringkasWIB = (iso) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

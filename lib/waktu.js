// Waktu di formulir selalu dianggap WIB (UTC+7).
export const dariInputWIB = (s) => (s ? `${s}:00+07:00` : null);
export const keInputWIB = (iso) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 16).replace(" ", "T");

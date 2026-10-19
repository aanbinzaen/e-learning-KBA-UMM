export const adalahEmail = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
export const bersih = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

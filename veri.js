/* Klinik Defteri — veri katmanı. Her şey bu telefonda (IndexedDB). Açılışta belleğe alınır, her değişiklik hemen yazılır. */
"use strict";
const Veri = (() => {
  const AD = "klinik-defteri", SURUM = 1, DEPOLAR = ["ayar", "hasta", "islem", "malzeme"];
  let db = null;
  const M = {ayar: {}, hasta: [], islem: [], malzeme: []};

  function ac() {
    return new Promise((ok, hata) => {
      const r = indexedDB.open(AD, SURUM);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("ayar")) d.createObjectStore("ayar", {keyPath: "k"});
        for (const s of ["hasta", "islem", "malzeme"]) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, {keyPath: "id"});
      };
      r.onsuccess = () => { db = r.result; ok(db); };
      r.onerror = () => hata(r.error || new Error("Veri açılamadı"));
    });
  }
  const tumu = s => new Promise((ok, hata) => { const q = db.transaction(s).objectStore(s).getAll(); q.onsuccess = () => ok(q.result || []); q.onerror = () => hata(q.error); });
  const yaz = (s, v) => new Promise((ok, hata) => { const t = db.transaction(s, "readwrite"); t.objectStore(s).put(v); t.oncomplete = () => ok(v); t.onerror = () => hata(t.error); });
  const sil = (s, k) => new Promise((ok, hata) => { const t = db.transaction(s, "readwrite"); t.objectStore(s).delete(k); t.oncomplete = () => ok(); t.onerror = () => hata(t.error); });
  const temizle = s => new Promise((ok, hata) => { const t = db.transaction(s, "readwrite"); t.objectStore(s).clear(); t.oncomplete = () => ok(); t.onerror = () => hata(t.error); });

  async function yukle() {
    await ac();
    for (const a of await tumu("ayar")) M.ayar[a.k] = a.v;
    for (const s of ["hasta", "islem", "malzeme"]) M[s] = await tumu(s);
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* tarayıcı izin vermeyebilir */ }
  }
  const yeniId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  return {
    M, yukle, yeniId,
    ayar: k => M.ayar[k],
    async ayarYaz(k, v) { M.ayar[k] = v; await yaz("ayar", {k, v}); },
    async kaydet(s, o) { if (!o.id) o.id = yeniId(); const i = M[s].findIndex(x => x.id === o.id); if (i >= 0) M[s][i] = o; else M[s].push(o); await yaz(s, o); return o; },
    async sil(s, id) { M[s] = M[s].filter(x => x.id !== id); await sil(s, id); },
    disaAl() { return {tur: "KlinikDefteriYedek", v: 1, tarih: new Date().toISOString(), ayar: M.ayar, hasta: M.hasta, islem: M.islem, malzeme: M.malzeme}; },
    async iceAl(y) {
      if (!y || y.tur !== "KlinikDefteriYedek") throw new Error("Bu dosya Klinik Defteri yedeği değil");
      for (const s of DEPOLAR) await temizle(s);
      const kal = {cihaz: M.ayar.cihaz, ilk: M.ayar.ilk, liste: M.ayar.liste};          // bu telefonun lisans kimliği yedekle değişmez
      M.ayar = {};
      for (const [k, v] of Object.entries(Object.assign({}, y.ayar || {}, Object.fromEntries(Object.entries(kal).filter(([, v]) => v !== undefined))))) { M.ayar[k] = v; await yaz("ayar", {k, v}); }
      for (const s of ["hasta", "islem", "malzeme"]) { M[s] = Array.isArray(y[s]) ? y[s] : []; for (const o of M[s]) await yaz(s, o); }
    }
  };
})();

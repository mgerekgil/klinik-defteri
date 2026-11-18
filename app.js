/* Klinik Defteri — ekranlar. Veriler yalnız bu telefonda (veri.js), lisans lisans.js'te. */
"use strict";
const SURUM = "1.0.0";
const SATICI_TEL = "905309469947";
const GOOGLE_CLIENT_ID = "1044147751394-qo809o3sndht657dcbr8cprj3m2s96dt.apps.googleusercontent.com";      // Google ile bağla (isteğe bağlı) · Drive'da yalnız bu programın klasörü
const GRUPLAR = ["Serum", "İlaç / ampul", "Enjektör", "Sarf", "Hizmet"];
const ORNEK_MALZEME = [
  ["Serum fizyolojik 500 ml", "Serum", 120, 45, 30, 10], ["Dekstroz %5 500 ml", "Serum", 130, 50, 20, 5], ["Ringer laktat 500 ml", "Serum", 130, 50, 10, 5],
  ["Antibiyotik ampul", "İlaç / ampul", 180, 85, 10, 5, "penisilin"], ["Vitamin ampul", "İlaç / ampul", 90, 30, 20, 5], ["Ağrı kesici ampul", "İlaç / ampul", 70, 22, 20, 5],
  ["Kas gevşetici ampul", "İlaç / ampul", 80, 25, 10, 5], ["Mide koruyucu ampul", "İlaç / ampul", 70, 20, 10, 5],
  ["Enjektör 2 ml", "Enjektör", 10, 2, 100, 20], ["Enjektör 5 ml", "Enjektör", 10, 2, 100, 20], ["Enjektör 10 ml", "Enjektör", 12, 3, 50, 10],
  ["Serum seti", "Sarf", 25, 6, 50, 10], ["Branül", "Sarf", 30, 8, 40, 10], ["Turnike / pamuk / flaster", "Sarf", 15, 3, 0, 0],
  ["Pansuman", "Hizmet", 150, 0, 0, 0], ["Tansiyon ölçümü", "Hizmet", 50, 0, 0, 0], ["Şeker ölçümü", "Hizmet", 50, 0, 0, 0], ["Enjeksiyon (yapım ücreti)", "Hizmet", 50, 0, 0, 0]];
const SIK = ["Serum fizyolojik 500 ml", "Vitamin ampul", "Ağrı kesici ampul", "Enjektör 5 ml", "Serum seti", "Antibiyotik ampul"];

// ---------------------------------------------------------------- yardımcılar
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const tl = n => (Math.round((+n || 0) * 100) / 100).toLocaleString("tr-TR", {maximumFractionDigits: 2}) + " ₺";
const sayi = v => typeof v === "number" ? v : (parseFloat(String(v || "").replace(/\./g, "").replace(",", ".")) || 0);
const kucuk = s => String(s || "").toLocaleLowerCase("tr");
const yerel = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString();
const bugun = () => yerel(new Date()).slice(0, 10);
const gunEkle = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const tr = iso => iso ? iso.slice(0, 10).split("-").reverse().join(".") : "";
const saat = iso => iso ? iso.slice(11, 16) : "";
const AYLAR = ["OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA"];
const AY_TAM = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const bas = ad => String(ad || "?").trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toLocaleUpperCase("tr") || "?";
const renk = ad => "a" + ((String(ad || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 5) + 1);
const waNo = t => { let d = String(t || "").replace(/\D/g, ""); if (d.startsWith("0")) d = "90" + d.slice(1); else if (d.length === 10) d = "90" + d; return d.length >= 12 ? d : ""; };
const A = () => Veri.M;
const hastaAyar = () => Object.assign({tel: true, tc: false, dogum: false, neden: false}, Veri.ayar("hastaAlan") || {});
const odemeTurleri = () => Veri.ayar("odemeTurleri") || ["Nakit", "Kart", "EFT / Havale"];

function toast(t) { let e = $(".toast"); if (!e) { e = document.createElement("div"); e.className = "toast"; document.body.appendChild(e); } e.textContent = t; e.hidden = false; clearTimeout(toast.z); toast.z = setTimeout(() => e.remove(), 2800); }
function perde(html, baglan) {
  kapat();
  const d = document.createElement("div"); d.className = "perde"; d.innerHTML = `<div class="sayfa" role="dialog">${html}</div>`;
  d.addEventListener("click", e => { if (e.target === d) kapat(); });
  document.body.appendChild(d); if (baglan) baglan(d.firstChild); return d.firstChild;
}
function kapat() { document.querySelectorAll(".perde").forEach(x => x.remove()); }
document.addEventListener("keydown", e => { if (e.key === "Escape") kapat(); });
function onay(soru, evet, tehlike) {
  perde(`<h3>${esc(soru)}</h3><div class="ikili-g"><button class="btn ince" data-k>Vazgeç</button><button class="btn ${tehlike ? "ana" : "koyu"}" data-e>Evet</button></div>`, s => {
    s.querySelector("[data-k]").onclick = kapat; s.querySelector("[data-e]").onclick = () => { kapat(); evet(); }; });
}

// ---------------------------------------------------------------- PIN (cihazda; yalnız özeti saklanır)
async function pinOzet(pin, tuz) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const b = await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: 150000}, k, 256);
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function pinKaydet(pin) {
  const tuz = crypto.getRandomValues(new Uint8Array(16));
  await Veri.ayarYaz("pin", {t: [...tuz], h: await pinOzet(pin, tuz)});
}
async function pinDogru(pin) { const p = Veri.ayar("pin"); return !!p && await pinOzet(pin, new Uint8Array(p.t)) === p.h; }

// ---------------------------------------------------------------- yedek (şifreli dosya)
async function yedekAnahtar(pin, tuz, giz) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("klinik-yedek|" + (giz ? giz + "|" : "") + pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: 200000}, k, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}
const b64 = u => { let s = ""; for (const x of u) s += String.fromCharCode(x); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function yedekOlustur(giz) {
  const tuz = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const veri = new TextEncoder().encode(JSON.stringify(Veri.disaAl()));
  const c = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, await yedekAnahtar(OTURUM.pin, tuz, giz), veri));
  return JSON.stringify({tur: "KlinikDefteriYedekSifreli", v: 1, g: giz ? 1 : 0, tarih: new Date().toISOString(), isletme: Veri.ayar("isletmeAd") || "", hasta: A().hasta.length, islem: A().islem.length, s: b64(tuz), iv: b64(iv), c: b64(c)});
}
async function yedekCoz(metin, pin, giz) {
  let y; try { y = JSON.parse(metin); } catch (e) { throw new Error("Bu dosya Klinik Defteri yedeği değil"); }
  if (y.tur !== "KlinikDefteriYedekSifreli") throw new Error("Bu dosya Klinik Defteri yedeği değil");
  try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name: "AES-GCM", iv: unb64(y.iv)}, await yedekAnahtar(pin, unb64(y.s), y.g ? giz : ""), unb64(y.c)))); }
  catch (e) { throw new Error("Şifre yanlış: yedek alındığı zamanki giriş şifresini yazın"); }
}
async function dosyaVer(ad, metin, tur) {
  const blob = new Blob([metin], {type: tur});
  try {
    const f = new File([blob], ad, {type: tur});
    if (navigator.canShare && navigator.canShare({files: [f]})) { await navigator.share({files: [f], title: ad}); return "paylasildi"; }
  } catch (e) { if (e && e.name === "AbortError") return "vazgecildi"; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return "indirildi";
}
async function yedekGonder() {
  const ad = `KlinikDefteri-yedek-${bugun()}.kdy`;
  const s = await dosyaVer(ad, await yedekOlustur(), "application/octet-stream");
  if (s !== "vazgecildi") { await Veri.ayarYaz("sonYedek", new Date().toISOString()); toast(s === "paylasildi" ? "Yedek gönderildi" : "Yedek dosyası indirildi"); ciz(); }
}

// ---------------------------------------------------------------- Google Drive yedeği
const googleBagli = () => !!(Veri.ayar("google") && Veri.ayar("google").giz);
async function driveYedekle(sessiz) {
  if (!googleBagli()) return false;
  if (sessiz && !Google.jetonVar()) return false;          // açılır pencere yalnız dokunuşla; sessizken jeton yoksa sonra
  try { await Google.jetonAl(sessiz); await Google.yedekYaz(await yedekOlustur(Veri.ayar("google").giz)); if (!sessiz) { toast("☁ Drive'a yedeklendi"); ciz(); } return true; }
  catch (e) { if (!sessiz) toast("Drive'a yedeklenemedi: " + e.message); return false; }
}
function driveGeriYukleSor(metin, sonra) {
  perde(`<h3>☁ Drive'daki yedeği geri yükle</h3><p class="kucuk">Bu telefondaki kayıtların YERİNE geçer.</p><label>Yedeğin şifresi (yedek alındığı zamanki giriş şifresi)<input class="girdi" id="dS" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc"></label><p class="hata" id="dH"></p><button class="btn ana" id="dK">Geri yükle</button><button class="btn ince" data-kapat>Vazgeç</button>`, s => {
    s.querySelector("[data-kapat]").onclick = kapat; s.querySelector("#dS").focus();
    s.querySelector("#dK").onclick = async () => { const pin = s.querySelector("#dS").value;
      try { const y = await yedekCoz(metin, pin, Veri.ayar("google").giz); const g = Veri.ayar("google"); await Veri.iceAl(y); await Veri.ayarYaz("google", g); await Veri.ayarYaz("sonDrive", new Date().toISOString()); OTURUM.pin = pin; OTURUM.acik = true; await pinKaydet(pin); await lisansTazele(false);
        kapat(); toast(`Geri yüklendi · ${A().hasta.length} hasta, ${A().islem.length} işlem`); if (sonra) sonra(); else git("ana"); }
      catch (e) { s.querySelector("#dH").textContent = e.message; } }; });
}
async function googleBaglan(kurulumda) {
  try {
    toast("Google açılıyor…");
    const r = await Google.baglan();
    await lisansTazele(true);
    const f = await Google.yedekBilgi();
    if (f && (kurulumda || !A().islem.length)) { const m = await Google.yedekOku(); return driveGeriYukleSor(m); }
    if (kurulumda) { toast(`Bağlandı (${r.email}) · Drive'da yedek yok, yeni kurulum yapın`); return ciz(); }
    toast(`Bağlandı: ${r.email}${r.kodDegisti ? " · cihaz kodu Drive'dan geri geldi" : ""}`);
    await driveYedekle(false);
  } catch (e) { toast(e.message); }
}

// ---------------------------------------------------------------- hesaplar
const islemler = () => A().islem.slice().sort((a, b) => b.ts.localeCompare(a.ts));
const hastaBul = id => A().hasta.find(h => h.id === id);
const hastaIslem = id => islemler().filter(i => i.hastaId === id);
const kalemYazi = i => (i.kalemler || []).map(k => k.ad + (k.adet > 1 ? " ×" + k.adet : "")).join(" · ");
const kisaYazi = i => { const k = (i.kalemler || []).filter(x => !/enjektör|seti|branül|turnike|pamuk|flaster/i.test(x.ad)); return (k.length ? k : i.kalemler || []).map(x => x.ad.replace(/ \d+ ml$/, "")).slice(0, 3).join(" + "); };
const borc = id => hastaIslem(id).filter(i => !i.odendi).reduce((s, i) => s + i.toplam, 0);
const alerjiEslesir = (h, m) => !!(h && m && m.alerji && kucuk(h.alerji).includes(kucuk(m.alerji)));
function stokUyarilari() {
  const t = bugun(), out = [];
  for (const m of A().malzeme) {
    if (m.stokTut && m.sinir > 0 && m.stok <= m.sinir) out.push({m, yazi: `${m.ad} ${m.stok} adet kaldı`, tur: "uy"});
    if (m.skt && m.skt.length >= 7 && m.skt.slice(0, 7) <= gunEkle(t, 60).slice(0, 7)) out.push({m, yazi: `${m.ad} son kullanma ${m.skt.slice(5, 7)}.${m.skt.slice(0, 4)}`, tur: "teh"});
  }
  return out;
}
async function stokDegistir(kalemler, isaret) {
  for (const k of kalemler || []) { const m = A().malzeme.find(x => x.id === k.malId); if (m && m.stokTut) { m.stok = (+m.stok || 0) + isaret * k.adet; await Veri.kaydet("malzeme", m); } }
}

// ---------------------------------------------------------------- oturum, kilit, lisans
const OTURUM = {acik: false, pin: "", gizlendi: 0, durum: null};
function izinVar(ne) {
  const d = OTURUM.durum;
  if (d && !d.acik) { toast(d.yaz + " · " + (ne || "yeni kayıt") + " yapılamaz"); return false; }
  return true;
}
async function lisansTazele(ag) {
  if (ag) await Lisans.listeAl();
  OTURUM.durum = await Lisans.durum();
  if (ag) Lisans.bildir(SURUM);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) OTURUM.gizlendi = Date.now();
  else if (OTURUM.acik && Date.now() - OTURUM.gizlendi > (Veri.ayar("kilitDk") || 2) * 60e3 && OTURUM.gizlendi) { OTURUM.acik = false; OTURUM.pin = ""; kapat(); ciz(); }
  else if (OTURUM.acik) lisansTazele(true).then(ciz);
});

// ---------------------------------------------------------------- yönlendirme
const YOL = () => (location.hash || "#ana").slice(1).split("/");
window.addEventListener("hashchange", () => { kapat(); ciz(); });
const git = h => { if (location.hash === "#" + h) ciz(); else location.hash = h; };
const ALT = [["ana", "⌂", "Ana sayfa"], ["hastalar", "☺", "Hastalar"], ["malzeme", "▤", "Malzeme"], ["kasa", "₺", "Kasa"], ["ayarlar", "⚙", "Ayarlar"]];
const altCubuk = on => `<nav class="alt">${ALT.map(([k, i, t]) => `<button data-git="${k}" class="${on === k ? "on" : ""}"><i>${i}</i>${t}</button>`).join("")}</nav>`;
function seritler() {
  const d = OTURUM.durum, out = [];
  if (d && !d.acik) out.push(`<div class="serit teh">🔒 ${esc(d.yaz)} · kayıtlarınız duruyor<button data-a="saticiya">Satıcıya yaz</button></div>`);
  else if (d && d.tur === "deneme" && d.kalan <= 2) out.push(`<div class="serit uy">${esc(d.yaz)}<button data-a="saticiya">Lisans al</button></div>`);
  if (d && d.duyuru) out.push(`<div class="serit ana">📣 ${esc(d.duyuru)}</div>`);
  const sy = Veri.ayar("sonYedek");
  const sd = Veri.ayar("sonDrive");
  if (googleBagli() && A().islem.length && (!sd || Date.now() - new Date(sd).getTime() > 20 * 3600e3)) out.push(`<div class="serit ana">☁ ${sd ? "Son Drive yedeği " + tr(yerel(new Date(sd))) : "Drive'a henüz yedek gitmedi"}<button data-a="driveYedek">Şimdi yedekle</button></div>`);
  if (A().islem.length && (!sy || Date.now() - new Date(sy).getTime() > 36 * 3600e3) && !googleBagli()) out.push(`<div class="serit uy">💾 ${sy ? "Son yedek " + tr(yerel(new Date(sy))) : "Henüz yedek almadınız"}<button data-a="yedek">Yedeği gönder</button></div>`);
  return out.join("");
}

// ---------------------------------------------------------------- çizim
function ciz() {
  const u = $("#uyg");
  if (!Veri.ayar("kurulum")) { u.innerHTML = kurulumEkrani(); return BAGLA.kurulum(u); }
  if (!OTURUM.acik) return kilitEkrani(u);
  const [y, p] = YOL();
  const E = {ana: anaEkran, yeni: yeniEkran, hasta: hastaEkran, hastalar: hastalarEkran, malzeme: p ? malzemeEkran : malzemelerEkran, kasa: kasaEkran, ayarlar: ayarlarEkran}[y] || anaEkran;
  u.innerHTML = E(p);
  const b = u.querySelector("[data-baglan]"); if (b && BAGLA[b.dataset.baglan]) BAGLA[b.dataset.baglan](u, p);
}
const ust = (baslik, alt, sol, sag) => `<header class="ust">${sol ? `<button class="geri" data-a="geri" aria-label="Geri">‹</button>` : ""}<h1>${baslik}${alt ? `<small>${alt}</small>` : ""}</h1>${sag || ""}</header>`;

// 0 · kurulum
function kurulumEkrani() {
  return `<main class="ic" style="padding-top:calc(20px + env(safe-area-inset-top,0px));gap:12px" data-baglan="kurulum">
    <div class="logo">✚</div><div style="text-align:center"><b style="font-size:22px">Klinik Defteri</b><div class="kucuk">Hoş geldiniz · işletmenizi tanıtın</div></div>
    <label>İşletme adı<input class="girdi" id="kAd" autocomplete="organization" placeholder="Tabelada yazan ad"></label>
    <label>İşletme telefonu * <span style="font-weight:400">(fişte ve hatırlatmada görünür)</span><input class="girdi" id="kTel" type="tel" inputmode="tel" placeholder="Telefon numarası"></label>
    <div class="ikili-g"><label>Giriş şifresi (4 hane)<input class="girdi" id="kPin" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc;letter-spacing:8px;text-align:center"></label>
      <label>Şifre (tekrar)<input class="girdi" id="kPin2" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc;letter-spacing:8px;text-align:center"></label></div>
    <div class="kart" style="display:grid;gap:8px"><div style="display:flex;gap:10px;align-items:center"><span class="av" style="background:#fff;border:1px solid var(--cizgi);color:#4285f4">G</span>
      <div style="flex:1"><b style="font-size:14px">Google ile bağla</b> <span class="et e-ana">isteğe bağlı</span><div class="kucuk">${GOOGLE_CLIENT_ID ? "Telefon değişse de lisansınız ve kayıtlarınız kaybolmaz: yedek kendi Drive'ınıza şifreli gider. Kurulumdan sonra Ayarlar'dan bağlarsınız." : "Yakında: telefon değişse de kayıtlarınız kaybolmasın diye Drive'a otomatik yedek. Ayarlar'dan bağlanacak."}</div></div></div></div>
    <div class="kart kucuk">🔒 Hasta bilgileri yalnız bu telefonda tutulur. Program her gün yedeği kendinize (WhatsApp, Drive) göndermenizi hatırlatır.</div>
    <p class="hata" id="kHata"></p>
    <button class="btn ana" id="kGo">Başla</button>
    ${GOOGLE_CLIENT_ID ? `<button class="btn ince" data-a="googleKurulum">Daha önce kullandım · Google ile geri yükle</button>` : ""}
    <p class="kucuk" style="text-align:center">Sürüm ${SURUM}</p></main>`;
}
// kilit
function kilitEkrani(u) {
  let pin = "";
  const ciz2 = (h = "") => {
    u.innerHTML = `<main class="kilit"><div class="logo">✚</div><div><b style="font-size:20px">${esc(Veri.ayar("isletmeAd") || "Klinik Defteri")}</b><div class="kucuk">Giriş şifrenizi yazın</div></div>
      <div class="pin">${[0, 1, 2, 3].map(i => `<span class="${i < pin.length ? "d" : ""}"></span>`).join("")}</div><p class="hata">${esc(h)}</p>
      <div class="pin-tus">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join("")}<button class="bos" data-a="unuttum" style="font-size:12px;color:var(--soluk)">Unuttum</button><button data-n="0">0</button><button class="bos" data-sil>⌫</button></div></main>`;
    u.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { if (pin.length < 4) { pin += b.dataset.n; ciz2(); if (pin.length === 4) dene(); } });
    u.querySelector("[data-sil]").onclick = () => { pin = pin.slice(0, -1); ciz2(); };
  };
  const dene = async () => {
    const y = Veri.ayar("yanlis") || {n: 0, t: 0};
    if (y.n >= 5 && Date.now() - y.t < 5 * 60e3) { pin = ""; return ciz2(`Çok fazla yanlış deneme · ${Math.ceil((5 * 60e3 - (Date.now() - y.t)) / 60e3)} dk sonra tekrar deneyin`); }
    if (await pinDogru(pin)) { await Veri.ayarYaz("yanlis", {n: 0, t: 0}); OTURUM.acik = true; OTURUM.pin = pin; ciz(); lisansTazele(true).then(ciz); return; }
    await Veri.ayarYaz("yanlis", {n: (y.n >= 5 ? 0 : y.n) + 1, t: Date.now()}); pin = ""; ciz2(y.n + 1 >= 4 ? "Şifre yanlış · son deneme" : "Şifre yanlış");
  };
  document.onkeydown = e => { if (OTURUM.acik) return; if (/^\d$/.test(e.key) && pin.length < 4) { pin += e.key; ciz2(); if (pin.length === 4) dene(); } else if (e.key === "Backspace") { pin = pin.slice(0, -1); ciz2(); } };
  ciz2();
}

// 1 · ana ekran
function anaEkran() {
  const t = bugun(), bu = islemler().filter(i => i.ts.startsWith(t));
  const kasa = bu.filter(i => i.odendi).reduce((s, i) => s + i.toplam, 0), alin = A().islem.filter(i => !i.odendi).reduce((s, i) => s + i.toplam, 0);
  const hasta = new Set(bu.map(i => i.hastaId)).size, d = new Date(), su = stokUyarilari();
  const saatG = d.getHours() < 12 ? "Günaydın" : d.getHours() < 18 ? "İyi günler" : "İyi akşamlar";
  return `${ust(saatG, `${esc(Veri.ayar("isletmeAd") || "")} · ${GUNLER[d.getDay()]} ${d.getDate()} ${AY_TAM[d.getMonth()]}`, false, `<span class="yuv">${esc(bas(Veri.ayar("isletmeAd")))}</span>`)}
  ${seritler()}<main class="ic">
    <div class="kahraman"><small>Bugün kasa</small><b>${tl(kasa)}</b><div class="ikili"><span><b>${hasta}</b> hasta</span><span><b>${bu.length}</b> işlem</span><span><b>${tl(alin)}</b> alınacak</span></div></div>
    <button class="btn ana" data-git="yeni">＋  Yeni işlem</button>
    <div class="bas">Bugün<button data-git="kasa" style="color:var(--ana);font-weight:600">Kasa ›</button></div>
    ${bu.length ? `<div class="kart liste">${bu.slice(0, 12).map(satirIslem).join("")}</div>` : `<div class="kart bos-durum"><b>Bugün henüz işlem yok</b>İlk hastanız gelince "Yeni işlem"e dokunun.</div>`}
    ${su.slice(0, 3).map(x => `<button class="kart" data-git="malzeme/${x.m.id}" style="display:flex;gap:10px;align-items:center;padding:12px 14px;text-align:left"><span class="et ${x.tur === "uy" ? "e-uy" : "e-teh"}">${x.tur === "uy" ? "Stok" : "SKT"}</span><span style="font-size:13.5px;flex:1">${esc(x.yazi)}</span><span style="color:var(--ana);font-weight:600;font-size:13px">Gör ›</span></button>`).join("")}
  </main>${altCubuk("ana")}`;
}
function satirIslem(i) {
  const h = hastaBul(i.hastaId) || {ad: "Silinmiş hasta"};
  return `<div class="s" data-git="hasta/${h.id || ""}"><span class="av ${renk(h.ad)}">${esc(bas(h.ad))}</span><div class="m"><b>${esc(h.ad)}</b><small>${esc(kisaYazi(i))}${i.neden ? " · " + esc(i.neden) : ""}${i.odendi ? "" : ` · <span class="et e-uy">ödenmedi</span>`}</small></div><div class="t">${tl(i.toplam)}<small>${saat(i.ts)}</small></div></div>`;
}

// 2-3 · yeni işlem
const YENI = {hastaId: "", ad: "", adet: {}, grup: "Sık", tutarElle: null, odeme: "", neden: "", not: "", tel: "", tc: "", dogum: "", oneri: false};
function yeniSifirla(hastaId) { Object.assign(YENI, {hastaId: hastaId || "", ad: hastaId ? (hastaBul(hastaId) || {}).ad || "" : "", adet: {}, grup: "Sık", tutarElle: null, odeme: odemeTurleri()[0] || "Nakit", neden: "", not: "", tel: "", tc: "", dogum: "", oneri: false}); }
function yeniEkran(p) {
  if (p === "sifirla" || (p && p !== YENI.hastaId && hastaBul(p))) { yeniSifirla(p === "sifirla" ? "" : p); history.replaceState(null, "", "#yeni"); }
  const h = hastaBul(YENI.hastaId), d = new Date();
  return `${ust(h ? esc(h.ad) : "Yeni işlem", h ? (h.alerji ? "⚠ " + esc(h.alerji) + " · " : "") + (hastaIslem(h.id).length + 1) + ". geliş" : tr(yerel(d)) + " · " + saat(yerel(d)), true)}
  <main class="ic" data-baglan="yeni"><div id="yeniIc">${yeniIc()}</div></main>`;
}
function yeniIc() {
  const h = hastaBul(YENI.hastaId), HA = hastaAyar();
  let html = "";
  if (!h) {
    const q = kucuk(YENI.ad.trim()), qd = YENI.ad.replace(/\D/g, "");
    const es = q.length >= 2 ? A().hasta.filter(x => kucuk(x.ad).includes(q) || (qd.length >= 3 && String(x.tel || "").replace(/\D/g, "").includes(qd))).slice(0, 5) : [];
    html += `<label>Hasta adı soyadı<input class="girdi" id="yAd" value="${esc(YENI.ad)}" autocomplete="off" placeholder="Ad soyad ya da telefon yazın"></label>`;
    if (YENI.yeniHasta) html += `<div class="serit ana" style="margin:0">＋ Yeni hasta olarak kaydedilecek<button data-hdegis>Değiştir</button></div>`;
    else if (q.length >= 2) html += `<div class="oneri">${es.map(x => { const s = hastaIslem(x.id)[0]; return `<button class="s" data-hsec="${x.id}" style="width:100%;text-align:left"><span class="av ${renk(x.ad)}">${esc(bas(x.ad))}</span><div style="flex:1"><b>${esc(x.ad)}</b><small>${x.tel ? esc(x.tel) : "telefon yok"}${s ? " · son geliş " + tr(s.ts) : ""}</small></div>${x.alerji ? `<span class="et e-teh">alerji</span>` : ""}</button>`; }).join("")}
      <button class="s" data-hyeni style="width:100%;text-align:left"><span class="av" style="background:var(--zemin);color:var(--ana)">＋</span><div style="flex:1"><b style="color:var(--ana)">"${esc(YENI.ad.trim())}" yeni hasta olarak ekle</b></div></button></div>`;
    if (YENI.yeniHasta) {
      html += (HA.tel ? `<label>Telefon (isteğe bağlı)<input class="girdi" id="yTel" type="tel" inputmode="tel" value="${esc(YENI.tel)}" placeholder="Boş bırakılabilir"></label>` : "")
        + (HA.tc ? `<label>TC kimlik no (isteğe bağlı)<input class="girdi" id="yTc" inputmode="numeric" maxlength="11" value="${esc(YENI.tc)}"></label>` : "")
        + (HA.dogum ? `<label>Doğum yılı (isteğe bağlı)<input class="girdi" id="yDogum" inputmode="numeric" maxlength="4" value="${esc(YENI.dogum)}"></label>` : "");
    }
    if (!YENI.yeniHasta) return html + `<div class="bos-durum">Hastanın adını yazın. Daha önce geldiyse listeden seçin; alerjisi ve son gelişi görünür.</div>`;
  } else {
    if (h.alerji) html += `<div class="uyari-kutu">⚠ ${esc(h.alerji)}</div>`;
    const s = hastaIslem(h.id)[0];
    if (s) html += `<div class="kart" style="display:grid;gap:6px"><div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--soluk);font-weight:600"><span>SON GELİŞ · ${tr(s.ts)}</span><button data-git="hasta/${h.id}" style="color:var(--ana);font-weight:600">Hasta kartı ›</button></div>
      ${s.neden ? `<div style="font-size:13px;color:var(--vurgu);font-weight:700">${esc(s.neden)}</div>` : ""}<div style="font-size:13.5px">${esc(kalemYazi(s))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">${tl(s.toplam)}</b><button class="cip on" data-aynisi="${s.id}" style="font-size:12.5px">↻ Aynısını ekle</button></div></div>`;
  }
  const M = A().malzeme, sik = M.filter(m => m.sik);
  const goster = YENI.grup === "Sık" ? (sik.length ? sik : M.slice(0, 8)) : M.filter(m => m.grup === YENI.grup);
  const secili = M.filter(m => YENI.adet[m.id] > 0 && !goster.includes(m));
  const otom = M.reduce((s, m) => s + (YENI.adet[m.id] || 0) * (+m.satis || 0), 0), top = YENI.tutarElle != null ? YENI.tutarElle : otom;
  const kalem = Object.values(YENI.adet).filter(x => x > 0).length;
  html += `<label>Geliş nedeni${HA.neden ? " *" : " (isteğe bağlı)"}<input class="girdi" id="yNeden" value="${esc(YENI.neden)}" placeholder="Şikâyet ya da tanı"></label>
    <div class="cips">${["Sık", ...GRUPLAR].map(g => `<button class="cip ${YENI.grup === g ? "on" : ""}" data-grup="${g}">${g === "Sık" ? "Sık kullanılan" : g.replace(" / ampul", "")}</button>`).join("")}</div>
    <div class="kart" style="padding:4px 14px">${[...secili, ...goster].map(m => {
      const n = YENI.adet[m.id] || 0, al = alerjiEslesir(h, m);
      return `<div class="mal"><div class="ad">${esc(m.ad)}<small>${tl(m.satis)}${m.stokTut ? " · stok " + m.stok : ""}${al ? ` · <span class="et e-teh">alerji uyarısı</span>` : ""}</small></div><div class="adet ${n ? "" : "sif"}"><button data-eksi="${m.id}" aria-label="Azalt">−</button><span class="n">${n}</span><button data-arti="${m.id}" aria-label="Artır">＋</button></div></div>`; }).join("") || `<div class="bos-durum">Bu grupta malzeme yok. Malzeme ekranından ekleyin.</div>`}</div>
    <label>Not<input class="girdi" id="yNot" value="${esc(YENI.not)}" placeholder="Kısa not (isteğe bağlı)"></label>
    <div class="toplam"><div><small>Toplam · ${kalem} kalem${YENI.tutarElle != null ? " · elle" : ""}</small><br><button data-tutar style="color:#fff"><b>${tl(top)}</b> <span style="font-size:12px;opacity:.7">✎</span></button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:62%">${[...odemeTurleri(), "Sonra"].map(o => `<button class="cip" data-odeme="${esc(o)}" style="${YENI.odeme === o ? "background:#fff;color:var(--yazi)" : "background:rgba(255,255,255,.12);color:#fff;box-shadow:none"}">${esc(o)}</button>`).join("")}</div></div>
    <button class="btn koyu" data-kaydet>Kaydet</button>`;
  return html;
}
async function yeniKaydet() {
  if (!izinVar("yeni işlem")) return;
  const HA = hastaAyar();
  let h = hastaBul(YENI.hastaId);
  if (!h) {
    const ad = YENI.ad.trim().replace(/\s+/g, " ");
    if (ad.length < 2) return toast("Hastanın adını yazın");
    h = await Veri.kaydet("hasta", {ad, tel: YENI.tel.trim(), tc: YENI.tc.trim(), dogum: YENI.dogum.trim(), alerji: "", not: "", ilk: yerel(new Date())});
  }
  const kalemler = A().malzeme.filter(m => YENI.adet[m.id] > 0).map(m => ({malId: m.id, ad: m.ad, adet: YENI.adet[m.id], fiyat: +m.satis || 0, alis: +m.alis || 0}));
  if (!kalemler.length && YENI.tutarElle == null) return toast("En az bir malzeme ya da hizmet seçin");
  if (HA.neden && !YENI.neden.trim()) return toast("Geliş nedenini yazın");
  const otom = kalemler.reduce((s, k) => s + k.adet * k.fiyat, 0);
  const i = await Veri.kaydet("islem", {hastaId: h.id, ts: yerel(new Date()).slice(0, 19), neden: YENI.neden.trim(), kalemler, toplam: YENI.tutarElle != null ? YENI.tutarElle : otom,
    odeme: YENI.odeme === "Sonra" ? "" : YENI.odeme, odendi: YENI.odeme !== "Sonra", not: YENI.not.trim()});
  await stokDegistir(i.kalemler, -1);
  toast(`${h.ad} · ${tl(i.toplam)} kaydedildi`); yeniSifirla(); git("hasta/" + h.id);
  driveYedekle(true);
}

// 4 · hasta kartı
function hastaEkran(id) {
  const h = hastaBul(id); if (!h) return `${ust("Hasta bulunamadı", "", true)}<main class="ic"></main>${altCubuk("hastalar")}`;
  const is = hastaIslem(id), od = is.filter(i => i.odendi).reduce((s, i) => s + i.toplam, 0), b = borc(id), wa = waNo(h.tel);
  const uy = [h.alerji, h.not].filter(Boolean).join(" · ");
  return `${ust(esc(h.ad), [h.tel, h.ilk ? "ilk geliş " + tr(h.ilk) : ""].filter(Boolean).map(esc).join(" · "), true, `<button class="geri" data-hduz="${h.id}" aria-label="Düzenle">✎</button>`)}
  <main class="ic">${uy ? `<div class="${h.alerji ? "uyari-kutu" : "serit ana"}" style="${h.alerji ? "" : "margin:0"}">${h.alerji ? "⚠ " : "📝 "}${esc(uy)}</div>` : ""}
    <div class="uc"><div class="kart"><small>Geliş</small><b>${is.length}</b></div><div class="kart"><small>Ödenen</small><b>${tl(od)}</b></div><div class="kart"><small>Borç</small><b style="color:${b ? "var(--uyari)" : "var(--iyi)"}">${tl(b)}</b></div></div>
    <div style="display:flex;gap:8px"><button class="btn ana" data-git="yeni/${h.id}" style="flex:1;padding:12px;font-size:15px">＋ Yeni işlem</button>
      ${wa ? `<a class="btn ince" href="https://wa.me/${wa}" target="_blank" rel="noopener" style="width:auto;padding:12px 16px;text-decoration:none">💬</a><a class="btn ince" href="tel:${esc(h.tel)}" style="width:auto;padding:12px 16px;text-decoration:none">☎</a>` : ""}</div>
    <div class="bas">Gelişler</div>
    ${is.length ? `<div class="kart zaman">${is.map(i => `<button class="g" data-isl="${i.id}" style="text-align:left;width:100%"><div class="tar"><b>${i.ts.slice(8, 10)}</b><small>${AYLAR[+i.ts.slice(5, 7) - 1]}${i.ts.slice(0, 4) !== bugun().slice(0, 4) ? " " + i.ts.slice(2, 4) : ""}</small></div><div class="d">${i.neden ? `<span class="neden">${esc(i.neden)}</span><br>` : ""}<b>${esc(kisaYazi(i) || "İşlem")}</b><p>${esc(kalemYazi(i))}${i.not ? " · " + esc(i.not) : ""}</p><div class="tut">${tl(i.toplam)} · ${i.odendi ? esc(i.odeme || "ödendi") : `<span class="et e-uy">ödenmedi</span>`}</div></div></button>`).join("")}</div>` : `<div class="kart bos-durum">Henüz işlem yok.</div>`}
  </main>${altCubuk("hastalar")}`;
}
function hastaDuzenle(id) {
  const h = id ? hastaBul(id) : {ad: "", tel: "", tc: "", dogum: "", alerji: "", not: ""}, HA = hastaAyar();
  perde(`<h3>${id ? "Hasta bilgileri" : "Yeni hasta"}</h3>
    <label>Ad soyad<input class="girdi" id="hAd" value="${esc(h.ad)}"></label>
    ${HA.tel || h.tel ? `<label>Telefon<input class="girdi" id="hTel" type="tel" inputmode="tel" value="${esc(h.tel)}" placeholder="Boş bırakılabilir"></label>` : ""}
    ${HA.tc || h.tc ? `<label>TC kimlik no<input class="girdi" id="hTc" inputmode="numeric" maxlength="11" value="${esc(h.tc)}"></label>` : ""}
    ${HA.dogum || h.dogum ? `<label>Doğum yılı<input class="girdi" id="hDogum" inputmode="numeric" maxlength="4" value="${esc(h.dogum)}"></label>` : ""}
    <label>Alerji (her işlemde kırmızı uyarı)<input class="girdi" id="hAlerji" value="${esc(h.alerji)}" placeholder="Yoksa boş bırakın"></label>
    <label>Kalıcı not<textarea class="girdi" id="hNot" placeholder="Kullandığı ilaçlar, dikkat edilecekler">${esc(h.not)}</textarea></label>
    <button class="btn koyu" id="hKaydet">Kaydet</button>${id ? `<button class="btn ince" id="hSil" style="color:var(--tehlike)">Hastayı sil</button>` : ""}<button class="btn ince" data-kapat>Vazgeç</button>`, s => {
    s.querySelector("[data-kapat]").onclick = kapat;
    s.querySelector("#hKaydet").onclick = async () => {
      const v = k => (s.querySelector("#" + k) || {value: h[k.slice(1).toLowerCase()] || ""}).value.trim();
      const ad = v("hAd"); if (ad.length < 2) return toast("Adı yazın");
      if (!id && !izinVar("yeni hasta")) return;
      const o = Object.assign(h, {ad, tel: v("hTel"), tc: v("hTc"), dogum: v("hDogum"), alerji: v("hAlerji"), not: v("hNot")});
      if (!o.ilk) o.ilk = yerel(new Date());
      await Veri.kaydet("hasta", o); kapat(); toast("Kaydedildi"); id ? ciz() : git("hasta/" + o.id);
    };
    const sl = s.querySelector("#hSil"); if (sl) sl.onclick = () => onay(`${h.ad} ve ${hastaIslem(id).length} işlemi silinsin mi? Geri alınamaz.`, async () => {
      for (const i of hastaIslem(id)) await Veri.sil("islem", i.id);
      await Veri.sil("hasta", id); toast("Hasta silindi"); git("hastalar"); }, true);
  });
}
function islemDetay(iid) {
  const i = A().islem.find(x => x.id === iid); if (!i) return;
  perde(`<h3>${tr(i.ts)} · ${saat(i.ts)}</h3>${i.neden ? `<div style="color:var(--vurgu);font-weight:700">${esc(i.neden)}</div>` : ""}
    <div class="kart liste">${(i.kalemler || []).map(k => `<div class="s" style="cursor:default"><div class="m"><b>${esc(k.ad)}</b><small>${k.adet} × ${tl(k.fiyat)}</small></div><div class="t">${tl(k.adet * k.fiyat)}</div></div>`).join("") || `<div class="bos-durum">Kalem yok</div>`}</div>
    ${i.not ? `<div class="kart kucuk">📝 ${esc(i.not)}</div>` : ""}
    <div class="toplam"><div><small>Toplam</small><br><b>${tl(i.toplam)}</b></div><span>${i.odendi ? esc(i.odeme || "Ödendi") : "Ödenmedi"}</span></div>
    ${i.odendi ? "" : `<div class="bas">Ödeme alındı</div><div class="cips">${odemeTurleri().map(o => `<button class="cip" data-od="${esc(o)}">${esc(o)}</button>`).join("")}</div>`}
    <button class="btn ince" id="iSil" style="color:var(--tehlike)">İşlemi sil (stok geri eklenir)</button><button class="btn ince" data-kapat>Kapat</button>`, s => {
    s.querySelector("[data-kapat]").onclick = kapat;
    s.querySelectorAll("[data-od]").forEach(b => b.onclick = async () => { Object.assign(i, {odendi: true, odeme: b.dataset.od, odemeTs: yerel(new Date()).slice(0, 19)}); await Veri.kaydet("islem", i); kapat(); toast("Ödendi olarak işaretlendi"); ciz(); });
    s.querySelector("#iSil").onclick = () => onay("Bu işlem silinsin mi?", async () => { await stokDegistir(i.kalemler, +1); await Veri.sil("islem", i.id); toast("İşlem silindi"); ciz(); }, true);
  });
}

// 5 · hastalar
const HF = {q: "", f: "hepsi"};
function hastalarEkran() {
  return `${ust("Hastalar", A().hasta.length + " kayıt", false, `<button class="yuv" style="background:var(--vurgu)" data-hyenikart aria-label="Yeni hasta">＋</button>`)}
  ${seritler()}<main class="ic" data-baglan="hastalar"><label class="ara">⌕ <input id="hAra" value="${esc(HF.q)}" placeholder="İsim ya da telefon" autocomplete="off"></label>
    <div class="cips">${[["hepsi", "Hepsi"], ["hafta", "Bu hafta gelen"], ["borc", "Borcu olan"], ["alerji", "Alerjisi olan"]].map(([k, t]) => `<button class="cip ${HF.f === k ? "on" : ""}" data-hf="${k}">${t}${k === "borc" ? " · " + A().hasta.filter(h => borc(h.id) > 0).length : ""}</button>`).join("")}</div>
    <div id="hListe">${hastaListe()}</div></main>${altCubuk("hastalar")}`;
}
function hastaListe() {
  const q = kucuk(HF.q.trim()), qd = HF.q.replace(/\D/g, ""), hafta = gunEkle(bugun(), -7);
  const son = id => (hastaIslem(id)[0] || {}).ts || "";
  const L = A().hasta.map(h => ({h, s: son(h.id), b: borc(h.id), n: hastaIslem(h.id).length, od: hastaIslem(h.id).filter(i => i.odendi).reduce((s, i) => s + i.toplam, 0)}))
    .filter(x => (!q || kucuk(x.h.ad).includes(q) || (qd.length >= 3 && String(x.h.tel || "").replace(/\D/g, "").includes(qd)))
      && (HF.f === "hepsi" || (HF.f === "hafta" && x.s >= hafta) || (HF.f === "borc" && x.b > 0) || (HF.f === "alerji" && x.h.alerji)))
    .sort((a, b) => (b.s || b.h.ilk || "").localeCompare(a.s || a.h.ilk || ""));
  if (!L.length) return `<div class="kart bos-durum">${A().hasta.length ? "Eşleşen hasta yok." : "<b>Henüz hasta yok</b>İlk işlemi girdiğinizde hasta kendiliğinden eklenir."}</div>`;
  return `<div class="kart liste">${L.slice(0, 200).map(x => `<div class="s" data-git="hasta/${x.h.id}"><span class="av ${renk(x.h.ad)}">${esc(bas(x.h.ad))}</span><div class="m"><b>${esc(x.h.ad)}</b><small>${x.s ? (x.s.startsWith(bugun()) ? "Bugün" : tr(x.s)) : "işlem yok"} · ${x.n} geliş${x.h.tel ? "" : " · telefon yok"}${x.h.alerji ? ` · <span class="et e-teh">alerji</span>` : ""}${x.b ? ` · <span class="et e-uy">${tl(x.b)} borç</span>` : ""}</small></div><div class="t">${tl(x.od)}</div></div>`).join("")}</div>`;
}

// 6-7 · malzemeler
const MF = {q: "", g: "Hepsi"};
function malzemelerEkran() {
  const M = A().malzeme, deger = M.filter(m => m.stokTut).reduce((s, m) => s + (+m.stok || 0) * (+m.alis || 0), 0);
  return `${ust("Malzemeler", `${M.length} kalem · stok değeri ${tl(deger)}`, false, `<button class="yuv" style="background:var(--vurgu)" data-git="malzeme/yeni" aria-label="Yeni malzeme">＋</button>`)}
  ${seritler()}<main class="ic" data-baglan="malzemeler"><label class="ara">⌕ <input id="mAra" value="${esc(MF.q)}" placeholder="Malzeme ara" autocomplete="off"></label>
    <div class="cips">${["Hepsi", ...GRUPLAR].map(g => `<button class="cip ${MF.g === g ? "on" : ""}" data-mg="${g}">${g.replace(" / ampul", "")}</button>`).join("")}</div>
    <div id="mListe">${malzemeListe()}</div></main>${altCubuk("malzeme")}`;
}
function malzemeListe() {
  const q = kucuk(MF.q.trim()), t = bugun();
  const L = A().malzeme.filter(m => (MF.g === "Hepsi" || m.grup === MF.g) && (!q || kucuk(m.ad).includes(q)));
  if (!L.length) return `<div class="kart bos-durum">${A().malzeme.length ? "Eşleşen malzeme yok." : "<b>Malzeme listesi boş</b>＋ ile ilk malzemeyi ekleyin."}</div>`;
  return `<div class="kart" style="padding:4px 14px">${GRUPLAR.map(g => { const gl = L.filter(m => m.grup === g).sort((a, b) => a.ad.localeCompare(b.ad, "tr")); return gl.length ? `<div class="kat">${g.toLocaleUpperCase("tr")}</div>` + gl.map(m => {
    const az = m.stokTut && m.sinir > 0 && m.stok <= m.sinir, skt = m.skt && m.skt.slice(0, 7) <= gunEkle(t, 60).slice(0, 7);
    return `<button class="mal" data-git="malzeme/${m.id}" style="width:100%;text-align:left"><div class="ad">${esc(m.ad)}<small>${m.stokTut ? "Stok " + m.stok : "Stok tutulmaz"}${az ? ` · <span class="et e-uy">azaldı</span>` : ""}${skt ? ` · <span class="et e-teh">SKT ${m.skt.slice(5, 7)}.${m.skt.slice(0, 4)}</span>` : ""}${m.sik ? " · ★" : ""}</small></div><div class="fiyat">${tl(m.satis)}${m.alis ? `<small>alış ${tl(m.alis)}</small>` : ""}</div></button>`; }).join("") : ""; }).join("")}</div>`;
}
function malzemeEkran(id) {
  const yeni = id === "yeni", m = yeni ? {ad: "", grup: MF.g !== "Hepsi" ? MF.g : "İlaç / ampul", satis: "", alis: "", stok: 0, sinir: 0, skt: "", sik: false, alerji: "", stokTut: true} : A().malzeme.find(x => x.id === id);
  if (!m) return `${ust("Malzeme bulunamadı", "", true)}<main class="ic"></main>`;
  return `${ust(yeni ? "Yeni malzeme" : "Malzeme", esc(m.ad), true)}<main class="ic" data-baglan="malzeme">
    <label>Adı<input class="girdi" id="mAd" value="${esc(m.ad)}" placeholder="Malzeme ya da hizmet adı"></label>
    <label>Grubu</label><div class="cips" style="margin-top:-6px" id="mGrup">${GRUPLAR.map(g => `<button class="cip ${m.grup === g ? "on" : ""}" data-g="${g}">${g}</button>`).join("")}</div>
    <div class="ikili-g"><label>Satış fiyatı (₺)<input class="girdi" id="mSatis" inputmode="decimal" value="${esc(m.satis)}"></label><label>Alış fiyatı (₺)<input class="girdi" id="mAlis" inputmode="decimal" value="${esc(m.alis)}"></label></div>
    <div class="kart ayar" style="padding:2px 14px"><div class="s"><div>Stok tut<small>Hizmetlerde kapatın</small></div><button class="anah ${m.stokTut ? "on" : ""}" id="mStokTut" aria-label="Stok tut"></button></div></div>
    <div class="ikili-g" id="mStokAlan" ${m.stokTut ? "" : "hidden"}><label>Stok<input class="girdi" id="mStok" inputmode="numeric" value="${esc(m.stok)}"></label><label>Bu sayının altında uyar<input class="girdi" id="mSinir" inputmode="numeric" value="${esc(m.sinir)}"></label></div>
    <label>Son kullanma tarihi (ay)<input class="girdi" id="mSkt" type="month" value="${esc((m.skt || "").slice(0, 7))}"></label>
    <div class="kart ayar" style="padding:2px 14px"><div class="s"><div>Sık kullanılanlarda göster<small>Yeni işlemde en üstte</small></div><button class="anah ${m.sik ? "on" : ""}" id="mSik" aria-label="Sık kullanılan"></button></div>
      <div class="s" style="display:grid;gap:6px;justify-content:stretch"><div>Alerji uyarısı<small>Hastanın alerjisinde bu kelime geçerse uyarır</small></div><input class="girdi" id="mAlerji" value="${esc(m.alerji)}" placeholder="Etken madde ya da grup adı"></div></div>
    <div class="ikili-g">${yeni ? "" : `<button class="btn ince" id="mGiris">＋ Stok girişi</button>`}<button class="btn koyu" id="mKaydet" style="${yeni ? "grid-column:span 2" : ""}">Kaydet</button></div>
    ${yeni ? "" : `<button class="btn ince" id="mSil" style="color:var(--tehlike)">Malzemeyi sil</button>`}</main>`;
}

// 8 · kasa
const KF = {d: "ay", a: "", b: ""};
function kasaAraligi() {
  const t = bugun();
  if (KF.d === "gun") return [t, t];
  if (KF.d === "hafta") { const d = new Date(t + "T12:00:00"), g = (d.getDay() + 6) % 7; return [gunEkle(t, -g), t]; }
  if (KF.d === "ay") return [t.slice(0, 8) + "01", t];
  return [KF.a || t, KF.b || t];
}
function kasaEkran() {
  const [a, b] = kasaAraligi(), bitis = b + "T99", is = A().islem.filter(i => i.ts >= a && i.ts <= bitis);
  const od = is.filter(i => i.odendi), top = od.reduce((s, i) => s + i.toplam, 0);
  const tur = {}; od.forEach(i => { tur[i.odeme || "Diğer"] = (tur[i.odeme || "Diğer"] || 0) + i.toplam; });
  const alin = is.filter(i => !i.odendi).reduce((s, i) => s + i.toplam, 0), gider = is.reduce((s, i) => s + (i.kalemler || []).reduce((x, k) => x + k.adet * (k.alis || 0), 0), 0);
  const hasta = new Set(is.map(i => i.hastaId)).size, t = bugun();
  const gunler = [...Array(7)].map((_, k) => gunEkle(t, k - 6)), gt = gunler.map(g => A().islem.filter(i => i.odendi && i.ts.startsWith(g)).reduce((s, i) => s + i.toplam, 0)), mx = Math.max(1, ...gt);
  const say = {}; is.forEach(i => (i.kalemler || []).forEach(k => { if (!say[k.ad]) say[k.ad] = {n: 0, t: 0}; say[k.ad].n += k.adet; say[k.ad].t += k.adet * k.fiyat; }));
  const enCok = Object.entries(say).sort((x, y) => y[1].t - x[1].t).slice(0, 5);
  const baslik = KF.d === "gun" ? "Bugün" : KF.d === "hafta" ? "Bu hafta" : KF.d === "ay" ? AY_TAM[+t.slice(5, 7) - 1] + " " + t.slice(0, 4) : tr(a) + " – " + tr(b);
  return `${ust("Kasa", baslik)}${seritler()}<main class="ic" data-baglan="kasa">
    <div class="cips">${[["gun", "Bugün"], ["hafta", "Bu hafta"], ["ay", "Bu ay"], ["ozel", "Tarih seç"]].map(([k, x]) => `<button class="cip ${KF.d === k ? "on" : ""}" data-kd="${k}">${x}</button>`).join("")}</div>
    ${KF.d === "ozel" ? `<div class="ikili-g"><label>Başlangıç<input class="girdi" type="date" id="kA" value="${a}"></label><label>Bitiş<input class="girdi" type="date" id="kB" value="${b}"></label></div>` : ""}
    <div class="kahraman"><small>${esc(baslik)} toplamı</small><b>${tl(top)}</b><div class="ikili" style="flex-wrap:wrap;gap:6px 16px">${Object.entries(tur).map(([k, v]) => `<span>${esc(k)} <b>${tl(v).replace(" ₺", "")}</b></span>`).join("") || "<span>Henüz tahsilat yok</span>"}</div></div>
    <div class="kart"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--soluk)"><span>Son 7 gün</span><span>Bugün ${tl(gt[6])}</span></div>
      <div class="cubuk">${gt.map((v, k) => `<span class="${k === 6 ? "bug" : ""}" style="height:${Math.max(4, Math.round(v / mx * 100))}%" title="${tl(v)}"></span>`).join("")}</div>
      <div class="cubuk-alt">${gunler.map((g, k) => `<span>${k === 6 ? "Bugün" : GUNLER[new Date(g + "T12:00:00").getDay()].slice(0, 3)}</span>`).join("")}</div></div>
    <div class="uc"><div class="kart"><small>Hasta</small><b>${hasta}</b></div><div class="kart"><small>Alınacak</small><b style="color:${alin ? "var(--uyari)" : "inherit"}">${tl(alin)}</b></div><div class="kart"><small>Malzeme gideri</small><b>${tl(gider)}</b></div></div>
    <div class="bas">En çok yapılan</div>
    ${enCok.length ? `<div class="kart liste">${enCok.map(([k, v]) => `<div class="s" style="cursor:default"><div class="m"><b>${esc(k)}</b><small>${v.n} adet</small></div><div class="t">${tl(v.t)}</div></div>`).join("")}</div>` : `<div class="kart bos-durum">Bu dönemde işlem yok.</div>`}
    <button class="btn ince" data-a="excel">⬇ Excel'e aktar (${is.length} işlem)</button>
  </main>${altCubuk("kasa")}`;
}
async function excelAktar() {
  const [a, b] = kasaAraligi(), bitis = b + "T99";
  const is = A().islem.filter(i => i.ts >= a && i.ts <= bitis).sort((x, y) => x.ts.localeCompare(y.ts));
  const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const satir = [["Tarih", "Saat", "Hasta", "Telefon", "Geliş nedeni", "Yapılanlar", "Tutar", "Ödeme", "Not"].map(q).join(";")];
  for (const i of is) { const h = hastaBul(i.hastaId) || {}; satir.push([tr(i.ts), saat(i.ts), h.ad, h.tel, i.neden, kalemYazi(i), String(i.toplam).replace(".", ","), i.odendi ? i.odeme : "Ödenmedi", i.not].map(q).join(";")); }
  await dosyaVer(`KlinikDefteri-${a}-${b}.csv`, "﻿" + satir.join("\r\n"), "text/csv");
}

// 9 · ayarlar
function ayarlarEkran() {
  const HA = hastaAyar(), d = OTURUM.durum || {}, sy = Veri.ayar("sonYedek");
  const an = (k, on, t, alt) => `<div class="s"><div>${t}${alt ? `<small>${alt}</small>` : ""}</div><button class="anah ${on ? "on" : ""}" data-ha="${k}" aria-label="${esc(t)}"></button></div>`;
  return `${ust("Ayarlar")}${seritler()}<main class="ic" style="gap:10px">
    <div class="grup">İşletme</div><div class="kart ayar" style="padding:2px 14px"><button class="s" data-a="isletme" style="width:100%;text-align:left"><div>${esc(Veri.ayar("isletmeAd") || "İşletme adı")}<small>${esc(Veri.ayar("isletmeTel") || "")}${Veri.ayar("isletmeAdres") ? " · " + esc(Veri.ayar("isletmeAdres")) : ""}</small></div><span class="ok">›</span></button></div>
    <div class="grup">Hasta kaydı</div><div class="kart ayar" style="padding:2px 14px">${an("tel", HA.tel, "Telefon sor", "Boş bırakılabilir")}${an("tc", HA.tc, "TC kimlik no sor", "Açarsanız saklama sorumluluğu sizdedir (KVKK)")}${an("dogum", HA.dogum, "Doğum yılı sor")}${an("neden", HA.neden, "Geliş nedeni zorunlu")}</div>
    <div class="grup">Ödeme türleri</div><div class="kart ayar" style="padding:2px 14px"><button class="s" data-a="odeme" style="width:100%;text-align:left"><div>${odemeTurleri().map(esc).join(" · ")}<small>Ekle, sil, adını değiştir</small></div><span class="ok">›</span></button></div>
    <div class="grup">Güvenlik ve yedek</div><div class="kart ayar" style="padding:2px 14px">
      <button class="s" data-a="pin" style="width:100%;text-align:left"><div>Giriş şifresi<small>4 hane · ${Veri.ayar("kilitDk") || 2} dk arka planda kalınca kilitlenir</small></div><span class="ok">›</span></button>
      <button class="s" data-a="google" style="width:100%;text-align:left"><div>${googleBagli() ? "Google · " + esc(Veri.ayar("google").e) : "Google ile bağla"}<small>${googleBagli() ? (Veri.ayar("sonDrive") ? "Son Drive yedeği " + tr(yerel(new Date(Veri.ayar("sonDrive")))) + " " + saat(yerel(new Date(Veri.ayar("sonDrive")))) : "Drive'a henüz yedek gitmedi") : "Drive'a otomatik yedek · telefon değişse de kaybolmaz · isteğe bağlı"}</small></div><span class="et ${googleBagli() ? "e-iyi" : "e-ana"}">${googleBagli() ? "Bağlı" : "Bağla"}</span></button>
      <button class="s" data-a="yedek" style="width:100%;text-align:left"><div>Yedeği gönder<small>${sy ? "Son yedek " + tr(yerel(new Date(sy))) + " " + saat(yerel(new Date(sy))) : "Henüz yedek alınmadı"} · WhatsApp, Drive, e-posta</small></div><span class="ok">›</span></button>
      <button class="s" data-a="geriyukle" style="width:100%;text-align:left"><div>Yedekten geri yükle<small>Yeni telefonda ya da silinip kurulunca</small></div><span class="ok">›</span></button></div>
    <div class="grup">Program</div><div class="kart ayar" style="padding:2px 14px">
      <button class="s" data-a="kopyala" style="width:100%;text-align:left"><div>Lisans<small>Cihaz kodu <b style="font-family:monospace">${esc(Veri.ayar("cihaz") || "")}</b> · dokunup kopyalayın</small></div><span class="et ${d.acik ? (d.tur === "deneme" ? "e-uy" : "e-iyi") : "e-teh"}">${esc(d.yaz || "…")}</span></button>
      <button class="s" data-a="lisansYenile" style="width:100%;text-align:left"><div>Lisansı şimdi denetle<small>İnternet gerekir</small></div><span class="ok">↻</span></button>
      <button class="s" data-a="saticiya" style="width:100%;text-align:left"><div>Satıcıyla iletişim<small>Lisans, destek · WhatsApp</small></div><span class="ok">›</span></button>
      <div class="s"><div>Sürüm ${SURUM}<small>Veriler yalnız bu telefonda · KVKK: hasta bilgisi hiçbir yere gönderilmez</small></div></div></div>
  </main>${altCubuk("ayarlar")}`;
}

// ---------------------------------------------------------------- ekran olayları
const BAGLA = {
  kurulum(u) {
    u.querySelector("#kGo").onclick = async () => {
      const ad = u.querySelector("#kAd").value.trim(), tel = u.querySelector("#kTel").value.trim(), p1 = u.querySelector("#kPin").value, p2 = u.querySelector("#kPin2").value, h = u.querySelector("#kHata");
      if (ad.length < 2) return h.textContent = "İşletme adını yazın";
      if (tel.replace(/\D/g, "").length < 10) return h.textContent = "İşletme telefonunu yazın (en az 10 rakam)";
      if (!/^\d{4}$/.test(p1)) return h.textContent = "Şifre 4 rakam olmalı";
      if (p1 !== p2) return h.textContent = "Şifreler aynı değil";
      await Veri.ayarYaz("isletmeAd", ad); await Veri.ayarYaz("isletmeTel", tel); await pinKaydet(p1);
      if (!A().malzeme.length) for (const [ad2, grup, satis, alis, stok, sinir, alerji] of ORNEK_MALZEME)
        await Veri.kaydet("malzeme", {ad: ad2, grup, satis, alis, stok, sinir, skt: "", sik: SIK.includes(ad2), alerji: alerji || "", stokTut: grup !== "Hizmet" && !(stok === 0 && sinir === 0)});
      await Veri.ayarYaz("kurulum", new Date().toISOString());
      OTURUM.acik = true; OTURUM.pin = p1; await lisansTazele(true); git("malzeme"); toast("Hazır · malzeme ve fiyatlarınızı düzenleyin");
    };
  },
  yeni(u) {
    const ic = u.querySelector("#yeniIc");
    const tazele = (odak) => { const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; ic.innerHTML = yeniIc(); const e = id && ic.querySelector("#" + id); if (e && odak !== false) { e.focus(); try { e.setSelectionRange(pos, pos); } catch (x) {} } };
    ic.addEventListener("input", e => {
      const id = e.target.id, v = e.target.value;
      if (id === "yAd") { YENI.ad = v; YENI.yeniHasta = false; tazele(); }
      else if (id === "yNeden") YENI.neden = v; else if (id === "yNot") YENI.not = v; else if (id === "yTel") YENI.tel = v; else if (id === "yTc") YENI.tc = v; else if (id === "yDogum") YENI.dogum = v;
    });
    ic.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.hsec) { YENI.hastaId = b.dataset.hsec; YENI.yeniHasta = false; ciz(); return; }
      if (b.hasAttribute("data-hyeni")) { YENI.yeniHasta = true; tazele(false); return; }
      if (b.hasAttribute("data-hdegis")) { YENI.yeniHasta = false; tazele(false); const e = ic.querySelector("#yAd"); if (e) e.focus(); return; }
      if (b.dataset.grup) { YENI.grup = b.dataset.grup; tazele(false); return; }
      if (b.dataset.arti) { YENI.adet[b.dataset.arti] = (YENI.adet[b.dataset.arti] || 0) + 1; YENI.tutarElle = null; tazele(false); const m = A().malzeme.find(x => x.id === b.dataset.arti); if (alerjiEslesir(hastaBul(YENI.hastaId), m) && YENI.adet[m.id] === 1) toast("⚠ Dikkat: hastanın alerjisi bu malzemeyle eşleşiyor"); return; }
      if (b.dataset.eksi) { YENI.adet[b.dataset.eksi] = Math.max(0, (YENI.adet[b.dataset.eksi] || 0) - 1); YENI.tutarElle = null; tazele(false); return; }
      if (b.dataset.odeme) { YENI.odeme = b.dataset.odeme; tazele(false); return; }
      if (b.dataset.aynisi) { const i = A().islem.find(x => x.id === b.dataset.aynisi); YENI.adet = {}; (i.kalemler || []).forEach(k => { if (A().malzeme.some(m => m.id === k.malId)) YENI.adet[k.malId] = k.adet; }); YENI.neden = i.neden || ""; YENI.tutarElle = null; tazele(false); toast("Son işlem eklendi · gerekirse değiştirin"); return; }
      if (b.hasAttribute("data-tutar")) {
        perde(`<h3>Toplam tutar</h3><input class="girdi" id="tT" inputmode="decimal" style="font-size:24px;text-align:center"><div class="ikili-g"><button class="btn ince" id="tO">Otomatik hesapla</button><button class="btn koyu" id="tK">Tamam</button></div>`, s => {
          const i = s.querySelector("#tT"); i.value = YENI.tutarElle != null ? YENI.tutarElle : ""; i.focus();
          s.querySelector("#tO").onclick = () => { YENI.tutarElle = null; kapat(); tazele(false); };
          s.querySelector("#tK").onclick = () => { YENI.tutarElle = i.value.trim() === "" ? null : sayi(i.value); kapat(); tazele(false); }; });
        return;
      }
      if (b.hasAttribute("data-kaydet")) yeniKaydet();
    });
    const ad = ic.querySelector("#yAd"); if (ad && !YENI.ad) ad.focus();
  },
  hastalar(u) {
    u.querySelector("#hAra").addEventListener("input", e => { HF.q = e.target.value; u.querySelector("#hListe").innerHTML = hastaListe(); });
  },
  malzemeler(u) {
    u.querySelector("#mAra").addEventListener("input", e => { MF.q = e.target.value; u.querySelector("#mListe").innerHTML = malzemeListe(); });
  },
  malzeme(u, id) {
    const yeni = id === "yeni", m = yeni ? null : A().malzeme.find(x => x.id === id);
    let grup = (m && m.grup) || (MF.g !== "Hepsi" ? MF.g : "İlaç / ampul");
    u.querySelectorAll("#mGrup [data-g]").forEach(b => b.onclick = () => { grup = b.dataset.g; u.querySelectorAll("#mGrup [data-g]").forEach(x => x.classList.toggle("on", x === b)); });
    ["mStokTut", "mSik"].forEach(k => u.querySelector("#" + k).onclick = e => { e.currentTarget.classList.toggle("on"); if (k === "mStokTut") u.querySelector("#mStokAlan").hidden = !e.currentTarget.classList.contains("on"); });
    u.querySelector("#mKaydet").onclick = async () => {
      const v = k => u.querySelector("#" + k).value.trim(), ad = v("mAd");
      if (ad.length < 2) return toast("Malzeme adını yazın");
      const o = Object.assign(m || {}, {ad, grup, satis: sayi(v("mSatis")), alis: sayi(v("mAlis")), stokTut: u.querySelector("#mStokTut").classList.contains("on"),
        stok: Math.round(sayi(v("mStok"))), sinir: Math.round(sayi(v("mSinir"))), skt: v("mSkt"), sik: u.querySelector("#mSik").classList.contains("on"), alerji: v("mAlerji")});
      await Veri.kaydet("malzeme", o); toast("Kaydedildi"); git("malzeme");
    };
    const gb = u.querySelector("#mGiris"); if (gb) gb.onclick = () => perde(`<h3>Stok girişi · ${esc(m.ad)}</h3><label>Gelen adet<input class="girdi" id="gA" inputmode="numeric"></label><label>Yeni alış fiyatı (isteğe bağlı)<input class="girdi" id="gF" inputmode="decimal" placeholder="${esc(m.alis || "")}"></label><button class="btn koyu" id="gK">Ekle</button>`, s => {
      s.querySelector("#gA").focus();
      s.querySelector("#gK").onclick = async () => { const n = Math.round(sayi(s.querySelector("#gA").value)); if (!n) return toast("Adet yazın"); m.stok = (+m.stok || 0) + n; if (s.querySelector("#gF").value.trim()) m.alis = sayi(s.querySelector("#gF").value); m.stokTut = true; await Veri.kaydet("malzeme", m); kapat(); toast(`${n} adet eklendi · stok ${m.stok}`); ciz(); }; });
    const sl = u.querySelector("#mSil"); if (sl) sl.onclick = () => onay(`${m.ad} silinsin mi? (Eski işlemlerdeki kayıtlar durur.)`, async () => { await Veri.sil("malzeme", m.id); toast("Silindi"); git("malzeme"); }, true);
  },
  kasa(u) {
    ["kA", "kB"].forEach(k => { const e = u.querySelector("#" + k); if (e) e.onchange = () => { KF[k === "kA" ? "a" : "b"] = e.value; ciz(); }; });
  }
};

const EYLEM = {
  geri: () => (history.length > 1 ? history.back() : git("ana")),
  yedek: () => yedekGonder().catch(e => toast("Yedek alınamadı: " + e.message)),
  excel: () => excelAktar(),
  async kopyala() { const k = Veri.ayar("cihaz"); try { await navigator.clipboard.writeText(k); toast("Cihaz kodu kopyalandı: " + k); } catch (e) { toast("Cihaz kodu: " + k); } },
  async lisansYenile() { toast("Denetleniyor…"); const ok = await Lisans.listeAl(); await lisansTazele(false); Lisans.bildir(SURUM); ciz(); toast(ok ? "Lisans güncel: " + OTURUM.durum.yaz : "İnternete bağlanılamadı · " + OTURUM.durum.yaz); },
  saticiya() { const m = `Merhaba, Klinik Defteri için yazıyorum.\nİşletme: ${Veri.ayar("isletmeAd") || ""}\nCihaz kodu: ${Veri.ayar("cihaz") || ""}`; window.open(`https://wa.me/${SATICI_TEL}?text=${encodeURIComponent(m)}`, "_blank"); },
  unuttum() { perde(`<h3>Şifremi unuttum</h3><p class="kucuk">Güvenlik için şifre sıfırlanamaz. Yedeğiniz varsa programı silip yeniden kurun ve yedeği, yedek alındığı zamanki şifreyle geri yükleyin. Yardım için satıcınıza yazın.</p><button class="btn koyu" data-a="saticiya">Satıcıya yaz</button><button class="btn ince" data-kapat>Kapat</button>`, s => s.querySelector("[data-kapat]").onclick = kapat); },
  isletme() {
    perde(`<h3>İşletme bilgileri</h3><label>İşletme adı<input class="girdi" id="iA" value="${esc(Veri.ayar("isletmeAd") || "")}"></label><label>İşletme telefonu<input class="girdi" id="iT" type="tel" value="${esc(Veri.ayar("isletmeTel") || "")}"></label><label>Adres (isteğe bağlı)<input class="girdi" id="iD" value="${esc(Veri.ayar("isletmeAdres") || "")}" placeholder="Açık adres"></label><button class="btn koyu" id="iK">Kaydet</button>`, s => {
      s.querySelector("#iK").onclick = async () => { const a = s.querySelector("#iA").value.trim(), t = s.querySelector("#iT").value.trim(); if (a.length < 2) return toast("Adı yazın"); if (t.replace(/\D/g, "").length < 10) return toast("Telefonu yazın");
        await Veri.ayarYaz("isletmeAd", a); await Veri.ayarYaz("isletmeTel", t); await Veri.ayarYaz("isletmeAdres", s.querySelector("#iD").value.trim()); await Veri.ayarYaz("sonBildirim", 0); Lisans.bildir(SURUM); kapat(); toast("Kaydedildi"); ciz(); }; });
  },
  odeme() {
    const ciz3 = s => { const L = odemeTurleri(); s.querySelector("#oL").innerHTML = L.map((o, i) => `<div class="s"><input class="girdi" data-oi="${i}" value="${esc(o)}" style="padding:9px 12px"><button data-osil="${i}" style="color:var(--tehlike);font-size:20px;padding:0 8px" aria-label="Sil">×</button></div>`).join(""); };
    perde(`<h3>Ödeme türleri</h3><p class="kucuk">Yeni işlemde ve kasada bu adlar görünür. "Sonra" (ödenmedi) her zaman vardır.</p><div class="kart ayar" style="padding:2px 14px" id="oL"></div><button class="btn ince" id="oE">＋ Ödeme türü ekle</button><button class="btn koyu" id="oK">Kaydet</button>`, s => {
      ciz3(s);
      const oku = () => [...s.querySelectorAll("[data-oi]")].map(i => i.value.trim()).filter(Boolean);
      s.addEventListener("click", async e => { const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.osil) { const L = oku(); L.splice(+b.dataset.osil, 1); await Veri.ayarYaz("odemeTurleri", L); ciz3(s); }
        else if (b.id === "oE") { await Veri.ayarYaz("odemeTurleri", [...oku(), "Yeni ödeme türü"]); ciz3(s); const i = [...s.querySelectorAll("[data-oi]")].pop(); i.focus(); i.select(); }
        else if (b.id === "oK") { const L = [...new Set(oku())].filter(x => kucuk(x) !== "sonra"); if (!L.length) return toast("En az bir ödeme türü olmalı"); await Veri.ayarYaz("odemeTurleri", L); kapat(); toast("Kaydedildi"); ciz(); } });
    });
  },
  pin() {
    perde(`<h3>Giriş şifresini değiştir</h3><label>Mevcut şifre<input class="girdi" id="p0" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc"></label><div class="ikili-g"><label>Yeni şifre<input class="girdi" id="p1" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc"></label><label>Yeni (tekrar)<input class="girdi" id="p2" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc"></label></div>
      <label>Arka planda kaç dakika kalınca kilitlensin<select class="girdi" id="pD">${[1, 2, 5, 15].map(n => `<option ${+(Veri.ayar("kilitDk") || 2) === n ? "selected" : ""}>${n}</option>`).join("")}</select></label><p class="kucuk">Not: eski yedekler, alındıkları zamanki şifreyle açılır.</p><button class="btn koyu" id="pK">Kaydet</button>`, s => {
      s.querySelector("#pK").onclick = async () => { const p0 = s.querySelector("#p0").value, p1 = s.querySelector("#p1").value, p2 = s.querySelector("#p2").value;
        await Veri.ayarYaz("kilitDk", +s.querySelector("#pD").value);
        if (p0 || p1) { if (!(await pinDogru(p0))) return toast("Mevcut şifre yanlış"); if (!/^\d{4}$/.test(p1)) return toast("Yeni şifre 4 rakam olmalı"); if (p1 !== p2) return toast("Yeni şifreler aynı değil"); await pinKaydet(p1); OTURUM.pin = p1; }
        kapat(); toast("Kaydedildi"); ciz(); }; });
  },
  google() {
    if (!googleBagli()) return googleBaglan(false);
    const g = Veri.ayar("google");
    perde(`<h3>Google · ${esc(g.e)}</h3><p class="kucuk">Yedek, Google Drive'ınızda yalnız bu programın görebildiği gizli klasörde şifreli durur. Kayıt yaptıkça kendiliğinden güncellenir; günde bir "Şimdi yedekle" hatırlatması çıkabilir.</p>
      <button class="btn koyu" data-a="driveYedek">☁ Şimdi Drive'a yedekle</button><button class="btn ince" data-a="driveGeri">Drive'dan geri yükle</button><button class="btn ince" id="gK" style="color:var(--tehlike)">Bağlantıyı kaldır</button><button class="btn ince" data-kapat>Kapat</button>`, s => {
      s.querySelector("[data-kapat]").onclick = kapat;
      s.querySelector("#gK").onclick = () => onay("Google bağlantısı kaldırılsın mı? (Drive'daki yedek silinmez)", async () => { await Google.kopar(); toast("Bağlantı kaldırıldı"); ciz(); }); });
  },
  driveYedek: () => driveYedekle(false),
  async driveGeri() { try { const m = await Google.yedekOku(); if (!m) return toast("Drive'da yedek yok"); driveGeriYukleSor(m); } catch (e) { toast(e.message); } },
  googleKurulum: () => googleBaglan(true),
  geriyukle() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".kdy,application/octet-stream,application/json";
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; const metin = await f.text();
      perde(`<h3>Yedekten geri yükle</h3><p class="kucuk">${esc(f.name)} · bu telefondaki bütün kayıtların YERİNE geçer.</p><label>Yedeğin şifresi (yedek alındığı zamanki giriş şifresi)<input class="girdi" id="yS" type="tel" inputmode="numeric" maxlength="4" style="-webkit-text-security:disc"></label><p class="hata" id="yH"></p><button class="btn ana" id="yK">Geri yükle</button><button class="btn ince" data-kapat>Vazgeç</button>`, s => {
        s.querySelector("[data-kapat]").onclick = kapat; s.querySelector("#yS").focus();
        s.querySelector("#yK").onclick = async () => { try { const y = await yedekCoz(metin, s.querySelector("#yS").value); await Veri.iceAl(y); OTURUM.pin = s.querySelector("#yS").value; await pinKaydet(OTURUM.pin); await lisansTazele(false); kapat(); toast(`Geri yüklendi · ${A().hasta.length} hasta, ${A().islem.length} işlem`); git("ana"); } catch (e) { s.querySelector("#yH").textContent = e.message; } }; }); };
    inp.click();
  }
};

document.addEventListener("click", e => {
  const t = e.target.closest("[data-git],[data-a],[data-hduz],[data-hyenikart],[data-isl],[data-hf],[data-mg],[data-kd],[data-ha]");
  if (!t || t.closest(".perde") && !t.dataset.a) return;
  if (t.dataset.git !== undefined) {
    if (t.dataset.git.startsWith("yeni")) { if (!izinVar("yeni işlem")) return; yeniSifirla(t.dataset.git.split("/")[1] || ""); }
    if (t.dataset.git === "malzeme/yeni" && !izinVar("yeni malzeme")) return;
    return git(t.dataset.git);
  }
  if (t.dataset.a && EYLEM[t.dataset.a]) { if (t.closest(".perde")) kapat(); return EYLEM[t.dataset.a](); }
  if (t.dataset.hduz) return hastaDuzenle(t.dataset.hduz);
  if (t.hasAttribute("data-hyenikart")) return hastaDuzenle("");
  if (t.dataset.isl) return islemDetay(t.dataset.isl);
  if (t.dataset.hf) { HF.f = t.dataset.hf; return ciz(); }
  if (t.dataset.mg) { MF.g = t.dataset.mg; return ciz(); }
  if (t.dataset.kd) { KF.d = t.dataset.kd; return ciz(); }
  if (t.dataset.ha) { const HA = hastaAyar(); HA[t.dataset.ha] = !HA[t.dataset.ha]; Veri.ayarYaz("hastaAlan", HA).then(ciz); }
});

// ---------------------------------------------------------------- açılış
(async () => {
  try {
    await Veri.yukle(); await Lisans.hazirla(); OTURUM.durum = await Lisans.durum();
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
    ciz();
  } catch (e) { $("#uyg").innerHTML = `<div class="kilit"><div class="logo">!</div><b>Program açılamadı</b><p class="kucuk">${esc(e.message)}. Tarayıcının gizli (özel) penceresinde veri saklanamaz; normal pencerede açın.</p></div>`; }
})();

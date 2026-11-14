"use strict";

const LANGS = {
  es: { name: "Spanish", glyph: "Ñ", speech: "es-ES" },
  zh: { name: "Chinese", glyph: "中", speech: "zh-CN" },
  pl: { name: "Polish", glyph: "Ł", speech: "pl-PL" },
  ru: { name: "Russian", glyph: "Я", speech: "ru-RU" }
};
const WORDS = [
  { pic: "🐱", en: "cat", es: "gato", zh: "猫", py: "māo", pl: "kot", ru: "кошка" },
  { pic: "🐶", en: "dog", es: "perro", zh: "狗", py: "gǒu", pl: "pies", ru: "собака" },
  { pic: "🍎", en: "apple", es: "manzana", zh: "苹果", py: "píngguǒ", pl: "jabłko", ru: "яблоко" },
  { pic: "🍞", en: "bread", es: "pan", zh: "面包", py: "miànbāo", pl: "chleb", ru: "хлеб" },
  { pic: "💧", en: "water", es: "agua", zh: "水", py: "shuǐ", pl: "woda", ru: "вода" },
  { pic: "☀️", en: "sun", es: "sol", zh: "太阳", py: "tàiyáng", pl: "słońce", ru: "солнце" },
  { pic: "🌙", en: "moon", es: "luna", zh: "月亮", py: "yuèliang", pl: "księżyc", ru: "луна" },
  { pic: "🏠", en: "house", es: "casa", zh: "房子", py: "fángzi", pl: "dom", ru: "дом" },
  { pic: "🚗", en: "car", es: "coche", zh: "汽车", py: "qìchē", pl: "samochód", ru: "машина" },
  { pic: "📖", en: "book", es: "libro", zh: "书", py: "shū", pl: "książka", ru: "книга" },
  { pic: "🌳", en: "tree", es: "árbol", zh: "树", py: "shù", pl: "drzewo", ru: "дерево" },
  { pic: "🌸", en: "flower", es: "flor", zh: "花", py: "huā", pl: "kwiat", ru: "цветок" },
  { pic: "🐟", en: "fish", es: "pez", zh: "鱼", py: "yú", pl: "ryba", ru: "рыба" },
  { pic: "🥛", en: "milk", es: "leche", zh: "牛奶", py: "niúnǎi", pl: "mleko", ru: "молоко" },
  { pic: "🍌", en: "banana", es: "plátano", zh: "香蕉", py: "xiāngjiāo", pl: "banan", ru: "банан" },
  { pic: "🥚", en: "egg", es: "huevo", zh: "鸡蛋", py: "jīdàn", pl: "jajko", ru: "яйцо" }
];
const ROUNDS = 3, PER_ROUND = 6;
const $ = (id) => document.getElementById(id);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const show = (id) => { ["screen-start", "screen-play", "screen-end"].forEach((s) => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); };

let to = LANGS[store("bahati-pic-lang")] ? store("bahati-pic-lang") : "es";
let g = null, tick = null;

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speech; u.rate = 0.9;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

// language chips
function paintChips() {
  document.querySelectorAll(".chip").forEach((c) => {
    const on = c.dataset.lang === to;
    c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on));
  });
  store("bahati-pic-lang", to);
}
Object.keys(LANGS).forEach((l) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.lang = l;
  b.innerHTML = `<span class="glyph">${LANGS[l].glyph}</span><b>${LANGS[l].name}</b>`;
  b.addEventListener("click", () => { Sound.unlock(); Sound.sfx("pop"); to = l; paintChips(); });
  $("chips-to").appendChild(b);
});
paintChips();
$("best-stars").textContent = store("bahati-pic-stars") || 0;
$("hint").checked = store("bahati-pic-hint") === "1";
$("hint").addEventListener("change", () => store("bahati-pic-hint", $("hint").checked ? "1" : "0"));

function wordHTML(w) {
  let s = `<span class="w-main" lang="${to}">${w[to]}</span>`;
  if (to === "zh") s += `<small>${w.py}</small>`;
  if ($("hint").checked) s += `<small class="hint">${w.en}</small>`;
  return s;
}

function start() {
  Sound.unlock(); Sound.startMusic();
  const pool = shuffle(WORDS);
  g = { rounds: [], r: 0, matched: 0, miss: 0, xp: 0, combo: 0, t0: Date.now(), sel: null, locked: false };
  for (let r = 0; r < ROUNDS; r++) g.rounds.push(pool.slice(r * PER_ROUND, (r + 1) * PER_ROUND));
  show("screen-play");
  clearInterval(tick);
  tick = setInterval(() => { $("timer").textContent = Math.floor((Date.now() - g.t0) / 1000) + "s"; }, 250);
  renderRound();
}

function setProgress() {
  const pct = Math.round((g.matched / (ROUNDS * PER_ROUND)) * 100);
  $("progress-fill").style.width = pct + "%";
  document.querySelector(".progress").setAttribute("aria-valuenow", pct);
}

function renderRound() {
  const words = g.rounds[g.r];
  g.sel = null; g.left = words.length; g.locked = false;
  $("round").textContent = `Round ${g.r + 1} of ${ROUNDS}`;
  $("msg").textContent = "";
  const pics = $("col-pics"), wds = $("col-words");
  pics.innerHTML = ""; wds.innerHTML = "";
  shuffle(words).forEach((w) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pic-card"; b.textContent = w.pic;
    b.setAttribute("aria-label", "Picture " + w.en);
    b.dataset.id = w.en;
    b.addEventListener("click", () => choose(b, "pic"));
    pics.appendChild(b);
  });
  shuffle(words).forEach((w) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "word-card"; b.innerHTML = wordHTML(w);
    b.dataset.id = w.en;
    b.addEventListener("click", () => { speak(w[to], to); choose(b, "word"); });
    wds.appendChild(b);
  });
  setProgress();
}

function choose(btn, kind) {
  if (g.locked || btn.classList.contains("done")) return;
  const same = document.querySelectorAll(kind === "pic" ? ".pic-card.sel" : ".word-card.sel");
  same.forEach((e) => e.classList.remove("sel"));
  btn.classList.add("sel");
  Sound.sfx("pop");
  if (kind === "pic") g.sel = { ...(g.sel || {}), pic: btn }; else g.sel = { ...(g.sel || {}), word: btn };
  if (!(g.sel.pic && g.sel.word)) return;
  const { pic, word } = g.sel; g.sel = null;
  if (pic.dataset.id === word.dataset.id) {
    [pic, word].forEach((e) => { e.classList.remove("sel"); e.classList.add("done", "ok"); });
    g.combo++; g.matched++; g.left--;
    const gain = 10 + (g.combo >= 3 ? 5 : 0); g.xp += gain;
    Sound.sfx("good");
    const w = WORDS.find((x) => x.en === pic.dataset.id);
    $("msg").textContent = (g.combo >= 3 ? `${g.combo} in a row! 🔥  ` : "Yes! ") + `${w.pic} = ${w[to]}` + (to === "zh" ? ` (${w.py})` : "");
    setProgress();
    if (g.left === 0) { g.locked = true; setTimeout(nextRound, 800); }
  } else {
    g.miss++; g.combo = 0;
    [pic, word].forEach((e) => { e.classList.remove("sel"); e.classList.add("bad"); });
    Sound.sfx("bad");
    $("msg").textContent = "Not quite. Try again!";
    g.locked = true;
    setTimeout(() => { [pic, word].forEach((e) => e.classList.remove("bad")); g.locked = false; }, 500);
  }
}

function nextRound() {
  g.r++;
  if (g.r >= ROUNDS) return finish();
  Sound.sfx("win");
  renderRound();
}

function finish() {
  clearInterval(tick);
  const secs = Math.floor((Date.now() - g.t0) / 1000);
  const stars = g.miss <= 2 && secs <= 75 ? 3 : g.miss <= 6 && secs <= 120 ? 2 : 1;
  if (stars > (parseInt(store("bahati-pic-stars"), 10) || 0)) store("bahati-pic-stars", String(stars));
  $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("end-time").textContent = secs; $("end-miss").textContent = g.miss; $("end-xp").textContent = g.xp;
  $("best-stars").textContent = store("bahati-pic-stars") || 0;
  show("screen-end");
  Sound.sfx("win");
  if (!reduceMotion) confetti();
}

function confetti() {
  const colors = ["#f0629b", "#8e7cd6", "#ffd84d", "#5fc9b4", "#f26a1b"];
  for (let n = 0; n < 70; n++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[n % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    c.style.animationDelay = Math.random() * 0.4 + "s";
    c.style.setProperty("--drift", Math.random() * 160 - 80 + "px");
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

$("play").addEventListener("click", start);
$("again").addEventListener("click", () => show("screen-start"));
$("quit").addEventListener("click", () => { if (confirm("Quit this game?")) { clearInterval(tick); show("screen-start"); } });

// mute button
const muteBtn = $("mute");
function paintMute() { muteBtn.textContent = Sound.muted ? "🔇" : "🎵"; muteBtn.setAttribute("aria-pressed", String(Sound.muted)); muteBtn.classList.toggle("off", Sound.muted); }
muteBtn.addEventListener("click", () => {
  Sound.unlock(); Sound.setMuted(!Sound.muted); paintMute();
  if (!Sound.muted) { Sound.startMusic(); Sound.sfx("boing"); }
});
paintMute();
document.querySelector("#screen-start .mascot-big").addEventListener("click", () => Sound.sfx("boing"));
document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.stopMusic(); else if (!$("screen-play").hidden) Sound.startMusic(); });

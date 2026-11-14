"use strict";

const LANGS = {
  en: { name: "English", glyph: "A", speech: "en-US" },
  es: { name: "Spanish", glyph: "Ñ", speech: "es-ES" },
  zh: { name: "Chinese", glyph: "中", speech: "zh-CN" },
  pl: { name: "Polish", glyph: "Ł", speech: "pl-PL" },
  ru: { name: "Russian", glyph: "Я", speech: "ru-RU" }
};
const TARGETS = ["es", "zh", "pl", "ru"];
const SOURCES = ["en", "es", "zh", "pl", "ru"];
const WORDS = [
  { en: "hello", es: "hola", zh: "你好", pl: "cześć", ru: "привет", py: "nǐ hǎo" },
  { en: "thank you", es: "gracias", zh: "谢谢", pl: "dziękuję", ru: "спасибо", py: "xièxie" },
  { en: "water", es: "agua", zh: "水", pl: "woda", ru: "вода", py: "shuǐ" },
  { en: "cat", es: "gato", zh: "猫", pl: "kot", ru: "кошка", py: "māo" },
  { en: "house", es: "casa", zh: "家", pl: "dom", ru: "дом", py: "jiā" },
  { en: "bread", es: "pan", zh: "面包", pl: "chleb", ru: "хлеб", py: "miànbāo" },
  { en: "please", es: "por favor", zh: "请", pl: "proszę", ru: "пожалуйста", py: "qǐng" },
  { en: "friend", es: "amigo", zh: "朋友", pl: "przyjaciel", ru: "друг", py: "péngyou" },
  { en: "apple", es: "manzana", zh: "苹果", pl: "jabłko", ru: "яблоко", py: "píngguǒ" },
  { en: "goodbye", es: "adiós", zh: "再见", pl: "do widzenia", ru: "до свидания", py: "zàijiàn" },
  // level 2: everyday phrases
  { lvl: 2, en: "good morning", es: "buenos días", zh: "早上好", pl: "dzień dobry", ru: "доброе утро", py: "zǎoshang hǎo" },
  { lvl: 2, en: "good night", es: "buenas noches", zh: "晚安", pl: "dobranoc", ru: "спокойной ночи", py: "wǎn'ān" },
  { lvl: 2, en: "how are you?", es: "¿cómo estás?", zh: "你好吗", pl: "jak się masz?", ru: "как дела?", py: "nǐ hǎo ma" },
  { lvl: 2, en: "I love you", es: "te quiero", zh: "我爱你", pl: "kocham cię", ru: "я тебя люблю", py: "wǒ ài nǐ" },
  { lvl: 2, en: "sorry", es: "lo siento", zh: "对不起", pl: "przepraszam", ru: "извините", py: "duìbuqǐ" },
  { lvl: 2, en: "I don't understand", es: "no entiendo", zh: "我不明白", pl: "nie rozumiem", ru: "я не понимаю", py: "wǒ bù míngbai" },
  { lvl: 2, en: "how much is it?", es: "¿cuánto cuesta?", zh: "多少钱", pl: "ile to kosztuje?", ru: "сколько стоит?", py: "duōshao qián" },
  { lvl: 2, en: "welcome", es: "bienvenido", zh: "欢迎", pl: "witaj", ru: "добро пожаловать", py: "huānyíng" },
  { lvl: 2, en: "delicious", es: "delicioso", zh: "好吃", pl: "pyszne", ru: "вкусно", py: "hǎochī" },
  { lvl: 2, en: "where?", es: "¿dónde?", zh: "在哪里", pl: "gdzie?", ru: "где?", py: "zài nǎlǐ" },
  // level 3: longer sentences
  { lvl: 3, en: "nice to meet you", es: "mucho gusto", zh: "很高兴认识你", pl: "miło mi cię poznać", ru: "приятно познакомиться", py: "hěn gāoxìng rènshi nǐ" },
  { lvl: 3, en: "I want water", es: "quiero agua", zh: "我要水", pl: "chcę wody", ru: "я хочу воды", py: "wǒ yào shuǐ" },
  { lvl: 3, en: "do you speak English?", es: "¿hablas inglés?", zh: "你会说英语吗", pl: "czy mówisz po angielsku?", ru: "ты говоришь по-английски?", py: "nǐ huì shuō yīngyǔ ma" },
  { lvl: 3, en: "where is the toilet?", es: "¿dónde está el baño?", zh: "洗手间在哪里", pl: "gdzie jest toaleta?", ru: "где туалет?", py: "xǐshǒujiān zài nǎlǐ" },
  { lvl: 3, en: "see you tomorrow", es: "hasta mañana", zh: "明天见", pl: "do jutra", ru: "до завтра", py: "míngtiān jiàn" },
  { lvl: 3, en: "I like coffee", es: "me gusta el café", zh: "我喜欢咖啡", pl: "lubię kawę", ru: "я люблю кофе", py: "wǒ xǐhuan kāfēi" },
  { lvl: 3, en: "I am learning", es: "estoy aprendiendo", zh: "我在学习", pl: "uczę się", ru: "я учусь", py: "wǒ zài xuéxí" },
  { lvl: 3, en: "help!", es: "¡ayuda!", zh: "救命", pl: "pomocy!", ru: "помогите!", py: "jiùmìng" },
  { lvl: 3, en: "cheers!", es: "¡salud!", zh: "干杯", pl: "na zdrowie!", ru: "за здоровье!", py: "gānbēi" },
  { lvl: 3, en: "good luck", es: "buena suerte", zh: "祝你好运", pl: "powodzenia", ru: "удачи", py: "zhù nǐ hǎoyùn" }
];
WORDS.forEach((w) => { if (!w.lvl) w.lvl = 1; });
const LEVELS = [
  { id: 1, emoji: "🌱", name: "Easy", pool: [1], single: 6, match: 1, opts: 3, hearts: 5, time: 0, desc: "Basic words · 3 choices · 5 hearts" },
  { id: 2, emoji: "🌿", name: "Medium", pool: [1, 2], single: 8, match: 2, opts: 4, hearts: 5, time: 0, desc: "Words and phrases · 4 choices · 5 hearts" },
  { id: 3, emoji: "🔥", name: "Hard", pool: [2, 3], single: 10, match: 2, opts: 4, hearts: 4, time: 15, desc: "Phrases and sentences · 15 s per question · 4 hearts" },
  { id: 4, emoji: "💀", name: "Expert", pool: [1, 2, 3], single: 12, match: 3, opts: 4, hearts: 3, time: 10, noPinyin: true, desc: "Everything · 10 s per question · no pinyin · 3 hearts" }
];
const MAX_HEARTS = 5;
const $ = (id) => document.getElementById(id);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const word = (w, lang) => w[lang];
const label = (w, lang, full) => (lang === "zh" && (full || !(st && st.lvl.noPinyin)) ? `${w.zh} (${w.py})` : w[lang]);

let st = null;
const lvlOf = (n) => LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
let unlocked = Math.max(1, Math.min(LEVELS.length, parseInt(store("bahati-unlocked"), 10) || 1));
let level = Math.min(unlocked, parseInt(store("bahati-level"), 10) || 1);
let pick = { from: SOURCES.includes(store("bahati-from")) ? store("bahati-from") : "en", to: TARGETS.includes(store("bahati-to")) ? store("bahati-to") : "es" };
if (pick.from === pick.to) pick.to = TARGETS.find((l) => l !== pick.from);

function show(id) {
  ["screen-start", "screen-lesson", "screen-end"].forEach((s) => { $(s).hidden = s !== id; });
  window.scrollTo(0, 0);
}

function refreshStart() {
  $("best-xp").textContent = store("bahati-best-xp") || 0;
  $("day-streak").textContent = store("bahati-day-streak") || 0;
}

function updateStreak() {
  const today = new Date().toDateString();
  const last = store("bahati-last-day");
  if (last === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = last === y.toDateString() ? (parseInt(store("bahati-day-streak"), 10) || 0) + 1 : 1;
  store("bahati-day-streak", String(streak));
  store("bahati-last-day", today);
}

// ----- language pair picker -----
function chip(lang, group) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.lang = lang; b.dataset.group = group;
  b.innerHTML = `<span class="glyph">${LANGS[lang].glyph}</span><b>${LANGS[lang].name}</b>`;
  b.addEventListener("click", () => {
    Sound.unlock(); Sound.sfx("pop");
    pick[group] = lang;
    if (pick.from === pick.to) { // keep the pair valid
      if (group === "from") pick.to = TARGETS.find((l) => l !== lang);
      else pick.from = SOURCES.find((l) => l !== lang);
    }
    paintPicker();
  });
  return b;
}
function paintPicker() {
  document.querySelectorAll(".chip").forEach((c) => {
    const on = pick[c.dataset.group] === c.dataset.lang;
    c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on));
    c.disabled = c.dataset.group === "to" ? c.dataset.lang === pick.from : c.dataset.lang === pick.to;
  });
  $("pair-label").textContent = `${LANGS[pick.from].name} → ${LANGS[pick.to].name}`;
  paintLevels();
  store("bahati-from", pick.from); store("bahati-to", pick.to);
}
function paintLevels() {
  const box = $("chips-lvl");
  box.innerHTML = "";
  LEVELS.forEach((L) => {
    const b = document.createElement("button");
    const locked = L.id > unlocked;
    const stars = parseInt(store("bahati-lvl-stars-" + L.id), 10) || 0;
    b.type = "button"; b.className = "chip lvl-chip" + (L.id === level ? " on" : "");
    b.disabled = locked; b.dataset.level = L.id; b.setAttribute("aria-pressed", String(L.id === level));
    b.innerHTML = `<span class="glyph">${locked ? "🔒" : L.emoji}</span><b>${L.name}</b>` + (stars ? `<span class="mini-stars">${"★".repeat(stars)}</span>` : "");
    b.addEventListener("click", () => { Sound.unlock(); Sound.sfx("pop"); level = L.id; store("bahati-level", String(level)); paintLevels(); });
    box.appendChild(b);
  });
  $("lvl-desc").textContent = lvlOf(level).desc;
  $("pair-label").textContent = `${LANGS[pick.from].name} → ${LANGS[pick.to].name} · ${lvlOf(level).name}`;
}
SOURCES.forEach((l) => $("chips-from").appendChild(chip(l, "from")));
TARGETS.forEach((l) => $("chips-to").appendChild(chip(l, "to")));

function randomPair() {
  const pairs = [];
  SOURCES.forEach((f) => TARGETS.forEach((t) => { if (f !== t) pairs.push([f, t]); }));
  const [f, t] = pairs[Math.floor(Math.random() * pairs.length)];
  pick.from = f; pick.to = t; paintPicker();
}

function buildQueue(L) {
  const pool = shuffle(WORDS.filter((w) => L.pool.includes(w.lvl)));
  const half = Math.ceil(L.single / 2);
  const queue = [];
  pool.slice(0, half).forEach((w) => queue.push({ type: "toFrom", w }));
  pool.slice(half, L.single).forEach((w) => queue.push({ type: "fromTo", w }));
  const out = shuffle(queue);
  for (let n = 0; n < L.match; n++) out.push({ type: "match", words: shuffle(pool).slice(0, 4) });
  return out;
}

function start() {
  Sound.unlock(); Sound.startMusic();
  const L = lvlOf(level);
  st = { lvl: L, from: pick.from, to: pick.to, queue: buildQueue(L), i: 0, hearts: L.hearts, xp: 0, correct: 0, tried: 0, combo: 0, selected: null, answered: false, pairs: null };
  updateStreak();
  show("screen-lesson");
  render();
}

function renderHearts() {
  $("hearts").textContent = "❤".repeat(st.hearts) + "♡".repeat(st.lvl.hearts - st.hearts);
  $("hearts").setAttribute("aria-label", st.hearts + " hearts left");
}
function setProgress() {
  const pct = Math.round((st.i / st.queue.length) * 100);
  $("progress-fill").style.width = pct + "%";
  document.querySelector(".progress").setAttribute("aria-valuenow", pct);
}

function speak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speech;
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function setFeedback(kind, title, detail) {
  const fb = $("feedback");
  fb.className = "feedback" + (kind ? " " + kind : "");
  $("fb-title").textContent = title || "";
  $("fb-detail").textContent = detail || "";
  $("fb-mascot").src = kind === "bad" ? "images/panda.svg" : "images/bunny.svg";
}

function optionButton(text, lang, onClick) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "option"; b.textContent = text; b.lang = lang;
  b.addEventListener("click", () => onClick(b));
  return b;
}

function render() {
  const q = st.queue[st.i];
  st.selected = null; st.answered = false; st.pairs = null;
  renderHearts(); setProgress();
  setFeedback("", "", "");
  const check = $("check");
  check.textContent = "Check"; check.disabled = true; check.style.visibility = "";
  const question = $("question"), options = $("options");
  question.innerHTML = ""; options.innerHTML = ""; options.className = "options";
  stopTimer();
  const { from, to } = st;

  if (q.type === "toFrom" || q.type === "fromTo") {
    const shownLang = q.type === "toFrom" ? to : from;
    const answerLang = q.type === "toFrom" ? from : to;
    $("prompt").textContent = q.type === "toFrom"
      ? `What does this mean in ${LANGS[from].name}?`
      : `How do you say this in ${LANGS[to].name}?`;
    const t = document.createElement("div");
    const main = document.createElement("span"); main.textContent = q.w[shownLang]; main.lang = shownLang;
    t.appendChild(main);
    if (shownLang === "zh" && !st.lvl.noPinyin) { const s = document.createElement("small"); s.textContent = q.w.py; t.appendChild(s); }
    question.appendChild(t);
    if ("speechSynthesis" in window) {
      const sp = document.createElement("button");
      sp.type = "button"; sp.className = "speak"; sp.textContent = "🔊"; sp.setAttribute("aria-label", "Listen");
      sp.addEventListener("click", () => speak(q.w[shownLang], shownLang));
      question.appendChild(sp);
    }
    const others = shuffle(WORDS.filter((w) => w !== q.w && st.lvl.pool.includes(w.lvl))).slice(0, st.lvl.opts - 1);
    shuffle([q.w, ...others]).forEach((w) => {
      const correct = w === q.w;
      const b = optionButton(label(w, answerLang), answerLang, (btn) => {
        if (st.answered) return;
        options.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        btn.classList.add("selected");
        st.selected = { btn, correct };
        check.disabled = false;
        if (answerLang !== "en") speak(w[answerLang], answerLang);
      });
      b.dataset.correct = String(correct);
      options.appendChild(b);
    });
    startTimer();
  } else {
    $("prompt").textContent = `Match ${LANGS[from].name} with ${LANGS[to].name}`;
    options.className = "options match";
    check.disabled = true; check.style.visibility = "hidden";
    st.pairs = { left: null, right: null, matched: 0, total: q.words.length };
    const lefts = shuffle(q.words).map((w) => ({ side: "l", w }));
    const rights = shuffle(q.words).map((w) => ({ side: "r", w }));
    for (let n = 0; n < q.words.length; n++) {
      [lefts[n], rights[n]].forEach((c) => {
        const lang = c.side === "l" ? from : to;
        options.appendChild(optionButton(label(c.w, lang), lang, (btn) => pickPair(btn, c)));
      });
    }
  }
}

let qTimer = null;
function stopTimer() { clearInterval(qTimer); qTimer = null; $("qtimer").hidden = true; }
function startTimer() {
  const secs = st.lvl.time;
  if (!secs) return;
  const box = $("qtimer"), fill = $("qtimer-fill");
  box.hidden = false; fill.style.width = "100%"; fill.classList.remove("low");
  const t0 = Date.now();
  qTimer = setInterval(() => {
    const left = Math.max(0, 1 - (Date.now() - t0) / (secs * 1000));
    fill.style.width = left * 100 + "%";
    fill.classList.toggle("low", left < 0.3);
    if (left <= 0) timeUp();
  }, 100);
}
function timeUp() {
  stopTimer();
  if (st.answered) return;
  st.answered = true; st.tried++;
  $("options").querySelectorAll(".option").forEach((o) => { o.style.pointerEvents = "none"; if (o.dataset.correct === "true") o.classList.add("right"); });
  const w = st.queue[st.i].w;
  setFeedback("bad", "Time's up! ⏰", `Correct answer: ${label(w, st.from, true)} = ${label(w, st.to, true)}`);
  Sound.sfx("bad"); oops();
  loseHeart();
  if (st.hearts <= 0) return;
  $("check").disabled = false; $("check").textContent = "Continue";
}

function pickPair(btn, c) {
  if (st.answered) return;
  const p = st.pairs;
  const key = c.side === "l" ? "left" : "right";
  if (p[key]) p[key].btn.classList.remove("selected");
  p[key] = { btn, c };
  btn.classList.add("selected");
  const lang = c.side === "l" ? st.from : st.to;
  if (lang !== "en") speak(c.w[lang], lang);
  if (!p.left || !p.right) return;
  const { left, right } = p;
  p.left = p.right = null;
  st.tried++;
  if (left.c.w === right.c.w) {
    st.correct++; st.xp += 5;
    [left.btn, right.btn].forEach((b) => { b.classList.remove("selected"); b.classList.add("right", "done"); });
    popXp(right.btn, 5);
    Sound.sfx("pop");
    p.matched++;
    if (p.matched === p.total) {
      st.answered = true;
      setFeedback("good", "Perfect match!", "Nice pairing, you are on fire 🔥");
      Sound.sfx("good"); cheer();
      const check = $("check");
      check.style.visibility = ""; check.disabled = false; check.textContent = "Continue";
    }
  } else {
    [left.btn, right.btn].forEach((b) => { b.classList.remove("selected"); b.classList.add("wrong"); });
    setTimeout(() => [left.btn, right.btn].forEach((b) => b.classList.remove("wrong")), 450);
    Sound.sfx("bad"); oops();
    loseHeart();
  }
}

function loseHeart() {
  st.hearts--; st.combo = 0;
  renderHearts();
  const h = $("hearts"); h.classList.remove("hit"); void h.offsetWidth; h.classList.add("hit");
  if (st.hearts <= 0) setTimeout(() => finish(false), 500);
}

function popXp(el, n) {
  if (reduceMotion) return;
  const r = el.getBoundingClientRect();
  const s = document.createElement("span");
  s.className = "xp-float"; s.textContent = "+" + n + " XP";
  s.style.left = r.left + r.width / 2 - 24 + "px"; s.style.top = r.top + "px";
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1300);
}

function onCheck() {
  const q = st.queue[st.i];
  const check = $("check");
  if (st.answered) { // Continue
    st.i++;
    if (st.i >= st.queue.length) return finish(true);
    return render();
  }
  if (!st.selected) return;
  stopTimer();
  st.answered = true; st.tried++;
  const opts = $("options").querySelectorAll(".option");
  opts.forEach((o) => { o.style.pointerEvents = "none"; });
  const w = q.w;
  const summary = `${label(w, st.from, true)} = ${label(w, st.to, true)}`;
  if (st.selected.correct) {
    st.correct++; st.combo++;
    const gain = 10 + (st.combo >= 3 ? 5 : 0);
    st.xp += gain;
    st.selected.btn.classList.remove("selected"); st.selected.btn.classList.add("right");
    const praise = ["Awesome!", "Great job!", "Nailed it!", "Super!"][Math.floor(Math.random() * 4)];
    setFeedback("good", praise, st.combo >= 3 ? `${st.combo} in a row! Bonus XP 🔥` : summary);
    popXp(st.selected.btn, gain);
    Sound.sfx("good"); cheer();
  } else {
    st.selected.btn.classList.remove("selected"); st.selected.btn.classList.add("wrong");
    setFeedback("bad", "Oops!", `Correct answer: ${summary}`);
    opts.forEach((o) => { if (o.dataset.correct === "true") o.classList.add("right"); });
    Sound.sfx("bad"); oops();
    loseHeart();
    if (st.hearts <= 0) return;
  }
  check.disabled = false;
  check.textContent = "Continue";
}

function finish(won) {
  const acc = st.tried ? Math.round((st.correct / st.tried) * 100) : 0;
  stopTimer();
  const best = parseInt(store("bahati-best-xp"), 10) || 0;
  if (st.xp > best) store("bahati-best-xp", String(st.xp));
  $("end-title").textContent = won ? "Lesson complete! 🎉" : "Out of hearts 💔";
  $("end-sub").textContent = won
    ? `${LANGS[st.from].name} → ${LANGS[st.to].name} done! Want to learn ${LANGS[st.to].name} for real with a teacher?`
    : "Even bunnies need a nap. Try again, you will do better!";
  $("end-mascot").src = won ? "images/bunny.svg" : "images/panda.svg";
  $("end-xp").textContent = st.xp; $("end-acc").textContent = acc; $("end-hearts").textContent = st.hearts;
  const stars = won ? (acc >= 90 ? 3 : acc >= 70 ? 2 : 1) : 0;
  $("end-stars").textContent = won ? "★".repeat(stars) + "☆".repeat(3 - stars) : "";
  const prev = parseInt(store("bahati-lvl-stars-" + st.lvl.id), 10) || 0;
  if (stars > prev) store("bahati-lvl-stars-" + st.lvl.id, String(stars));
  const next = $("next-level"); next.hidden = true;
  if (won && st.lvl.id < LEVELS.length) {
    if (st.lvl.id + 1 > unlocked) { unlocked = st.lvl.id + 1; store("bahati-unlocked", String(unlocked)); $("end-sub").textContent += ` New level unlocked: ${lvlOf(unlocked).name} ${lvlOf(unlocked).emoji}`; }
    next.hidden = false;
  }
  show("screen-end");
  Sound.sfx(won ? "win" : "lose");
  $("end-mascot").className = "mascot-big " + (won ? "dance" : "sad");
  if (won) confetti();
}

function confetti() {
  if (reduceMotion) return;
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
$("random-pair").addEventListener("click", () => { Sound.unlock(); Sound.sfx("boing"); randomPair(); });
$("check").addEventListener("click", onCheck);
$("quit").addEventListener("click", () => { if (confirm("Quit this lesson? Your progress will be lost.")) { stopTimer(); refreshStart(); show("screen-start"); } });
$("next-level").addEventListener("click", () => { level = Math.min(unlocked, st.lvl.id + 1); store("bahati-level", String(level)); start(); });
$("again").addEventListener("click", () => { refreshStart(); show("screen-start"); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !$("screen-lesson").hidden && !$("check").disabled && document.activeElement.tagName !== "BUTTON") onCheck();
});
paintPicker();
refreshStart();

// ---------- Animations ----------
function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function cheer() {
  replay($("fb-mascot"), "jump");
  if (st && st.combo >= 3) { const c = document.createElement("div"); c.className = "combo"; c.textContent = st.combo + "x COMBO!"; document.body.appendChild(c); setTimeout(() => c.remove(), 1000); }
}
function oops() { replay($("screen-lesson"), "screen-shake"); replay($("fb-mascot"), "wobble-sad"); }

// Mute button
const muteBtn = $("mute");
function paintMute() { muteBtn.textContent = Sound.muted ? "🔇" : "🎵"; muteBtn.setAttribute("aria-pressed", String(Sound.muted)); muteBtn.classList.toggle("off", Sound.muted); }
muteBtn.addEventListener("click", () => {
  Sound.unlock(); Sound.setMuted(!Sound.muted); paintMute();
  if (!Sound.muted) { Sound.startMusic(); Sound.sfx("boing"); }
});
paintMute();

// Start-screen mascot goes "boing" when clicked
document.querySelector("#screen-start .mascot-big").addEventListener("click", (e) => {
  Sound.unlock(); Sound.sfx("boing"); replay(e.currentTarget, "jump");
});
// Pause music when tab hidden
document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.stopMusic(); else if (st && !$("screen-lesson").hidden) Sound.startMusic(); });

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
  { en: "goodbye", es: "adiós", zh: "再见", pl: "do widzenia", ru: "до свидания", py: "zàijiàn" }
];
const MAX_HEARTS = 5;
const $ = (id) => document.getElementById(id);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const word = (w, lang) => w[lang];
const label = (w, lang) => (lang === "zh" ? `${w.zh} (${w.py})` : w[lang]);

let st = null;
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
  store("bahati-from", pick.from); store("bahati-to", pick.to);
}
SOURCES.forEach((l) => $("chips-from").appendChild(chip(l, "from")));
TARGETS.forEach((l) => $("chips-to").appendChild(chip(l, "to")));

function randomPair() {
  const pairs = [];
  SOURCES.forEach((f) => TARGETS.forEach((t) => { if (f !== t) pairs.push([f, t]); }));
  const [f, t] = pairs[Math.floor(Math.random() * pairs.length)];
  pick.from = f; pick.to = t; paintPicker();
}

function buildQueue() {
  const pool = shuffle(WORDS);
  const queue = [];
  pool.slice(0, 4).forEach((w) => queue.push({ type: "toFrom", w }));   // show target word, answer in source language
  pool.slice(4, 8).forEach((w) => queue.push({ type: "fromTo", w }));   // show source word, answer in target language
  const singles = shuffle(queue);
  return singles.concat([{ type: "match", words: shuffle(WORDS).slice(0, 4) }, { type: "match", words: shuffle(WORDS).slice(0, 4) }]);
}

function start() {
  Sound.unlock(); Sound.startMusic();
  st = { from: pick.from, to: pick.to, queue: buildQueue(), i: 0, hearts: MAX_HEARTS, xp: 0, correct: 0, tried: 0, combo: 0, selected: null, answered: false, pairs: null };
  updateStreak();
  show("screen-lesson");
  render();
}

function renderHearts() {
  $("hearts").textContent = "❤".repeat(st.hearts) + "♡".repeat(MAX_HEARTS - st.hearts);
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
    if (shownLang === "zh") { const s = document.createElement("small"); s.textContent = q.w.py; t.appendChild(s); }
    question.appendChild(t);
    if ("speechSynthesis" in window) {
      const sp = document.createElement("button");
      sp.type = "button"; sp.className = "speak"; sp.textContent = "🔊"; sp.setAttribute("aria-label", "Listen");
      sp.addEventListener("click", () => speak(q.w[shownLang], shownLang));
      question.appendChild(sp);
    }
    const others = shuffle(WORDS.filter((w) => w !== q.w)).slice(0, 3);
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
  st.answered = true; st.tried++;
  const opts = $("options").querySelectorAll(".option");
  opts.forEach((o) => { o.style.pointerEvents = "none"; });
  const w = q.w;
  const summary = `${label(w, st.from)} = ${label(w, st.to)}`;
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
  const best = parseInt(store("bahati-best-xp"), 10) || 0;
  if (st.xp > best) store("bahati-best-xp", String(st.xp));
  $("end-title").textContent = won ? "Lesson complete! 🎉" : "Out of hearts 💔";
  $("end-sub").textContent = won
    ? `${LANGS[st.from].name} → ${LANGS[st.to].name} done! Want to learn ${LANGS[st.to].name} for real with a teacher?`
    : "Even bunnies need a nap. Try again, you will do better!";
  $("end-mascot").src = won ? "images/bunny.svg" : "images/panda.svg";
  $("end-xp").textContent = st.xp; $("end-acc").textContent = acc; $("end-hearts").textContent = st.hearts;
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
$("quit").addEventListener("click", () => { if (confirm("Quit this lesson? Your progress will be lost.")) { refreshStart(); show("screen-start"); } });
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

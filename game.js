"use strict";

const LANGS = {
  es: { name: "Spanish", speech: "es-ES", words: [
    ["hello", "hola"], ["thank you", "gracias"], ["water", "agua"], ["cat", "gato"], ["house", "casa"],
    ["bread", "pan"], ["please", "por favor"], ["friend", "amigo"], ["apple", "manzana"], ["goodbye", "adiós"]] },
  zh: { name: "Chinese", speech: "zh-CN", words: [
    ["hello", "你好", "nǐ hǎo"], ["thank you", "谢谢", "xièxie"], ["water", "水", "shuǐ"], ["cat", "猫", "māo"], ["house", "家", "jiā"],
    ["bread", "面包", "miànbāo"], ["please", "请", "qǐng"], ["friend", "朋友", "péngyou"], ["apple", "苹果", "píngguǒ"], ["goodbye", "再见", "zàijiàn"]] },
  pl: { name: "Polish", speech: "pl-PL", words: [
    ["hello", "cześć"], ["thank you", "dziękuję"], ["water", "woda"], ["cat", "kot"], ["house", "dom"],
    ["bread", "chleb"], ["please", "proszę"], ["friend", "przyjaciel"], ["apple", "jabłko"], ["goodbye", "do widzenia"]] },
  ru: { name: "Russian", speech: "ru-RU", words: [
    ["hello", "привет"], ["thank you", "спасибо"], ["water", "вода"], ["cat", "кошка"], ["house", "дом"],
    ["bread", "хлеб"], ["please", "пожалуйста"], ["friend", "друг"], ["apple", "яблоко"], ["goodbye", "до свидания"]] }
};
const MAX_HEARTS = 5;
const STEPS = 10;
const $ = (id) => document.getElementById(id);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
}

let st = null;

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

function buildQueue(lang) {
  const words = LANGS[lang].words;
  const pick = shuffle(words);
  const queue = [];
  // 4 "what does it mean", 4 "how do you say", 2 match rounds
  pick.slice(0, 4).forEach((w) => queue.push({ type: "toEn", w }));
  pick.slice(4, 8).forEach((w) => queue.push({ type: "toTarget", w }));
  queue.push({ type: "match", words: shuffle(words).slice(0, 4) });
  queue.push({ type: "match", words: shuffle(words).slice(0, 4) });
  return shuffle(queue.slice(0, 8)).concat(queue.slice(8)); // match rounds toward the end
}

function start(lang) {
  st = { lang, queue: buildQueue(lang), i: 0, hearts: MAX_HEARTS, xp: 0, correct: 0, tried: 0, combo: 0, selected: null, answered: false, pairs: null };
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

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[st.lang].speech;
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

function optionButton(label, onClick) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "option"; b.textContent = label;
  b.addEventListener("click", () => onClick(b));
  return b;
}

function render() {
  const q = st.queue[st.i];
  st.selected = null; st.answered = false; st.pairs = null;
  renderHearts(); setProgress();
  setFeedback("", "", "");
  const check = $("check");
  check.textContent = "Check"; check.disabled = true;
  const question = $("question"), options = $("options");
  question.innerHTML = ""; options.innerHTML = ""; options.className = "options";
  const words = LANGS[st.lang].words;

  if (q.type === "toEn" || q.type === "toTarget") {
    const toEn = q.type === "toEn";
    $("prompt").textContent = toEn ? "What does this mean?" : "How do you say this?";
    const shown = toEn ? q.w[1] : q.w[0];
    const t = document.createElement("div");
    t.innerHTML = "";
    const main = document.createElement("span"); main.textContent = shown;
    if (toEn) main.lang = LANGS[st.lang].speech.slice(0, 2);
    t.appendChild(main);
    if (toEn && q.w[2]) { const s = document.createElement("small"); s.textContent = q.w[2]; t.appendChild(s); }
    question.appendChild(t);
    if (toEn && "speechSynthesis" in window) {
      const sp = document.createElement("button");
      sp.type = "button"; sp.className = "speak"; sp.textContent = "🔊"; sp.setAttribute("aria-label", "Listen");
      sp.addEventListener("click", () => speak(q.w[1]));
      question.appendChild(sp);
    }
    const others = shuffle(words.filter((w) => w[0] !== q.w[0])).slice(0, 3);
    shuffle([q.w, ...others]).forEach((w) => {
      const label = toEn ? w[0] : w[1] + (w[2] ? " (" + w[2] + ")" : "");
      const correct = w[0] === q.w[0];
      const b = optionButton(label, (btn) => {
        if (st.answered) return;
        options.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        btn.classList.add("selected");
        st.selected = { btn, correct };
        check.disabled = false;
        if (!toEn) speak(w[1]);
      });
      if (!toEn) b.lang = LANGS[st.lang].speech.slice(0, 2);
      b.dataset.correct = String(correct);
      options.appendChild(b);
    });
  } else {
    $("prompt").textContent = "Tap the matching pairs";
    options.className = "options match";
    check.textContent = "Check"; check.disabled = true; check.style.visibility = "hidden";
    st.pairs = { left: null, right: null, matched: 0, total: q.words.length };
    const lefts = shuffle(q.words).map((w) => ({ side: "l", w }));
    const rights = shuffle(q.words).map((w) => ({ side: "r", w }));
    const col = [];
    for (let n = 0; n < q.words.length; n++) { col.push(lefts[n]); col.push(rights[n]); }
    col.forEach((c) => {
      const label = c.side === "l" ? c.w[0] : c.w[1];
      const b = optionButton(label, (btn) => pickPair(btn, c));
      if (c.side === "r") b.lang = LANGS[st.lang].speech.slice(0, 2);
      options.appendChild(b);
    });
  }
}

function pickPair(btn, c) {
  if (st.answered) return;
  const p = st.pairs;
  const key = c.side === "l" ? "left" : "right";
  if (p[key]) p[key].btn.classList.remove("selected");
  p[key] = { btn, c };
  btn.classList.add("selected");
  if (c.side === "r") speak(c.w[1]);
  if (!p.left || !p.right) return;
  const { left, right } = p;
  p.left = p.right = null;
  st.tried++;
  if (left.c.w[0] === right.c.w[0]) {
    st.correct++; st.xp += 5;
    [left.btn, right.btn].forEach((b) => { b.classList.remove("selected"); b.classList.add("right", "done"); });
    popXp(right.btn, 5);
    p.matched++;
    if (p.matched === p.total) {
      st.answered = true;
      setFeedback("good", "Perfect match!", "Nice pairing, you are on fire 🔥");
      const check = $("check");
      check.style.visibility = ""; check.disabled = false; check.textContent = "Continue";
    }
  } else {
    [left.btn, right.btn].forEach((b) => { b.classList.remove("selected"); b.classList.add("wrong"); });
    setTimeout(() => [left.btn, right.btn].forEach((b) => b.classList.remove("wrong")), 450);
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
    check.style.visibility = "";
    return render();
  }
  if (!st.selected) return;
  st.answered = true; st.tried++;
  const opts = $("options").querySelectorAll(".option");
  opts.forEach((o) => { o.style.pointerEvents = "none"; });
  const word = q.w;
  if (st.selected.correct) {
    st.correct++; st.combo++;
    const gain = 10 + (st.combo >= 3 ? 5 : 0);
    st.xp += gain;
    st.selected.btn.classList.remove("selected"); st.selected.btn.classList.add("right");
    const praise = ["Awesome!", "Great job!", "Nailed it!", "Super!"][Math.floor(Math.random() * 4)];
    setFeedback("good", praise, st.combo >= 3 ? `${st.combo} in a row! Bonus XP 🔥` : `${word[0]} = ${word[1]}`);
    popXp(st.selected.btn, gain);
  } else {
    st.selected.btn.classList.remove("selected"); st.selected.btn.classList.add("wrong");
    setFeedback("bad", "Oops!", `Correct answer: ${word[0]} = ${word[1]}${word[2] ? " (" + word[2] + ")" : ""}`);
    opts.forEach((o) => { if (o.dataset.correct === "true") o.classList.add("right"); });
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
    ? `You just practiced ${LANGS[st.lang].name}. Want to learn it for real with a teacher?`
    : "Even bunnies need a nap. Try again, you will do better!";
  $("end-mascot").src = won ? "images/bunny.svg" : "images/panda.svg";
  $("end-xp").textContent = st.xp; $("end-acc").textContent = acc; $("end-hearts").textContent = st.hearts;
  show("screen-end");
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

document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => start(b.dataset.lang)));
$("check").addEventListener("click", onCheck);
$("quit").addEventListener("click", () => { if (confirm("Quit this lesson? Your progress will be lost.")) { refreshStart(); show("screen-start"); } });
$("again").addEventListener("click", () => { refreshStart(); show("screen-start"); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !$("screen-lesson").hidden && !$("check").disabled && document.activeElement.tagName !== "BUTTON") onCheck();
});
refreshStart();

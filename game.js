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


// ---------- Audio: tiny chiptune engine (no files needed) ----------
const Sound = (() => {
  let ctx = null, master = null, timer = null, step = 0, nextT = 0, playing = false;
  let muted = store("bahati-muted") === "1";
  const BPM = 150, STEP = 60 / BPM / 2; // eighth notes
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz
  // playful C-major tune (MIDI notes, 0 = rest), 32 eighth-notes, bass every 4
  const lead = [72,0,76,79, 77,0,76,72, 74,0,77,81, 79,0,77,74,
                72,76,79,84, 83,0,79,76, 77,76,74,77, 72,0,0,0];
  const bass = [48,0,55,0, 53,0,55,0, 50,0,57,0, 55,0,57,0,
                48,0,55,0, 55,0,52,0, 53,0,50,0, 48,0,0,0];
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }
  function tone(freq, t, dur, type, vol, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function scheduler() {
    while (nextT < ctx.currentTime + 0.25) {
      const i = step % lead.length;
      if (lead[i]) tone(N(lead[i]), nextT, STEP * 0.9, "square", 0.05);
      if (bass[i]) tone(N(bass[i]), nextT, STEP * 1.8, "triangle", 0.11);
      if (i % 2 === 0) tone(i % 4 === 0 ? 120 : 800, nextT, 0.04, "square", i % 4 === 0 ? 0.0 + 0.06 : 0.015, i % 4 === 0 ? 50 : null);
      step++; nextT += STEP;
    }
  }
  return {
    get muted() { return muted; },
    startMusic() {
      if (playing || !ensure()) return;
      playing = true; step = 0; nextT = ctx.currentTime + 0.1;
      timer = setInterval(scheduler, 80);
    },
    stopMusic() { playing = false; clearInterval(timer); },
    setMuted(m) {
      muted = m; store("bahati-muted", m ? "1" : "0");
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
    },
    unlock() { ensure(); },
    sfx(kind) {
      if (muted || !ensure()) return;
      const t = ctx.currentTime;
      if (kind === "good") [72, 76, 79, 84].forEach((m, i) => tone(N(m), t + i * 0.07, 0.16, "square", 0.09));
      else if (kind === "bad") { tone(220, t, 0.45, "sawtooth", 0.1, 90); tone(165, t + 0.05, 0.4, "square", 0.05, 70); }
      else if (kind === "pop") tone(N(84), t, 0.08, "sine", 0.12, N(96));
      else if (kind === "boing") tone(180, t, 0.3, "sine", 0.15, 700);
      else if (kind === "win") [72, 72, 72, 76, 79, 84, 79, 84].forEach((m, i) => tone(N(m), t + i * 0.11, 0.2, "square", 0.09));
      else if (kind === "lose") [67, 66, 65, 64].forEach((m, i) => tone(N(m - 12), t + i * 0.3, 0.45, "sawtooth", 0.09, N(m - 13)));
    }
  };
})();

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
  Sound.unlock(); Sound.startMusic();
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
    Sound.sfx("good"); cheer();
  } else {
    st.selected.btn.classList.remove("selected"); st.selected.btn.classList.add("wrong");
    setFeedback("bad", "Oops!", `Correct answer: ${word[0]} = ${word[1]}${word[2] ? " (" + word[2] + ")" : ""}`);
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
    ? `You just practiced ${LANGS[st.lang].name}. Want to learn it for real with a teacher?`
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

document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => start(b.dataset.lang)));
$("check").addEventListener("click", onCheck);
$("quit").addEventListener("click", () => { if (confirm("Quit this lesson? Your progress will be lost.")) { refreshStart(); show("screen-start"); } });
$("again").addEventListener("click", () => { refreshStart(); show("screen-start"); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !$("screen-lesson").hidden && !$("check").disabled && document.activeElement.tagName !== "BUTTON") onCheck();
});
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
document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("mouseenter", () => { if (!Sound.muted && !reduceMotion) Sound.sfx("pop"); }));
// Pause music when tab hidden
document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.stopMusic(); else if (st && !$("screen-lesson").hidden) Sound.startMusic(); });

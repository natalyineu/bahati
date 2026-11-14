"use strict";

const LEVELS = [
  { id: 1, emoji: "🌱", name: "Easy", lanes: 3, speed: 55, hearts: 5, count: 10, hint: true, desc: "3 lanes · slow · English hint · 5 hearts" },
  { id: 2, emoji: "🌿", name: "Medium", lanes: 3, speed: 85, hearts: 5, count: 12, hint: false, desc: "3 lanes · faster · no hint · 5 hearts" },
  { id: 3, emoji: "🔥", name: "Hard", lanes: 4, speed: 115, hearts: 4, count: 14, hint: false, desc: "4 lanes · fast · 4 hearts" },
  { id: 4, emoji: "💀", name: "Expert", lanes: 4, speed: 150, hearts: 3, count: 16, hint: false, noPinyin: true, desc: "4 lanes · very fast · no pinyin · 3 hearts" }
];
document.getElementById("root").innerHTML = pageShell({
  title: "Falling Words", mascot: "bunny",
  sub: "Words fall from the sky! Tap the right word for the picture before it hits the ground.",
  playHTML: `<p class="prompt">Catch the word for</p>
    <div id="target" class="target" aria-live="polite"></div>
    <div id="arena" class="arena" role="group" aria-label="Falling words"><div class="ground"></div></div>
    <p id="msg" class="pic-msg" role="status">Tip: keys 1 to 4 also work</p>`
});
const state = {};
const prog = makeProgress("bahati-catch", LEVELS);
buildLangChips($("chips-to"), ["es", "zh", "pl", "ru"], "bahati-catch-lang", state);
const refresh = () => { prog.paint($("chips-lvl"), $("lvl-desc")); $("total-stars").textContent = prog.total(); };
refresh();
document.addEventListener("click", (e) => { if (e.target.closest("#chips-lvl")) refresh(); });

let g = null, raf = null, playing = false;
const heartsText = () => "❤".repeat(g.hearts) + "♡".repeat(g.L.hearts - g.hearts);

function start() {
  Sound.unlock(); Sound.startMusic();
  const L = prog.cur(), lang = state.lang;
  g = { L, lang, pool: shuffle(WORDS), q: 0, hearts: L.hearts, correct: 0, score: 0, speed: L.speed, cards: [], word: null, busy: false, last: 0 };
  playing = true;
  show("screen-play");
  $("timer").textContent = heartsText();
  nextQuestion();
  cancelAnimationFrame(raf); g.last = performance.now(); raf = requestAnimationFrame(loop);
}

const wordHTML = (w) => (g.lang === "zh" && !g.L.noPinyin ? `${w.zh}<small>${w.py}</small>` : w[g.lang]);

function nextQuestion() {
  if (g.q >= g.L.count) return finish(true);
  const arena = $("arena");
  arena.querySelectorAll(".fall").forEach((c) => c.remove());
  g.cards = []; g.busy = false;
  const w = g.pool[g.q % g.pool.length];
  g.word = w;
  setProgressBar((g.q / g.L.count) * 100);
  $("target").innerHTML = `<span class="pic">${w.pic}</span>` + (g.L.hint ? `<small>${w.en}</small>` : "");
  const others = shuffle(WORDS.filter((x) => x !== w)).slice(0, g.L.lanes - 1);
  const lanes = shuffle([...Array(g.L.lanes).keys()]);
  shuffle([w, ...others]).forEach((x, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "fall"; b.innerHTML = wordHTML(x); b.lang = g.lang;
    b.style.width = `calc(${100 / g.L.lanes}% - 8px)`; b.style.left = `calc(${(lanes[i] * 100) / g.L.lanes}% + 4px)`;
    const c = { el: b, y: -70 - Math.random() * 40, w: x, lane: lanes[i], done: false };
    b.style.transform = `translateY(${c.y}px)`;
    b.addEventListener("click", () => tap(c));
    arena.appendChild(b); g.cards.push(c);
  });
}

function tap(c) {
  if (!playing || g.busy || c.done) return;
  if (c.w === g.word) {
    g.busy = true; c.el.classList.add("right");
    const bonus = Math.max(0, Math.round((1 - c.y / $("arena").clientHeight) * 10));
    g.correct++; g.score += 10 + bonus; g.q++;
    g.speed *= 1.03;
    Sound.sfx("good"); speak(g.word[g.lang], g.lang);
    $("msg").textContent = `Yes! ${g.word.pic} = ${g.word[g.lang]}` + (g.lang === "zh" ? ` (${g.word.py})` : "");
    g.cards.forEach((o) => { if (o !== c) o.el.classList.add("fade"); });
    setTimeout(nextQuestion, 700);
  } else {
    c.done = true; c.el.classList.add("wrong"); setTimeout(() => c.el.remove(), 350);
    g.cards = g.cards.filter((o) => o !== c);
    loseHeart();
  }
}

function loseHeart() {
  g.hearts--; $("timer").textContent = heartsText();
  Sound.sfx("bad");
  const a = $("arena"); a.classList.remove("screen-shake"); void a.offsetWidth; a.classList.add("screen-shake");
  if (g.hearts <= 0) { g.busy = true; setTimeout(() => finish(false), 500); }
}

function loop(now) {
  const dt = Math.min(0.05, (now - g.last) / 1000); g.last = now;
  if (playing && g) {
    const arena = $("arena"), floor = arena.clientHeight - 62;
    g.cards.forEach((c) => {
      if (c.done) return;
      if (!g.busy) c.y += g.speed * dt;
      c.el.style.transform = `translateY(${c.y}px)`;
      if (!g.busy && c.y >= floor && c.w === g.word) {
        g.busy = true; c.el.classList.add("right");
        g.cards.forEach((o) => { if (o !== c) o.el.classList.add("fade"); });
        $("msg").textContent = `Missed it: ${g.word.pic} = ${g.word[g.lang]}`;
        g.q++; loseHeart();
        if (g.hearts > 0) setTimeout(nextQuestion, 1000);
      } else if (!g.busy && c.y >= floor) { c.y = floor; }
    });
  }
  raf = requestAnimationFrame(loop);
}

function finish(won) {
  playing = false; Sound.sfx(won ? "win" : "lose");
  const lost = g.L.hearts - g.hearts;
  const stars = won ? (lost === 0 ? 3 : lost <= 2 ? 2 : 1) : 0;
  const unlockedLvl = won ? prog.complete(g.L.id, stars) : null;
  $("stars").textContent = won ? "★".repeat(stars) + "☆".repeat(3 - stars) : "";
  $("end-title").textContent = won ? "You caught them all! 🎉" : "Out of hearts 💔";
  if (unlockedLvl) $("end-title").textContent += ` ${unlockedLvl.name} ${unlockedLvl.emoji} unlocked`;
  $("end-mascot").src = won ? "images/bunny.svg" : "images/panda.svg";
  $("end-mascot").className = "mascot-big " + (won ? "dance" : "sad");
  $("end-stats").innerHTML = pill(`⭐ <b>${g.score}</b> points`) + pill(`🎯 <b>${g.correct}</b>/${g.L.count} caught`) + pill(`❤ <b>${g.hearts}</b> left`);
  $("next-level").hidden = !(won && g.L.id < LEVELS.length);
  refresh(); show("screen-end");
  if (won) confetti();
}

$("play").addEventListener("click", start);
$("again").addEventListener("click", () => { refresh(); show("screen-start"); });
$("next-level").addEventListener("click", () => { prog.level = Math.min(prog.unlocked, g.L.id + 1); store("bahati-catch-level", String(prog.level)); start(); });
$("quit").addEventListener("click", () => { if (confirm("Quit this game?")) { playing = false; refresh(); show("screen-start"); } });
document.addEventListener("keydown", (e) => {
  if (!playing || !/^[1-4]$/.test(e.key)) return;
  const c = g.cards.find((x) => x.lane === Number(e.key) - 1);
  if (c) tap(c);
});
wireMute(() => playing);

"use strict";

const LEVELS = [
  { id: 1, emoji: "🌱", name: "Easy", maxLen: 5, decoys: 0, clue: "both", time: 0, desc: "Short words · picture and English clue" },
  { id: 2, emoji: "🌿", name: "Medium", maxLen: 7, decoys: 0, clue: "pic", time: 0, desc: "Longer words · picture only" },
  { id: 3, emoji: "🔥", name: "Hard", maxLen: 99, decoys: 2, clue: "pic", time: 0, desc: "Any word · 2 extra decoy letters" },
  { id: 4, emoji: "💀", name: "Expert", maxLen: 99, decoys: 3, clue: "en", time: 30, desc: "English clue only · 3 decoys · 30 s per word" }
];
const ROUNDS = 8;
document.getElementById("root").innerHTML = pageShell({
  title: "Word Scramble", mascot: "panda",
  sub: "Tap the letters in the right order to spell the word for the picture. Chinese is not included because it has no letters to scramble.",
  playHTML: `<div class="qtimer" id="qtimer" hidden><div id="qtimer-fill"></div></div>
    <p class="prompt">Spell the word</p>
    <div id="clue" class="target"></div>
    <div id="slots" class="slots" aria-label="Your answer"></div>
    <div id="tiles" class="tiles" aria-label="Letters"></div>
    <div class="end-actions" style="margin-top:18px"><button id="hint" class="btn btn-ghost btn-small" type="button">💡 Hint (-3)</button><button id="skip" class="btn btn-ghost btn-small" type="button">⏭ Skip</button></div>
    <p id="msg" class="pic-msg" role="status"></p>`
});
const state = {};
const prog = makeProgress("bahati-scr", LEVELS);
buildLangChips($("chips-to"), ["es", "pl", "ru"], "bahati-scr-lang", state);
const refresh = () => { prog.paint($("chips-lvl"), $("lvl-desc")); $("total-stars").textContent = prog.total(); };
refresh();
document.addEventListener("click", (e) => { if (e.target.closest("#chips-lvl")) refresh(); });

let g = null, playing = false, qTimer = null;
const chars = (s) => Array.from(s.toLowerCase());

function stopTimer() { clearInterval(qTimer); qTimer = null; $("qtimer").hidden = true; }
function startTimer(secs) {
  if (!secs) return;
  const fill = $("qtimer-fill"); $("qtimer").hidden = false; fill.style.width = "100%"; fill.classList.remove("low");
  const t0 = Date.now();
  qTimer = setInterval(() => {
    const left = Math.max(0, 1 - (Date.now() - t0) / (secs * 1000));
    fill.style.width = left * 100 + "%"; fill.classList.toggle("low", left < 0.3);
    if (left <= 0) { stopTimer(); giveUp("Time's up! ⏰"); }
  }, 100);
}

function start() {
  Sound.unlock(); Sound.startMusic();
  const L = prog.cur(), lang = state.lang;
  let pool = WORDS.filter((w) => chars(w[lang]).length >= 3 && chars(w[lang]).length <= L.maxLen);
  if (pool.length < ROUNDS) pool = WORDS.filter((w) => chars(w[lang]).length >= 3);
  g = { L, lang, words: shuffle(pool).slice(0, ROUNDS), i: 0, miss: 0, hints: 0, score: 0, t0: Date.now(), busy: false };
  playing = true; show("screen-play");
  render();
}

function render() {
  stopTimer();
  if (g.i >= g.words.length) return finish();
  const w = g.words[g.i], L = g.L;
  g.busy = false; g.locked = null; g.answer = chars(w[g.lang]);
  setProgressBar((g.i / g.words.length) * 100);
  $("timer").textContent = `${g.i + 1}/${g.words.length}`;
  $("clue").innerHTML = (L.clue !== "en" ? `<span class="pic">${w.pic}</span>` : "") + (L.clue !== "pic" ? `<small class="big">${w.en}</small>` : "");
  $("msg").textContent = "";
  // tiles = answer letters + decoys, shuffled so it never starts solved
  const others = shuffle(Array.from(new Set(WORDS.flatMap((x) => chars(x[g.lang])))).filter((c) => !g.answer.includes(c)));
  let letters = g.answer.concat(others.slice(0, L.decoys));
  let tries = 0;
  do { letters = shuffle(letters); tries++; } while (tries < 20 && L.decoys === 0 && letters.join("") === g.answer.join(""));
  g.tiles = letters.map((ch, id) => ({ ch, id, used: false }));
  g.slots = Array(g.answer.length).fill(null);
  g.hintCount = 0;
  draw();
  startTimer(L.time);
}

function draw() {
  const slots = $("slots"), tiles = $("tiles");
  slots.innerHTML = ""; tiles.innerHTML = "";
  g.slots.forEach((t, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "slot" + (t != null ? " filled" : "") + (t != null && g.locked && g.locked[i] ? " locked" : "");
    b.textContent = t != null ? g.tiles[t].ch : "";
    b.setAttribute("aria-label", t != null ? `Letter ${g.tiles[t].ch}, tap to remove` : "Empty slot");
    b.addEventListener("click", () => removeAt(i));
    slots.appendChild(b);
  });
  g.tiles.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tile" + (t.used ? " used" : ""); b.textContent = t.ch; b.disabled = t.used;
    b.addEventListener("click", () => place(t.id));
    tiles.appendChild(b);
  });
}

function place(id) {
  if (g.busy) return;
  const i = g.slots.indexOf(null);
  if (i < 0) return;
  g.slots[i] = id; g.tiles[id].used = true; Sound.sfx("pop");
  draw();
  if (g.slots.indexOf(null) < 0) check();
}
function removeAt(i) {
  if (g.busy || g.slots[i] == null || (g.locked && g.locked[i])) return;
  g.tiles[g.slots[i]].used = false; g.slots[i] = null; draw();
}

function check() {
  const guess = g.slots.map((id) => g.tiles[id].ch);
  if (guess.join("") === g.answer.join("")) {
    g.busy = true; stopTimer();
    g.score += Math.max(4, 10 - g.hintCount * 3);
    Sound.sfx("good"); speak(g.words[g.i][g.lang], g.lang);
    $("slots").classList.add("win");
    $("msg").textContent = `Correct! ${g.words[g.i].pic} = ${g.words[g.i][g.lang]}`;
    setTimeout(() => { $("slots").classList.remove("win"); g.i++; render(); }, 1000);
  } else {
    g.miss++; Sound.sfx("bad");
    $("slots").classList.add("bad");
    $("msg").textContent = "Not quite. Try again!";
    g.busy = true;
    setTimeout(() => {
      $("slots").classList.remove("bad");
      g.slots.forEach((id, i) => { if (id != null && !(g.locked && g.locked[i])) { g.tiles[id].used = false; g.slots[i] = null; } });
      g.busy = false; draw();
    }, 500);
  }
}

function hint() {
  if (g.busy) return;
  g.locked = g.locked || [];
  const i = g.slots.findIndex((id, k) => id == null || g.tiles[id].ch !== g.answer[k]);
  if (i < 0) return;
  if (g.slots[i] != null) { g.tiles[g.slots[i]].used = false; g.slots[i] = null; }
  const t = g.tiles.find((x) => !x.used && x.ch === g.answer[i]);
  if (!t) return;
  g.slots[i] = t.id; t.used = true; g.hintCount++; g.hints++; g.locked[i] = true;
  Sound.sfx("boing"); draw();
  if (g.slots.indexOf(null) < 0) check();
}

function giveUp(title) {
  if (g.busy) return;
  g.busy = true; stopTimer(); g.miss++; Sound.sfx("bad");
  const w = g.words[g.i];
  $("msg").textContent = `${title} Answer: ${w[g.lang]}`;
  setTimeout(() => { g.i++; g.locked = null; render(); }, 1500);
}

function finish() {
  playing = false; stopTimer();
  const secs = Math.floor((Date.now() - g.t0) / 1000);
  const stars = g.miss + g.hints <= 1 ? 3 : g.miss + g.hints <= 4 ? 2 : 1;
  const unlockedLvl = prog.complete(g.L.id, stars);
  $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("end-title").textContent = "Words unscrambled! 🎉" + (unlockedLvl ? ` ${unlockedLvl.name} ${unlockedLvl.emoji} unlocked` : "");
  $("end-stats").innerHTML = pill(`⏱ <b>${secs}</b>s`) + pill(`🙈 <b>${g.miss}</b> mistakes`) + pill(`💡 <b>${g.hints}</b> hints`) + pill(`⭐ <b>${g.score}</b> points`);
  $("next-level").hidden = g.L.id >= LEVELS.length;
  refresh(); show("screen-end"); Sound.sfx("win"); confetti();
}

$("hint").addEventListener("click", hint);
$("skip").addEventListener("click", () => giveUp("Skipped."));
$("play").addEventListener("click", start);
$("again").addEventListener("click", () => { refresh(); show("screen-start"); });
$("next-level").addEventListener("click", () => { prog.level = Math.min(prog.unlocked, g.L.id + 1); store("bahati-scr-level", String(prog.level)); start(); });
$("quit").addEventListener("click", () => { if (confirm("Quit this game?")) { playing = false; stopTimer(); refresh(); show("screen-start"); } });
wireMute(() => playing);

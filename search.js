"use strict";

const LEVELS = [
  { id: 1, emoji: "🌱", name: "Easy", size: 7, count: 5, dirs: [[1, 0], [0, 1]], clue: "both", desc: "7×7 grid · 5 words · across and down · picture and English clues" },
  { id: 2, emoji: "🌿", name: "Medium", size: 8, count: 6, dirs: [[1, 0], [0, 1], [1, 1]], clue: "pic", desc: "8×8 grid · 6 words · adds diagonals · picture clues" },
  { id: 3, emoji: "🔥", name: "Hard", size: 9, count: 8, dirs: [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]], clue: "pic", desc: "9×9 grid · 8 words · adds backwards words" },
  { id: 4, emoji: "💀", name: "Expert", size: 10, count: 10, dirs: [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]], clue: "en", desc: "10×10 grid · 10 words · every direction · English clues only" }
];
const ALPHA = {
  es: "ABCDEFGHIJLMNOPQRSTUVXYZ",
  pl: "ABCDEFGHIJKLŁMNOPRSTUWYZĄĆĘŃÓŚŹŻ",
  ru: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЭЮЯ"
};
document.getElementById("root").innerHTML = pageShell({
  title: "Word Search", mascot: "bunny",
  sub: "Find the hidden words! Tap the first letter and then the last letter of each word. The clues are pictures.",
  playHTML: `<p class="prompt">Find the words</p>
    <div id="clues" class="clues" aria-label="Words to find"></div>
    <div id="grid" class="wsgrid" role="grid" aria-label="Letter grid"></div>
    <p id="msg" class="pic-msg" role="status"></p>`
});
const state = {};
const prog = makeProgress("bahati-ws", LEVELS);
buildLangChips($("chips-to"), ["es", "zh", "pl", "ru"], "bahati-ws-lang", state);
const refresh = () => { prog.paint($("chips-lvl"), $("lvl-desc")); $("total-stars").textContent = prog.total(); };
refresh();
document.addEventListener("click", (e) => { if (e.target.closest("#chips-lvl")) refresh(); });

let g = null, playing = false, tick = null;
const up = (s, lang) => (lang === "zh" ? s : s.toUpperCase());
const rnd = (n) => Math.floor(Math.random() * n);

function build(words, L, lang) {
  const size = L.size;
  const filler = lang === "zh" ? Array.from(new Set(WORDS.flatMap((w) => Array.from(w.zh)))) : Array.from(ALPHA[lang]);
  for (let attempt = 0; attempt < 40; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(""));
    const placed = [];
    let ok = true;
    for (const w of words) {
      const cs = Array.from(up(w[lang], lang));
      let done = false;
      for (let t = 0; t < 300 && !done; t++) {
        const [dx, dy] = L.dirs[rnd(L.dirs.length)];
        const x0 = rnd(size), y0 = rnd(size);
        const x1 = x0 + dx * (cs.length - 1), y1 = y0 + dy * (cs.length - 1);
        if (x1 < 0 || y1 < 0 || x1 >= size || y1 >= size) continue;
        const cells = cs.map((c, i) => [x0 + dx * i, y0 + dy * i]);
        if (!cells.every(([x, y], i) => grid[y][x] === "" || grid[y][x] === cs[i])) continue;
        cells.forEach(([x, y], i) => { grid[y][x] = cs[i]; });
        placed.push({ w, cells, found: false }); done = true;
      }
      if (!done) { ok = false; break; }
    }
    if (!ok) continue;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!grid[y][x]) grid[y][x] = filler[rnd(filler.length)];
    return { grid, placed };
  }
  return null;
}

function start() {
  Sound.unlock(); Sound.startMusic();
  const L = prog.cur(), lang = state.lang;
  const fits = (w) => { const n = Array.from(w[lang]).length; return n >= 2 && n <= L.size; };
  let built = null;
  for (let i = 0; i < 20 && !built; i++) built = build(shuffle(WORDS.filter(fits)).slice(0, L.count), L, lang);
  if (!built) { alert("Could not build a puzzle, please try again."); return; }
  g = { L, lang, ...built, sel: null, miss: 0, found: 0, t0: Date.now(), busy: false };
  playing = true; show("screen-play");
  clearInterval(tick); tick = setInterval(() => { $("timer").textContent = Math.floor((Date.now() - g.t0) / 1000) + "s"; }, 500);
  $("timer").textContent = "0s"; $("msg").textContent = ""; setProgressBar(0);
  drawClues(); drawGrid();
}

function drawClues() {
  $("clues").innerHTML = "";
  g.placed.forEach((p, i) => {
    const s = document.createElement("span");
    s.className = "clue" + (p.found ? " found" : ""); s.id = "clue-" + i;
    s.innerHTML = (g.L.clue !== "en" ? `<span class="pic">${p.w.pic}</span>` : "") + (g.L.clue !== "pic" ? `<small>${p.w.en}</small>` : "") + (p.found ? `<b>${p.w[g.lang]}</b>` : "");
    $("clues").appendChild(s);
  });
}

function drawGrid() {
  const grid = $("grid"), n = g.L.size;
  grid.innerHTML = ""; grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "wscell"; b.textContent = g.grid[y][x]; b.dataset.x = x; b.dataset.y = y;
    b.setAttribute("aria-label", `${g.grid[y][x]}, row ${y + 1}, column ${x + 1}`);
    b.addEventListener("click", () => tapCell(x, y));
    grid.appendChild(b);
  }
}
const cellEl = (x, y) => $("grid").children[y * g.L.size + x];

function tapCell(x, y) {
  if (!playing || g.busy) return;
  if (!g.sel) { g.sel = [x, y]; cellEl(x, y).classList.add("sel"); Sound.sfx("pop"); return; }
  const [ax, ay] = g.sel; g.sel = null;
  document.querySelectorAll(".wscell.sel").forEach((e) => e.classList.remove("sel"));
  const dx = x - ax, dy = y - ay, n = Math.max(Math.abs(dx), Math.abs(dy));
  if (n === 0) return;
  if (!(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy))) { g.sel = [x, y]; cellEl(x, y).classList.add("sel"); return; } // restart from this cell
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const line = Array.from({ length: n + 1 }, (_, i) => [ax + sx * i, ay + sy * i]);
  const key = (c) => c.map((p) => p.join(",")).join(";");
  const hit = g.placed.find((p) => !p.found && (key(p.cells) === key(line) || key(p.cells) === key(line.slice().reverse())));
  if (hit) {
    hit.found = true; g.found++;
    hit.cells.forEach(([cx, cy]) => cellEl(cx, cy).classList.add("found", "f" + (g.found % 6)));
    Sound.sfx("good"); speak(hit.w[g.lang], g.lang);
    $("msg").textContent = `Found: ${hit.w.pic} = ${hit.w[g.lang]}` + (g.lang === "zh" ? ` (${hit.w.py})` : "");
    setProgressBar((g.found / g.placed.length) * 100);
    drawClues();
    if (g.found === g.placed.length) { g.busy = true; setTimeout(finish, 900); }
  } else {
    g.miss++; Sound.sfx("bad"); $("msg").textContent = "Not a word. Try again!";
    line.forEach(([cx, cy]) => { const e = cellEl(cx, cy); e.classList.add("bad"); setTimeout(() => e.classList.remove("bad"), 400); });
  }
}

function finish() {
  playing = false; clearInterval(tick);
  const secs = Math.floor((Date.now() - g.t0) / 1000);
  const stars = g.miss <= 2 ? 3 : g.miss <= 5 ? 2 : 1;
  const unlockedLvl = prog.complete(g.L.id, stars);
  $("stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  $("end-title").textContent = "All words found! 🎉" + (unlockedLvl ? ` ${unlockedLvl.name} ${unlockedLvl.emoji} unlocked` : "");
  $("end-stats").innerHTML = pill(`⏱ <b>${secs}</b>s`) + pill(`🙈 <b>${g.miss}</b> wrong guesses`) + pill(`🔎 <b>${g.found}</b> words`);
  $("next-level").hidden = g.L.id >= LEVELS.length;
  refresh(); show("screen-end"); Sound.sfx("win"); confetti();
}

$("play").addEventListener("click", start);
$("again").addEventListener("click", () => { refresh(); show("screen-start"); });
$("next-level").addEventListener("click", () => { prog.level = Math.min(prog.unlocked, g.L.id + 1); store("bahati-ws-level", String(prog.level)); start(); });
$("quit").addEventListener("click", () => { if (confirm("Quit this game?")) { playing = false; clearInterval(tick); refresh(); show("screen-start"); } });
wireMute(() => playing);

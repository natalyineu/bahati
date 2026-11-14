"use strict";
// Shared helpers for the extra mini games (needs sound.js and data.js loaded first)

const $ = (id) => document.getElementById(id);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SCREENS = ["screen-start", "screen-play", "screen-end"];
const show = (id) => { SCREENS.forEach((s) => { $(s).hidden = s !== id; }); window.scrollTo(0, 0); };

function speak(text, lang) {
  if (!("speechSynthesis" in window) || !LANGS[lang]) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speech; u.rate = 0.9;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
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

function wireMute(isPlaying) {
  const btn = $("mute");
  const paint = () => { btn.textContent = Sound.muted ? "🔇" : "🎵"; btn.setAttribute("aria-pressed", String(Sound.muted)); btn.classList.toggle("off", Sound.muted); };
  btn.addEventListener("click", () => {
    Sound.unlock(); Sound.setMuted(!Sound.muted); paint();
    if (!Sound.muted) { Sound.startMusic(); Sound.sfx("boing"); }
  });
  paint();
  document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.stopMusic(); else if (isPlaying()) Sound.startMusic(); });
  const m = document.querySelector("#screen-start .mascot-big");
  if (m) m.addEventListener("click", () => { Sound.unlock(); Sound.sfx("boing"); });
}

// language chips: langs = ["es","zh",...]; state.lang holds the choice
function buildLangChips(box, langs, key, state, onChange) {
  const saved = store(key);
  state.lang = langs.includes(saved) ? saved : langs[0];
  const paint = () => {
    box.querySelectorAll(".chip").forEach((c) => {
      const on = c.dataset.lang === state.lang;
      c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on));
    });
    store(key, state.lang);
    if (onChange) onChange();
  };
  langs.forEach((l) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.lang = l;
    b.innerHTML = `<span class="glyph">${LANGS[l].glyph}</span><b>${LANGS[l].name}</b>`;
    b.addEventListener("click", () => { Sound.unlock(); Sound.sfx("pop"); state.lang = l; paint(); });
    box.appendChild(b);
  });
  paint();
  return paint;
}

// level progress: unlocking, remembered level, stars per level
function makeProgress(prefix, LEVELS) {
  const P = {
    LEVELS,
    unlocked: Math.max(1, Math.min(LEVELS.length, parseInt(store(prefix + "-unlocked"), 10) || 1)),
    level: 1,
    cur() { return LEVELS[this.level - 1]; },
    stars(id) { return parseInt(store(prefix + "-stars-" + id), 10) || 0; },
    total() { return LEVELS.reduce((s, L) => s + this.stars(L.id), 0); },
    // returns the newly unlocked level or null
    complete(id, stars) {
      if (stars > this.stars(id)) store(prefix + "-stars-" + id, String(stars));
      if (id < LEVELS.length && id + 1 > this.unlocked) { this.unlocked = id + 1; store(prefix + "-unlocked", String(this.unlocked)); return LEVELS[id]; }
      return null;
    },
    paint(box, descEl) {
      box.innerHTML = "";
      LEVELS.forEach((L) => {
        const b = document.createElement("button");
        const locked = L.id > this.unlocked, s = this.stars(L.id);
        b.type = "button"; b.className = "chip lvl-chip" + (L.id === this.level ? " on" : "");
        b.disabled = locked; b.setAttribute("aria-pressed", String(L.id === this.level));
        b.innerHTML = `<span class="glyph">${locked ? "🔒" : L.emoji}</span><b>${L.name}</b>` + (s ? `<span class="mini-stars">${"★".repeat(s)}</span>` : "");
        b.addEventListener("click", () => { Sound.unlock(); Sound.sfx("pop"); this.level = L.id; store(prefix + "-level", String(L.id)); this.paint(box, descEl); });
        box.appendChild(b);
      });
      descEl.textContent = this.cur().desc;
    }
  };
  P.level = Math.min(P.unlocked, parseInt(store(prefix + "-level"), 10) || 1);
  return P;
}

// page skeleton shared by all extra games
function pageShell({ title, sub, mascot, startExtra, playHTML }) {
  return `
  <button id="mute" class="mute" type="button" aria-pressed="false" aria-label="Toggle music">🎵</button>
  <div class="bg-float" aria-hidden="true"><span>🎵</span><span>✦</span><span>♡</span><span>🎶</span><span>✦</span><span>♡</span><span>🎵</span><span>✦</span></div>
  <div id="app" class="app">
    <section id="screen-start" class="screen">
      <a class="back" href="games.html">← All games</a>
      <img class="mascot-big" src="images/${mascot}.svg" alt="" width="200" height="200">
      <h1>${title}</h1>
      <p class="sub">${sub}</p>
      <div class="stats-row"><span class="pill">⭐ Stars: <b id="total-stars">0</b></span></div>
      <div class="picker">
        <p class="pick-title">I want to learn</p>
        <div id="chips-to" class="chips"></div>
        <p class="pick-title">Level</p>
        <div id="chips-lvl" class="chips"></div>
        <p id="lvl-desc" class="lvl-desc"></p>
        ${startExtra || ""}
        <div class="end-actions" style="margin-top:18px"><button id="play" class="btn game-btn">Start</button></div>
      </div>
    </section>
    <section id="screen-play" class="screen lesson" hidden>
      <header class="topbar">
        <button id="quit" class="icon-btn" aria-label="Quit game">×</button>
        <div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progress-fill"></div></div>
        <div class="timer" id="timer" aria-label="Time">0s</div>
      </header>
      <div class="lesson-body">${playHTML}</div>
    </section>
    <section id="screen-end" class="screen" hidden>
      <img id="end-mascot" class="mascot-big dance" src="images/bunny.svg" alt="" width="200" height="200">
      <h1 id="end-title">Great job! 🎉</h1>
      <div id="stars" class="stars" aria-label="Stars"></div>
      <div class="stats-row" id="end-stats"></div>
      <div class="end-actions">
        <button id="next-level" class="btn" hidden>Next level →</button>
        <button id="again" class="btn btn-ghost">Play again</button>
        <a class="btn btn-ghost" href="games.html">All games</a>
      </div>
    </section>
  </div>`;
}

function setProgressBar(pct) {
  $("progress-fill").style.width = pct + "%";
  document.querySelector(".progress").setAttribute("aria-valuenow", Math.round(pct));
}
function pill(html) { return `<span class="pill">${html}</span>`; }

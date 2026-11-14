"use strict";

function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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


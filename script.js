const form = document.getElementById("trial-form");
const msg = document.getElementById("form-msg");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const languageSelect = document.getElementById("language");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const language = languageSelect.value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !language) {
    msg.className = "error";
    msg.textContent = "Please fill in your name, a valid email and a language.";
    return;
  }
  msg.className = "";
  msg.textContent = `Yay, ${name}! Our bunny has been notified. We'll contact you about your ${language} trial lesson. 🐰`;
  confetti();
  form.reset();
});

document.querySelectorAll(".card a[data-lang]").forEach((link) => {
  link.addEventListener("click", () => {
    languageSelect.value = link.dataset.lang;
  });
});

const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("visible"));
}

// Rotating hero word
const swap = document.getElementById("swap");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (swap && !reduceMotion) {
  const words = ["with confidence", "¡con confianza!", "有信心", "z pewnością", "уверенно"];
  let i = 0;
  swap.style.transition = "opacity .35s, transform .35s";
  swap.style.display = "inline-block";
  setInterval(() => {
    swap.style.opacity = 0;
    swap.style.transform = "translateY(10px)";
    setTimeout(() => {
      i = (i + 1) % words.length;
      swap.textContent = words[i];
      swap.style.opacity = 1;
      swap.style.transform = "none";
    }, 350);
  }, 2800);
}

// Talking mascots
const jokes = {
  bunny: ["Bonbon here! ¡Hola! That's 50% of Spanish already.", "I only speak carrot, but I'm taking lessons.", "Hop in, the first lesson is free!", "Ñ is just N wearing a tiny hat."],
  panda: ["Mochi here! 你好! Tones are easy. Said no one ever.", "I eat bamboo and study characters. Busy life.", "Mā, má, mǎ, mà. Pick one. Good luck!", "Free trial? That's bamboo-tiful!"]
};
document.querySelectorAll(".plush[data-says]").forEach((el) => {
  const talk = () => {
    const list = jokes[el.dataset.says];
    const old = el.parentElement.querySelector(".bubble");
    if (old) old.remove();
    const b = document.createElement("div");
    b.className = "bubble " + (el.classList.contains("plush-a") ? "bubble-a" : "bubble-b");
    b.setAttribute("role", "status");
    b.textContent = list[Math.floor(Math.random() * list.length)];
    el.parentElement.appendChild(b);
    el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
    hearts(el);
    setTimeout(() => b.remove(), 3500);
  };
  el.addEventListener("click", talk);
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); talk(); } });
});

// Card mascots hop on click
document.querySelectorAll(".card .plush").forEach((el) => {
  el.parentElement.addEventListener("click", () => {
    el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
    hearts(el);
  });
});

// Confetti
function confetti() {
  if (reduceMotion) return;
  const colors = ["#f0629b", "#8e7cd6", "#ffd84d", "#5fc9b4", "#f26a1b"];
  for (let n = 0; n < 60; n++) {
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

// Floating hearts
function hearts(el) {
  if (reduceMotion) return;
  const r = el.getBoundingClientRect();
  ["♡", "♥", "✦", "♡", "♥"].forEach((ch, n) => {
    const s = document.createElement("span");
    s.className = "heart";
    s.textContent = ch;
    s.style.left = r.left + r.width / 2 + (Math.random() * 60 - 30) + "px";
    s.style.top = r.top + r.height / 3 + "px";
    s.style.color = ["#f0629b", "#8e7cd6", "#ffd84d", "#f26a1b", "#5fc9b4"][n];
    s.style.animationDelay = n * 0.08 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  });
}

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
  msg.textContent = `Thanks, ${name}! We'll contact you about your ${language} trial lesson.`;
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

const form = document.getElementById("trial-form");
const msg = document.getElementById("form-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const language = form.language.value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !language) {
    msg.textContent = "Please fill in your name, a valid email and a language.";
    return;
  }
  msg.textContent = `Thanks, ${name}! We'll contact you about your ${language} trial lesson.`;
  form.reset();
});

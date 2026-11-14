const form = document.getElementById("trial-form");
const msg = document.getElementById("form-msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const language = document.getElementById("language").value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !language) {
    msg.textContent = "Please fill in your name, a valid email and a language.";
    return;
  }
  msg.textContent = `Thanks, ${name}! We'll contact you about your ${language} trial lesson.`;
  form.reset();
});

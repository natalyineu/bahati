let count = 0;
const btn = document.getElementById("counter-btn");

btn.addEventListener("click", () => {
  count += 1;
  btn.textContent = `Clicked ${count} ${count === 1 ? "time" : "times"}`;
});

document.getElementById("signup").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("signup-msg");
  msg.textContent = email ? `Thanks, ${email} is signed up!` : "Please enter an email.";
});

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const loginLink = document.getElementById("login-link");
const createLink = document.getElementById("create-link");
const signup = document.getElementById("signup");
const login = document.getElementById("login");
const fileInput = document.getElementById("dp");
const previewSpan = document.getElementById("pic");
const accountDetails = document.getElementById("account-details");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

loginLink.addEventListener("click", (e) => {
  e.preventDefault();
  signup.style.display = "none";
  login.style.display = "block";
});

createLink.addEventListener("click", (e) => {
  e.preventDefault();
  login.style.display = "none";
  signup.style.display = "block";
});

accountDetails.addEventListener("submit", (e) => {
    e.preventDefault();
});

fileInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();

    reader.addEventListener("load", function () {
      previewSpan.style.backgroundImage = `url(${this.result})`;
    });

    reader.readAsDataURL(file);
  }
});

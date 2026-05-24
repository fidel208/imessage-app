const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const profileView = document.getElementById("profile-view");

const signupSubView = document.getElementById("signup");
const loginSubView = document.getElementById("login");

let msgPollInterval = null;

function navigateTo(viewName) {
  authView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  profileView.classList.add("hidden");

  if (msgPollInterval) {
    clearInterval(msgPollInterval);
    msgPollInterval = null;
    console.log("REST message engine interval cleared safely.");
  }

  if (viewName === "auth") {
    authView.classList.remove("hidden");
    authView.style.setProperty("display", "flex", "important");
  } else if (viewName === "dashboard") {
    authView.style.setProperty("display", "none", "important");
    dashboardView.classList.remove("hidden");
    startMessagePolling();
  } else if (viewName === "profile") {
    authView.style.setProperty("display", "none", "important");
    profileView.classList.remove("hidden");
  }
}

const loginLink = document.getElementById("login-link");
const createLink = document.getElementById("create-link");

loginLink.addEventListener("click", (e) => {
  e.preventDefault();
  signupSubView.style.setProperty("display", "none", "important");
  loginSubView.style.setProperty("display", "block", "important");
});

createLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginSubView.style.setProperty("display", "none", "important");
  signupSubView.style.setProperty("display", "block", "important");
});

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const accountDetailsForm = document.getElementById("account-details");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const data = Object.fromEntries(formData.entries());
  console.log("Sending Registry Payload to backend server endpoints:", data);
  navigateTo("dashboard");
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData.entries());
  console.log(
    "Sending Authentication Credentials to security gateway paths:",
    data,
  );
  navigateTo("dashboard");
});

accountDetailsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(accountDetailsForm);
  console.log(
    "Sending updated account settings array fields to parser mechanisms...",
  );
  navigateTo("dashboard");
});

const msgForm = document.getElementById("msg-form");
const msgInput = document.getElementById("msg-input");
const chatBox = document.getElementById("chat-box");

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const rawTextValue = msgInput.value.trim();

  if (!rawTextValue) return;
  appendMessage({
    text: rawTextValue,
    time: getCleanSystemTime(),
    type: "outgoing",
  });

  msgInput.value = "";
  console.log("HTTP POST request initiated for message transmission.");
});

function startMessagePolling() {
  console.log("Short polling sequence activated: Fetch intervals configured.");
  msgPollInterval = setInterval(() => {
    fetchIncomingPacketsFromServer();
  }, 4000);
}

async function fetchIncomingPacketsFromServer() {
  console.log(
    "Fired automatic refresh check: GET /api/messages query dispatched.",
  );
}

function appendMessage({ text, time, type }) {
  const msgBubbleNode = document.createElement("div");
  msgBubbleNode.className = `message ${type}`;

  msgBubbleNode.innerHTML = `
    <p>${text}</p>
    <span class="msg-time">${time}</span>
  `;

  chatBox.appendChild(msgBubbleNode);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getCleanSystemTime() {
  const dateInstance = new Date();
  return dateInstance.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const fileInput = document.getElementById("dp");
const previewSpan = document.getElementById("pic");

fileInput.addEventListener("change", function () {
  const targetImageFile = this.files[0];
  if (targetImageFile) {
    const fileReaderProcess = new FileReader();

    fileReaderProcess.addEventListener("load", function () {
      previewSpan.style.backgroundImage = `url(${this.result})`;
    });

    fileReaderProcess.readAsDataURL(targetImageFile);
  }
});

const settingsButton = document.getElementById("go-to-profile-btn");
settingsButton.addEventListener("click", () => {
  navigateTo("profile");
});

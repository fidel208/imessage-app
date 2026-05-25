const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const profileView = document.getElementById("profile-view");

const signupSubView = document.getElementById("signup");
const loginSubView = document.getElementById("login");

const BACKEND_URL = "http://localhost:5000/api";
let msgPollInterval = null;

let currentUser = null;
let activeRecipientId = null;
let activeGroupId = null;
let currentChatMode = "direct";
let pendingChatImageBase64 = null;

function navigateTo(viewName) {
  authView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  profileView.classList.add("hidden");

  if (msgPollInterval) {
    clearInterval(msgPollInterval);
    msgPollInterval = null;
  }

  if (viewName === "auth") {
    authView.classList.remove("hidden");
    authView.style.setProperty("display", "flex", "important");
  } else if (viewName === "dashboard") {
    authView.style.setProperty("display", "none", "important");
    dashboardView.classList.remove("hidden");
    loadDirectoryDataStream();
    startMessagePolling();
  } else if (viewName === "profile") {
    authView.style.setProperty("display", "none", "important");
    profileView.classList.remove("hidden");
    populateProfileForm();
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

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (response.ok) {
      currentUser = result.user;
      navigateTo("dashboard");
    } else {
      alert(result.error || "Signup failed");
    }
  } catch (err) {
    console.error(err);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (response.ok) {
      currentUser = result.user;
      navigateTo("dashboard");
    } else {
      alert(result.error || "Login failed");
    }
  } catch (err) {
    console.error(err);
  }
});

accountDetailsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const formData = new FormData(accountDetailsForm);
  const data = Object.fromEntries(formData.entries());
  data.id = currentUser.id;

  try {
    const response = await fetch(`${BACKEND_URL}/users/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (response.ok) {
      currentUser = result.user;
      alert("Profile updated successfully!");
      navigateTo("dashboard");
    } else {
      alert(result.error || "Failed to update profile");
    }
  } catch (err) {
    console.error(err);
  }
});

const chatImgInput = document.getElementById("chat-image-input");
chatImgInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      pendingChatImageBase64 = e.target.result;
      msgInput.placeholder = "Image attached! Press send to dispatch...";
      msgInput.style.borderColor = "#6366f1";
    };
    reader.readAsDataURL(file);
  }
});

const msgForm = document.getElementById("msg-form");
const msgInput = document.getElementById("msg-input");
const chatBox = document.getElementById("chat-box");

msgForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawTextValue = msgInput.value.trim();

  if (!rawTextValue && !pendingChatImageBase64) return;
  if (!currentUser) return;

  let endpoint = `${BACKEND_URL}/messages/send`;
  let payload = {
    sender_id: currentUser.id,
    message_text: rawTextValue,
    image_url: pendingChatImageBase64,
  };

  if (currentChatMode === "direct") {
    payload.receiver_id = activeRecipientId;
  } else {
    endpoint = `${BACKEND_URL}/messages/groups/send`;
    payload.group_id = activeGroupId;
  }

  appendMessage({
    username: currentUser.username,
    text: rawTextValue,
    image_url: pendingChatImageBase64,
    time: getCleanSystemTime(),
    type: "outgoing",
  });

  msgInput.value = "";
  msgInput.placeholder = "Type a message...";
  msgInput.style.borderColor = "";
  pendingChatImageBase64 = null;
  chatImgInput.value = "";

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(err);
  }
});

function startMessagePolling() {
  fetchIncomingPacketsFromServer();
  msgPollInterval = setInterval(() => {
    loadDirectoryDataStream();
    fetchIncomingPacketsFromServer();
  }, 4000);
}

async function fetchIncomingPacketsFromServer() {
  if (!currentUser) return;

  let url = `${BACKEND_URL}/messages/history?sender_id=${currentUser.id}&receiver_id=${activeRecipientId}`;
  if (currentChatMode === "group") {
    if (!activeGroupId) return;
    url = `${BACKEND_URL}/messages/groups/history?group_id=${activeGroupId}`;
  } else {
    if (!activeRecipientId) return;
  }

  try {
    const response = await fetch(url);
    if (response.ok) {
      const messages = await response.json();
      chatBox.innerHTML = "";

      messages.forEach((msg) => {
        const isOutgoing = msg.sender_id === currentUser.id;
        appendMessage({
          username:
            msg.username || (isOutgoing ? currentUser.username : "Contact"),
          text: msg.message_text,
          image_url: msg.image_url,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: isOutgoing ? "outgoing" : "incoming",
        });
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadDirectoryDataStream() {
  if (!currentUser) return;

  if (currentChatMode === "direct") {
    try {
      const response = await fetch(
        `${BACKEND_URL}/users?current_user_id=${currentUser.id}`,
      );
      if (response.ok) {
        const users = await response.json();
        const container = document.querySelector(".user-list");
        container.innerHTML = "";

        users.forEach((user) => {
          if (user.id === currentUser.id) return;
          if (!activeRecipientId) activeRecipientId = user.id;

          const li = document.createElement("li");
          li.className = `user-item ${user.id === activeRecipientId ? "active" : ""}`;

          let color = user.status === "Online" ? "#10b981" : "#8b949e";
          li.innerHTML = `
            <span class="user-avatar" style="position:relative;">
              <span style="position:absolute; bottom:0; right:0; width:10px; height:10px; background:${color}; border-radius:50%; border:2px solid #13151a;"></span>
            </span>
            <div class="user-info">
              <span class="user-name">${user.username}</span>
              <span class="user-status">${user.status} — ${user.bio || "Available"}</span>
            </div>
          `;

          li.addEventListener("click", () => {
            activeRecipientId = user.id;
            document.querySelector(".chat-header h3").textContent =
              `Chat with ${user.username}`;
            loadDirectoryDataStream();
            fetchIncomingPacketsFromServer();
          });
          container.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    try {
      const response = await fetch(
        `${BACKEND_URL}/messages/groups/list?user_id=${currentUser.id}`,
      );
      if (response.ok) {
        const groups = await response.json();
        const container = document.querySelector(".user-list");
        container.innerHTML = "";

        groups.forEach((group) => {
          if (!activeGroupId) activeGroupId = group.id;

          const li = document.createElement("li");
          li.className = `user-item ${group.id === activeGroupId ? "active" : ""}`;
          li.innerHTML = `
            <span class="user-avatar" style="background:#4f46e5; display:flex; align-items:center; justify-content:center; font-weight:bold;">G</span>
            <div class="user-info">
              <span class="user-name">${group.group_name}</span>
              <span class="user-status">Group Chat</span>
            </div>
          `;

          li.addEventListener("click", () => {
            activeGroupId = group.id;
            document.querySelector(".chat-header h3").textContent =
              `Group: ${group.group_name}`;
            loadDirectoryDataStream();
            fetchIncomingPacketsFromServer();
          });
          container.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}

document.getElementById("tab-direct").addEventListener("click", function () {
  currentChatMode = "direct";
  this.className = "btn btn-primary";
  document.getElementById("tab-groups").className = "btn btn-secondary";
  loadDirectoryDataStream();
  fetchIncomingPacketsFromServer();
});

document.getElementById("tab-groups").addEventListener("click", function () {
  currentChatMode = "group";
  this.className = "btn btn-primary";
  document.getElementById("tab-direct").className = "btn btn-secondary";
  loadDirectoryDataStream();
  fetchIncomingPacketsFromServer();
});

document.getElementById("new-group-btn").addEventListener("click", async () => {
  const name = prompt("Enter a name for your new group chat:");
  if (!name) return;

  try {
    const res = await fetch(`${BACKEND_URL}/users`);
    const users = await res.json();
    const targets = users
      .filter((u) => u.id !== currentUser.id)
      .map((u) => u.id);

    await fetch(`${BACKEND_URL}/messages/groups/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_name: name,
        created_by: currentUser.id,
        user_ids: targets,
      }),
    });
    loadDirectoryDataStream();
  } catch (err) {
    console.error(err);
  }
});

function appendMessage({ username, text, image_url, time, type }) {
  const msgBubbleNode = document.createElement("div");
  msgBubbleNode.className = `message ${type}`;

  let imgTag = image_url
    ? `<img src="${image_url}" style="max-width:100%; border-radius:8px; margin-top:5px; display:block;" />`
    : "";
  let nameTag =
    currentChatMode === "group" && type === "incoming"
      ? `<strong style="font-size:11px; color:#6366f1; display:block; margin-bottom:2px;">${username}</strong>`
      : "";

  msgBubbleNode.innerHTML = `
    ${nameTag}
    <p>${text}</p>
    ${imgTag}
    <span class="msg-time">${time}</span>
  `;
  chatBox.appendChild(msgBubbleNode);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function populateProfileForm() {
  if (!currentUser) return;
  document.getElementById("profile-name").value = currentUser.username || "";
  document.getElementById("email").value = currentUser.email || "";
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

const logoutButton = document.getElementById("logout-btn");
logoutButton.addEventListener("click", () => {
  currentUser = null;
  document.getElementById("login-form").reset();
  document.getElementById("signup-form").reset();
  navigateTo("auth");
});

// Tabs and forms
const loginBtn = document.getElementById("loginTab");
const registerBtn = document.getElementById("registerTab");

const loginFormEl = document.getElementById("loginForm");
const registerFormEl = document.getElementById("registerForm");

const authContainer = document.getElementById("authSection");
const dashboardContainer = document.getElementById("appSection");

const adminLabel = document.getElementById("adminName");
const logoutBtn = document.getElementById("logoutButton");

const alertBox = document.getElementById("message");

const STORAGE_KEY = "inventory-token";


// Display messages
function displayMessage(message, type = "success") {

  alertBox.textContent = message;
  alertBox.className = `message show ${type}`;

  setTimeout(() => {
    alertBox.className = "message";
  }, 3000);
}


// Save token
function storeToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}


// Get token
function readToken() {
  return localStorage.getItem(STORAGE_KEY);
}


// Remove token
function removeToken() {
  localStorage.removeItem(STORAGE_KEY);
}


// Switch login/register tabs
function changeTab(tabName) {

  if (tabName === "login") {

    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");

    loginFormEl.classList.remove("hidden");
    registerFormEl.classList.add("hidden");

  } else {

    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");

    registerFormEl.classList.remove("hidden");
    loginFormEl.classList.add("hidden");
  }
}


// Show dashboard or auth section
function updateScreen(isLoggedIn) {

  if (isLoggedIn) {

    authContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");

  } else {

    authContainer.classList.remove("hidden");
    dashboardContainer.classList.add("hidden");
  }
}


// Logout
function logoutUser() {

  removeToken();

  updateScreen(false);

  displayMessage("Logged out");
}


// Events
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    changeTab("login");
  });
}

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    changeTab("register");
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}
const BASE_URL = ".";


// Common fetch request
async function apiRequest(url, method, bodyData = null, useToken = false) {

  const headers = {
    "Content-Type": "application/json"
  };

  if (useToken) {

    const token = readToken();

    if (!token) {
      throw new Error("Login required");
    }

    headers.Authorization = token;
  }

  const options = {
    method,
    headers
  };

  if (bodyData) {
    options.body = JSON.stringify(bodyData);
  }

  const response = await fetch(`${BASE_URL}/${url}`, options);

  return await response.json();
}


// Register user
async function registerUser(e) {

  e.preventDefault();

  const username =
    document.getElementById("registerUsername").value.trim();

  const password =
    document.getElementById("registerPassword").value.trim();

  if (username === "" || password === "") {

    displayMessage("Please fill all fields", "error");

    return;
  }

  try {

    const result = await apiRequest(
      "register.php",
      "POST",
      {
        username,
        password
      }
    );

    if (result.status === "success") {

      displayMessage("Registration completed");

      registerFormEl.reset();

      changeTab("login");

    } else {

      displayMessage("Username already exists", "error");
    }

  } catch (err) {

    displayMessage("Something went wrong", "error");
  }
}


// Login user
async function loginUser(e) {

  e.preventDefault();

  const username =
    document.getElementById("loginUsername").value.trim();

  const password =
    document.getElementById("loginPassword").value.trim();

  if (username === "" || password === "") {

    displayMessage("Please fill all fields", "error");

    return;
  }

  try {

    const result = await apiRequest(
      "login.php",
      "POST",
      {
        username,
        password
      }
    );

    if (result.status === "success") {

      storeToken(result.token);

      displayMessage("Login successful");

      loginFormEl.reset();

      loadApplication();

    } else {

      displayMessage("Invalid username or password", "error");
    }

  } catch (err) {

    displayMessage("Login failed", "error");
  }
}


// Events
if (loginFormEl) {
  loginFormEl.addEventListener("submit", loginUser);
}

if (registerFormEl) {
  registerFormEl.addEventListener("submit", registerUser);
}
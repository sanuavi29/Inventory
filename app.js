const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const taskForm = document.getElementById('taskForm');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const taskList = document.getElementById('taskList');
const adminNameLabel = document.getElementById('adminName');
const logoutButton = document.getElementById('logoutButton');
const messageBox = document.getElementById('message');

const apiBase = '.';
const authTokenKey = 'task-app-token';

function showMessage(text, type = 'success') {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
  setTimeout(() => {
    messageBox.className = 'message';
  }, 3500);
}

function setAuthState(isLoggedIn) {
  if (authSection) authSection.classList.toggle('hidden', isLoggedIn);
  if (appSection) appSection.classList.toggle('hidden', !isLoggedIn);
  const mainSection = document.querySelector('main');
  if (mainSection) mainSection.classList.toggle('dashboard-mode', isLoggedIn);
}

function getToken() {
  return localStorage.getItem(authTokenKey);
}

function saveToken(token) {
  localStorage.setItem(authTokenKey, token);
}

function clearToken() {
  localStorage.removeItem(authTokenKey);
}

function setActiveTab(tabName) {
  const isLogin = tabName === 'login';
  if (loginTab) loginTab.classList.toggle('active', isLogin);
  if (registerTab) registerTab.classList.toggle('active', !isLogin);
  if (loginForm) loginForm.classList.toggle('hidden', !isLogin);
  if (registerForm) registerForm.classList.toggle('hidden', isLogin);
}

async function requestJson(path, method = 'GET', payload = null, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  if (useAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required.');
    }
    headers.Authorization = token;
  }

  const response = await fetch(`${apiBase}/${path}`, options);
  return response.json();
}

function validateCredentials(username, password) {
  if (!username || !password) {
    showMessage('Please complete both fields.', 'error');
    return false;
  }
  return true;
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  if (!validateCredentials(username, password)) {
    return;
  }

  try {
    const result = await requestJson('register.php', 'POST', { username, password });
    if (result.status === 'success') {
      showMessage('Registration successful. Please login.');
      setActiveTab('login');
      if (registerForm) registerForm.reset();
    } else {
      showMessage('Registration failed. Username may already exist.', 'error');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!validateCredentials(username, password)) {
    return;
  }

  try {
    const result = await requestJson('login.php', 'POST', { username, password });
    if (result.status === 'success' && result.token) {
      saveToken(result.token);
      showMessage('Login successful. Loading inventory...');
      if (loginForm) loginForm.reset();
      initializeApp();
    } else {
      showMessage('Login failed. Check your credentials.', 'error');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function parseServerResponse(response) {
  if (!response) {
    return { tasks: [], user: null };
  }

  if (Array.isArray(response)) {
    return { tasks: response, user: null };
  }

  return {
    tasks: Array.isArray(response.tasks) ? response.tasks : [],
    user: response.user || null,
  };
}

async function loadTasks() {
  try {
    const response = await requestJson('get_task.php', 'GET', null, true);
    const { tasks, user } = parseServerResponse(response);

    if (user && adminNameLabel) {
      adminNameLabel.textContent = user.username || user.name || 'Admin';
    }

    if (taskForm) {
      taskForm.classList.toggle('hidden', !(user && user.role === 'admin'));
    }

    renderTasks(tasks);
  } catch (error) {
    showMessage('Unable to load tasks. Please login again.', 'error');
    clearToken();
    setAuthState(false);
  }
}

function renderTasks(tasks) {
  if (!taskList) return;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    taskList.innerHTML = '<tr><td colspan="4" class="empty-message">No products yet. Add one above.</td></tr>';
    return;
  }

  taskList.innerHTML = tasks
    .map((row) => createTaskRow(row))
    .join('');
}

function createTaskRow(row) {
  let item = { name: '', price: 0 };

  try {
    item = JSON.parse(row.task);
  } catch (error) {
    item = { name: String(row.task), price: 0 };
  }

  const id = escapeHtml(String(row.id || ''));
  const name = escapeHtml(item.name || '');
  const price = parseFloat(item.price || 0).toFixed(2);

  return `
    <tr>
      <td>${id}</td>
      <td>${name}</td>
      <td>$${price}</td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function handleAddTask(event) {
  event.preventDefault();

  const name = productNameInput.value.trim();
  const price = Number(productPriceInput.value) || 0;

  if (!name) {
    showMessage('Please enter product name.', 'error');
    return;
  }

  const product = { name, price };

  try {
    const result = await requestJson('add_task.php', 'POST', { task: JSON.stringify(product) }, true);
    if (result.status === 'task added') {
      if (productNameInput) productNameInput.value = '';
      if (productPriceInput) productPriceInput.value = '';
      showMessage('Item added successfully.');
      loadTasks();
    } else if (result.status === 'forbidden') {
      showMessage('Only admin users can add items.', 'error');
    } else {
      showMessage('Unable to add item.', 'error');
    }
  } catch (error) {
    showMessage('Unable to add item. Please login again.', 'error');
    clearToken();
    setAuthState(false);
  }
}

function handleLogout() {
  clearToken();
  setAuthState(false);
  showMessage('Logged out successfully.');
}

function initializeApp() {
  const token = getToken();
  if (token) {
    setAuthState(true);
    loadTasks();
  } else {
    setAuthState(false);
  }
}

function addListeners() {
  if (loginTab) loginTab.addEventListener('click', () => setActiveTab('login'));
  if (registerTab) registerTab.addEventListener('click', () => setActiveTab('register'));
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (taskForm) taskForm.addEventListener('submit', handleAddTask);
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);

  const showRegisterLink = document.getElementById('showRegisterLink');
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveTab('register');
      window.scrollTo(0, 0);
    });
  }

  const showLoginLink = document.getElementById('showLoginLink');
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveTab('login');
      window.scrollTo(0, 0);
    });
  }
}

addListeners();
initializeApp();      
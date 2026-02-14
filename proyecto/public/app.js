const API = window.location.protocol === "file:" ? "http://localhost:5000" : "";
const LS_TOKEN_KEY = "token";
let editingId = null;

function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(LS_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(LS_TOKEN_KEY);
}

function showLogin() {
  document.getElementById("section-login").style.display = "block";
  document.getElementById("section-products").style.display = "none";
  loadLoginLogs();
}

function showProducts() {
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-products").style.display = "block";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return String(str).replaceAll("'", "\\'");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("es-MX");
}

function renderLoginLogs(logs) {
  const container = document.getElementById("login-log-list");
  if (!container) return;

  if (!logs.length) {
    container.innerHTML = `<div class="login-log-empty">Sin registros</div>`;
    return;
  }

  container.innerHTML = "";

  logs.forEach((log) => {
    const div = document.createElement("div");
    div.className = "login-log-item";
    div.innerHTML = `
      <div class="login-log-user">${escapeHtml(log.usuario)}</div>
      <div class="login-log-date">${formatDateTime(log.createdAt)}</div>
    `;
    container.appendChild(div);
  });
}

async function loadLoginLogs() {
  const container = document.getElementById("login-log-list");
  if (!container) return;

  const res = await fetch(API + "/auth/logins?limit=10");
  const data = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(data)) {
    container.innerHTML = `<div class="login-log-empty">No se pudieron cargar</div>`;
    return;
  }

  renderLoginLogs(data);
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function register() {
  const usuario = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  });

  const data = await res.json();
  if (!res.ok) {
    alert("Error: " + (data.mensaje || "No se pudo registrar"));
    return;
  }

  setToken(data.token);
  showProducts();
  await loadProducts();
}

async function login() {
  const usuario = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, password })
  });

  const data = await res.json();
  if (!res.ok) {
    alert("Error: " + (data.mensaje || "Credenciales invalidas"));
    return;
  }

  setToken(data.token);
  showProducts();
  await loadProducts();
}

function logout() {
  clearToken();
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  if (usernameInput) usernameInput.value = "";
  if (passwordInput) passwordInput.value = "";
  showLogin();
}

async function loadProducts() {
  const { res, data } = await apiFetch(API + "/products");

  if (res.status === 401) {
    logout();
    return;
  }

  if (!res.ok) {
    alert("Error: " + (data.mensaje || "No se pudo cargar productos"));
    return;
  }

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach((p) => {
    const div = document.createElement("div");
    div.className = "item";
    const createdAtText = formatDateTime(p.createdAt);
    const showUpdated = p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt;
    const updatedAtText = showUpdated ? formatDateTime(p.updatedAt) : "";
    const createdByUser = p.createdBy && p.createdBy.usuario ? p.createdBy.usuario : "N/A";
    const updatedByUser = p.updatedBy && p.updatedBy.usuario ? p.updatedBy.usuario : "N/A";

    div.innerHTML = `
      <div class="item-main">
        <div class="item-title">${escapeHtml(p.name)}</div>
        <div class="item-meta">
          <span>$${Number(p.price).toFixed(2)}</span>
          <span>Stock: ${p.stock}</span>
        </div>
        <div class="item-meta">
          <span>Creado por: ${escapeHtml(createdByUser)}</span>
          ${showUpdated ? `<span>Actualizado por: ${escapeHtml(updatedByUser)}</span>` : ""}
        </div>
        <div class="item-meta">
          <span>Creado: ${createdAtText}</span>
          ${showUpdated ? `<span>Actualizado: ${updatedAtText}</span>` : ""}
        </div>
        <div class="item-desc">${escapeHtml(p.description || "")}</div>
      </div>
      <div class="item-actions">
        <button class="btn secondary" data-edit="1"
          data-id="${p._id}"
          data-name="${escapeAttr(p.name)}"
          data-price="${p.price}"
          data-stock="${p.stock}"
        >Editar</button>
        <button class="btn danger" data-del="1" data-id="${p._id}">Eliminar</button>
      </div>
    `;

    list.appendChild(div);
  });
}

async function createProduct() {
  const name = document.getElementById("p-name").value.trim();
  const price = Number(document.getElementById("p-price").value);
  const stock = Number(document.getElementById("p-stock").value);
  const description = document.getElementById("p-desc").value.trim();

  const { res, data } = await apiFetch(API + "/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock, description })
  });

  if (!res.ok) {
    alert("Error: " + (data.mensaje || "No se pudo crear"));
    return;
  }

  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  document.getElementById("p-stock").value = "";
  document.getElementById("p-desc").value = "";

  await loadProducts();
}

async function removeProduct(id) {
  if (!confirm("Eliminar producto?")) return;

  const { res, data } = await apiFetch(API + "/products/" + id, { method: "DELETE" });

  if (!res.ok) {
    alert("Error: " + (data.mensaje || "No se pudo eliminar"));
    return;
  }

  await loadProducts();
}

function openEdit(id, name, price, stock) {
  editingId = id;
  document.getElementById("e-name").value = name;
  document.getElementById("e-price").value = price;
  document.getElementById("e-stock").value = stock;
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  editingId = null;
  document.getElementById("modal").style.display = "none";
}

async function saveEdit() {
  if (!editingId) return;

  const name = document.getElementById("e-name").value.trim();
  const price = Number(document.getElementById("e-price").value);
  const stock = Number(document.getElementById("e-stock").value);

  const { res, data } = await apiFetch(API + "/products/" + editingId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock })
  });

  if (!res.ok) {
    alert("Error: " + (data.mensaje || "No se pudo actualizar"));
    return;
  }

  closeModal();
  await loadProducts();
}

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("registerBtn").addEventListener("click", register);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("createBtn").addEventListener("click", createProduct);
  document.getElementById("cancelEditBtn").addEventListener("click", closeModal);
  document.getElementById("saveEditBtn").addEventListener("click", saveEdit);

  document.getElementById("list").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.del) {
      removeProduct(btn.dataset.id);
      return;
    }

    if (btn.dataset.edit) {
      openEdit(
        btn.dataset.id,
        btn.dataset.name,
        btn.dataset.price,
        btn.dataset.stock
      );
    }
  });

  if (getToken()) {
    showProducts();
    await loadProducts();
  } else {
    showLogin();
  }

  loadLoginLogs();
});

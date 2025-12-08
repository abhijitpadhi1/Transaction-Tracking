// =============== GLOBAL API CONFIG ===============
// Single source of truth for API base URL. Other scripts should reference
// `window.API_BASE_URL` to build endpoint URLs.
window.API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";

// Backwards-compatible alias for scripts that expect BASE_URL
window.BASE_URL = window.API_BASE_URL;

// ----------- Token Helpers -----------
function getToken() {
  return localStorage.getItem("access_token");
}

function saveToken(token) {
  localStorage.setItem("access_token", token);
}

function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

// ----------- Auth Guard -----------
function ensureAuthenticated() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

// Auto-run ensureAuthenticated on pages that opt-in by setting
// <body data-require-auth="true">. This keeps HTML cleaner (no inline
// <script>ensureAuthenticated()</script>) and ensures auth check runs
// after the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (document.body && document.body.dataset.requireAuth === "true") {
      ensureAuthenticated();
    }
  } catch (e) {
    // ignore
  }
});

// ----------- API Fetch Wrapper -----------
async function apiRequest(endpoint, method = "GET", body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  // Auto logout on invalid token
  if (response.status === 401) {
    logout();
    return;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

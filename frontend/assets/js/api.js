// =============== GLOBAL API CONFIG ===============
// Single source of truth for API base URL. Other scripts should reference
// `window.API_BASE_URL` to build endpoint URLs.
// Determine a sensible default API base:
// - If a consumer already set window.API_BASE_URL, respect it.
// - If running on localhost, default to the local backend port.
// - Otherwise default to the current origin (useful when frontend is
//   served together with the backend or hosted on the deployed space).
(function () {
  if (window.API_BASE_URL) {
    // already configured externally
    return;
  }

  try {
    const host = window.location && window.location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      window.API_BASE_URL = "http://127.0.0.1:8000";
    } else if (
      window.location &&
      window.location.origin &&
      window.location.origin !== "null"
    ) {
      // When the frontend is loaded from a non-local origin (e.g. deployed space),
      // default to that origin so relative requests go to the same host.
      window.API_BASE_URL = window.location.origin;
    } else {
      // Fallback to localhost backend
      window.API_BASE_URL = "http://127.0.0.1:8000";
    }
  } catch (e) {
    window.API_BASE_URL = "http://127.0.0.1:8000";
  }
})();

// Backwards-compatible alias for scripts that expect BASE_URL
window.BASE_URL = window.API_BASE_URL;

// Expose a debug hint so you can inspect the base used in any client quickly
console.info("API base:", window.API_BASE_URL);

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

// Make token helpers available explicitly on window for environments where
// module scoping or ordering might be different (helps debugging on phones).
window.getToken = getToken;
window.saveToken = saveToken;
window.logout = logout;

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

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    // Auto logout on invalid token
    if (response.status === 401) {
      logout();
      return { error: "unauthorized" };
    }

    // Try to parse JSON, but return the response object on parse failure
    try {
      return await response.json();
    } catch (err) {
      console.warn(
        "apiRequest: failed to parse JSON from",
        `${BASE_URL}${endpoint}`,
        err
      );
      return null;
    }
  } catch (err) {
    // Network-level error (DNS, CORS preflight blocked, offline, etc.)
    console.error(
      "apiRequest network error for",
      `${BASE_URL}${endpoint}`,
      err
    );
    throw err; // keep behaviour consistent so callers can catch and show UI errors
  }
}

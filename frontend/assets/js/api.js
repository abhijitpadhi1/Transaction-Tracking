// =============== GLOBAL API CONFIG ===============
(function () {
  if (window.API_BASE_URL) {
    // already configured externally
    return;
  }

  try {
    const host = window.location && window.location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      window.API_BASE_URL = "http://127.0.0.1:7860";
    } else if (
      window.location &&
      window.location.origin &&
      window.location.origin !== "null"
    ) {
      window.API_BASE_URL = window.location.origin;
    } else {
      // Fallback to localhost backend
      window.API_BASE_URL = "http://127.0.0.1:7860";
    }
  } catch (e) {
    window.API_BASE_URL = "http://127.0.0.1:7860";
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

window.getToken = getToken;
window.saveToken = saveToken;
window.logout = logout;

// ----------- Auth Guard -----------
function ensureAuthenticated() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}

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
    throw err;
  }
}

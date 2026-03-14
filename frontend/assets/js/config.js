// ======================================
// Environment Detection & API Base URL
// ======================================

// Detect if running locally
const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// Determine API base URL
// Local: use FastAPI running on port 7860
// Production (HuggingFace Space or any hosted domain): use same origin
window.API_BASE_URL = isLocalhost
  ? "http://127.0.0.1:7860"
  : window.location.origin;

// Backwards-compatible alias if other scripts use BASE_URL
window.BASE_URL = window.API_BASE_URL;

// Debug output so you can verify in browser console
console.info("API Base URL:", window.API_BASE_URL);

// Detect environment automatically
const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

// IMPORTANT: Replace this with your actual HF space URL
const HF_BASE_URL = "https://abhijitpadhi1-transaction-tracking.hf.space/";

// Final BASE_URL which all other JS files should use
window.API_BASE_URL = isLocalhost
  ? "http://127.0.0.1:8000"
  : HF_BASE_URL.replace(/\/$/, "");

// console.log("API Base URL:", BASE_URL);

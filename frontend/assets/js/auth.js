// =============================
// Inline form error helpers
// =============================
function showFormError(elId, message) {
  const els = document.querySelectorAll(`#${elId}`);
  if (els.length) {
    els.forEach((el) => {
      el.textContent = message;
      el.style.display = "block";
    });
  } else {
    // Fallback to alert when the page doesn't include an error container
    alert(message);
  }
}

function clearFormError(elId) {
  const els = document.querySelectorAll(`#${elId}`);
  els.forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });
}

// =============================
// SIGNUP
// =============================
async function signup() {
  const args = arguments[0];
  let username, email, password, confirmPassword, currency;

  if (args && typeof args === "object") {
    username = args.userid || args.userId || "";
    email = args.email || "";
    password = args.password || "";
    confirmPassword = args.confirmPassword || "";
    currency = args.currency || args.preferred_currency || "INR";
  } else {
    // Desktop Layout
    username = (document.getElementById("userid") || {}).value || "";
    email = (document.getElementById("email") || {}).value || "";
    password = (document.getElementById("password") || {}).value || "";
    confirmPassword =
      (document.getElementById("confirmPassword") || {}).value || "";
    currency = (document.getElementById("currency") || {}).value || "INR";

    // Mobile fallbacks
    if (!username)
      username =
        (document.getElementById("useridMobile") || {}).value || username;
    if (!email)
      email = (document.getElementById("emailMobile") || {}).value || email;
    if (!password)
      password =
        (document.getElementById("passwordMobile") || {}).value || password;
    if (!confirmPassword)
      confirmPassword =
        (document.getElementById("confirmPasswordMobile") || {}).value ||
        confirmPassword;
    if (!currency)
      currency =
        (document.getElementById("currencyMobile") || {}).value || currency;
  }

  clearFormError("signupError");
  if (!username || !email || !password) {
    showFormError("signupError", "Please fill in required fields.");
    return;
  }

  if (password !== confirmPassword) {
    showFormError("signupError", "Passwords do not match.");
    return;
  }

  // Signup Data object
  const signupData = {
    username: username,
    email: email,
    password: password,
    preferred_currency: currency,
  };

  try {
    const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData),
    });

    const data = await response.json();

    if (!response.ok) {
      showFormError("signupError", data.detail || "Signup failed.");
      return;
    }

    alert("Account created successfully! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Signup error:", err);
    showFormError("signupError", "Signup failed due to network error.");
  }
}

// =============================
// LOGIN
// =============================
async function login() {
  // Accept optional credentials object (login({username, password})) from login.html scripts
  const args = arguments[0];
  let username, password;

  if (args && typeof args === "object") {
    username = args.username || args.emailOrUserid || "";
    password = args.password || "";
  } else {
    // Try several common DOM ids used across forms
    username =
      (document.getElementById("emailOrUserid") || {}).value ||
      (document.getElementById("emailOrUseridMobile") || {}).value ||
      (document.getElementById("userid") || {}).value ||
      "";
    password =
      (document.getElementById("password") || {}).value ||
      (document.getElementById("passwordMobile") || {}).value ||
      "";
  }

  clearFormError("loginError");
  if (!username || !password) {
    showFormError("loginError", "Please enter username and password.");
    return;
  }

  const loginData = { username, password };

  try {
    const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
      showFormError("loginError", data.detail || "Invalid login credentials.");
      return;
    }

    saveToken(data.access_token);
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    showFormError("loginError", "Login failed due to network error.");
  }
}

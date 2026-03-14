// API Base URL
const API_BASE_URL =
  (window.API_BASE_URL || "http://127.0.0.1:7860") + "/transactions";

// Get authentication token from localStorage
function getAuthToken() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    // Redirect to login if no token
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    Food: "fa-utensils",
    Groceries: "fa-shopping-cart",
    Work: "fa-briefcase",
    Home: "fa-home",
    Travel: "fa-plane",
    Investment: "fa-chart-line",
    Transport: "fa-car",
    Entertainment: "fa-film",
    Health: "fa-heart",
    Gifts: "fa-gift",
    Education: "fa-graduation-cap",
    Shopping: "fa-shopping-bag",
    Bills: "fa-file-invoice",
    Other: "fa-ellipsis-h",
    Salary: "fa-money-bill-alt",
    PocketMoney: "fa-rupee-sign",
    Work: "fa-briefcase",
    Freelance: "fa-laptop",
    Business: "fa-briefcase",
  };

  // Try to match category (case-insensitive)
  const categoryLower = category.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (categoryLower.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "fa-circle"; // Default icon
}

// Load summary data
async function loadSummary() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to load summary");
    }

    const data = await response.json();

    // Update desktop values
    const balance = data.balance || 0;
    const income = data.total_income || 0;
    const expense = data.total_expense || 0;

    document.getElementById("totalBalance").textContent =
      formatCurrency(balance);
    document.getElementById("monthlyIncome").textContent =
      formatCurrency(income);
    document.getElementById("monthlyExpense").textContent =
      formatCurrency(expense);

    // Update mobile values
    document.getElementById("totalBalanceMobile").textContent =
      formatCurrency(balance);
    document.getElementById("monthlyIncomeMobile").textContent =
      formatCurrency(income);
    document.getElementById("monthlyExpenseMobile").textContent =
      formatCurrency(expense);

    // Calculate balance change (placeholder - would need previous month data)
    const balanceChange = balance > 0 ? balance * 0.1 : 0; // Placeholder calculation
    const balanceChangePercent = balance > 0 ? 10 : 0; // Placeholder
    document.getElementById("balanceChange").textContent = `${formatCurrency(
      balanceChange
    )} (${balanceChangePercent}%) vs. last month`;

    // Update expense remaining using configured budget (default 2000)
    const budget =
      typeof window.getBudget === "function"
        ? window.getBudget()
        : Number(localStorage.getItem("budget")) || 2000;
    const expenseRemaining = Math.max(0, budget - expense);
    document.getElementById(
      "expenseRemaining"
    ).textContent = `Remaining: ${formatCurrency(expenseRemaining)}`;

    // Update income expected (placeholder)
    document.getElementById(
      "incomeExpected"
    ).textContent = `Expected: ${formatCurrency(income * 0.96)}`; // Placeholder

    // Update savings progress (placeholder)
    const savingsGoal = 1000;
    const savingsAmount = Math.max(0, balance * 0.65); // Placeholder
    const savingsPercent = Math.min(
      100,
      Math.round((savingsAmount / savingsGoal) * 100)
    );
    document.getElementById(
      "savingsProgress"
    ).textContent = `${savingsPercent}%`;
    document.getElementById("savingsAmount").textContent = `${formatCurrency(
      savingsAmount
    )} / ${formatCurrency(savingsGoal)} Saved`;
  } catch (error) {
    console.error("Error loading summary:", error);
  }
}

// Load recent transactions
async function loadRecentTransactions() {
  try {
    const token = getAuthToken();
    if (!token) return;

    // Fetch recent transactions
    const response = await fetch(`${API_BASE_URL}/recent`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Access Check
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to load recent transactions");
    }

    const transactions = await response.json();

    // Update desktop table
    const desktopTable = document.getElementById("recentTransactions");
    if (transactions.length === 0) {
      desktopTable.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-gray-400">No transactions yet</td>
        </tr>
      `;
    } else {
      desktopTable.innerHTML = transactions
        .map((tx) => {
          const isIncome = tx.type === "income";
          const amountColor = isIncome ? "text-green-500" : "text-red-500";
          const amountSign = isIncome ? "+" : "-";
          const icon = getCategoryIcon(tx.category);

          return `
          <tr class="hover:bg-gray-800">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatDate(
              tx.date
            )}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-2">
                <i class="fas ${icon} text-gray-400"></i>
                <span class="text-sm text-gray-300">${tx.category}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-300">${
              tx.note || tx.category
            }</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm ${
                isIncome ? "text-green-500" : "text-red-500"
              }">
                ${tx.type}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${amountColor}">
              ${amountSign} ${formatCurrency(Math.abs(tx.amount))}
            </td>
          </tr>
        `;
        })
        .join("");
    }

    // Update mobile list
    const mobileList = document.getElementById("recentTransactionsMobile");
    if (transactions.length === 0) {
      mobileList.innerHTML = `
        <div class="text-gray-400 text-center py-8">No transactions yet</div>
      `;
    } else {
      mobileList.innerHTML = transactions
        .map((tx) => {
          const isIncome = tx.type === "income";
          const amountColor = isIncome ? "text-green-500" : "text-red-500";
          const icon = getCategoryIcon(tx.category);

          return `
          <div class="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center space-x-4">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="fas ${icon} text-white text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium truncate">${
                tx.note || tx.category
              }</p>
              ${
                tx.note
                  ? `<p class="text-gray-400 text-xs truncate">${tx.category}</p>`
                  : ""
              }
            </div>
            <div class="text-right">
              <p class="${amountColor} font-bold">${formatCurrency(
            tx.amount
          )}</p>
            </div>
          </div>
        `;
        })
        .join("");
    }
  } catch (error) {
    console.error("Error loading recent transactions:", error);
    const desktopTable = document.getElementById("recentTransactions");
    const mobileList = document.getElementById("recentTransactionsMobile");
    desktopTable.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading transactions</td>
      </tr>
    `;
    mobileList.innerHTML = `
      <div class="text-red-400 text-center py-8">Error loading transactions</div>
    `;
  }
}

// Decode JWT payload (without verification - just for display)
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Load user info from JWT token
function loadUserInfo() {
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = decodeJWT(token);
      if (payload && payload.username) {
        const username = payload.username;
        document.getElementById("userName").textContent = username;
        document.getElementById(
          "welcomeText"
        ).textContent = `Welcome, ${username}!`;
      } else {
        // Fallback
        document.getElementById("userName").textContent = "User";
        document.getElementById("welcomeText").textContent = "Welcome!";
      }
    }
  } catch (error) {
    console.error("Error loading user info:", error);
    document.getElementById("userName").textContent = "User";
    document.getElementById("welcomeText").textContent = "Welcome!";
  }
}

// Initialize dashboard
async function initDashboard() {
  loadUserInfo();
  await loadSummary();
  await loadRecentTransactions();
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}

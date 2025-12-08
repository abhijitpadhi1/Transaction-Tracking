// API Base URL
const API_BASE_URL =
  (window.API_BASE_URL || "http://127.0.0.1:8000") + "/transactions";
const CATEGORIES_API =
  (window.API_BASE_URL || "http://127.0.0.1:8000") + "/categories";

// State
let allTransactions = [];
let filteredTransactions = [];
let currentDateFilter = "monthly";
let currentTypeFilter = "all";
let currentCategoryFilter = "all";
let currentSearchQuery = "";
let currentCalendarDate = new Date();

// Get authentication token
function getAuthToken() {
  const token = localStorage.getItem("access_token");
  if (!token) {
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    Food: "fa-utensils",
    "Food & Dining": "fa-utensils",
    Groceries: "fa-shopping-cart",
    Shopping: "fa-shopping-bag",
    Work: "fa-briefcase",
    Freelance: "fa-briefcase",
    Home: "fa-home",
    Rent: "fa-building",
    Transport: "fa-car",
    Transportation: "fa-car",
    Travel: "fa-plane",
    Health: "fa-heart",
    Entertainment: "fa-film",
    Education: "fa-graduation-cap",
    Gifts: "fa-gift",
    Salary: "fa-dollar-sign",
    Investment: "fa-chart-line",
    Investments: "fa-chart-line",
    Café: "fa-coffee",
    Books: "fa-book",
    Donation: "fa-heart",
    Apparel: "fa-tshirt",
  };

  const categoryLower = category.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (categoryLower.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "fa-circle";
}

// Group transactions by date
function groupTransactionsByDate(transactions) {
  const grouped = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0);

    let groupKey;
    if (txDate.getTime() === today.getTime()) {
      groupKey = "Today";
    } else if (txDate.getTime() === yesterday.getTime()) {
      groupKey = "Yesterday";
    } else if (txDate >= lastWeek) {
      groupKey = "Last Week";
    } else {
      // Format as date string
      groupKey = txDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(tx);
  });

  // Sort groups by date (most recent first)
  const sortedGroups = {};
  const groupOrder = ["Today", "Yesterday", "Last Week"];
  groupOrder.forEach((key) => {
    if (grouped[key]) {
      sortedGroups[key] = grouped[key];
    }
  });

  // Add remaining groups sorted by date
  Object.keys(grouped)
    .filter((key) => !groupOrder.includes(key))
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    })
    .forEach((key) => {
      sortedGroups[key] = grouped[key];
    });

  return sortedGroups;
}

// Load transaction history
async function loadHistory() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
      }
      throw new Error("Failed to load history");
    }

    const groupedData = await response.json();

    // Flatten grouped data into array
    allTransactions = [];
    Object.values(groupedData).forEach((group) => {
      allTransactions.push(...group);
    });

    // Sort by date (most recent first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    applyFilters();
  } catch (error) {
    console.error("Error loading history:", error);
    document.getElementById("transactionsTable").innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-8 text-center text-red-400">Error loading transactions</td>
      </tr>
    `;
    document.getElementById("transactionsMobile").innerHTML = `
      <div class="text-red-400 text-center py-8">Error loading transactions</div>
    `;
  }
}

// Load filtered transactions
async function loadFilteredTransactions(filterType) {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/filter?type=${filterType}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load filtered transactions");
    }

    const transactions = await response.json();
    allTransactions = transactions.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    applyFilters();
  } catch (error) {
    console.error("Error loading filtered transactions:", error);
  }
}

// Apply all filters
function applyFilters() {
  filteredTransactions = [...allTransactions];

  // Apply search filter
  if (currentSearchQuery) {
    const query = currentSearchQuery.toLowerCase();
    filteredTransactions = filteredTransactions.filter((tx) => {
      const note = (tx.note || "").toLowerCase();
      const category = (tx.category || "").toLowerCase();
      return note.includes(query) || category.includes(query);
    });
  }

  // Apply type filter
  if (currentTypeFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.type === currentTypeFilter
    );
  }

  // Apply category filter
  if (currentCategoryFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (tx) => tx.category === currentCategoryFilter
    );
  }

  renderTransactions();
  renderTransactionsMobile();
}

// Render transactions (desktop table)
function renderTransactions() {
  const tableBody = document.getElementById("transactionsTable");

  if (filteredTransactions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-8 text-center text-gray-400">No transactions found</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredTransactions
    .map((tx) => {
      const isIncome = tx.type === "income";
      const amountColor = isIncome ? "text-green-500" : "text-red-500";
      const amountSign = isIncome ? "+" : "-";
      const icon = getCategoryIcon(tx.category);

      return `
      <tr class="hover:bg-gray-800">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center space-x-2">
            <i class="fas ${icon} text-gray-400"></i>
            <span class="text-sm text-gray-300">${tx.category}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-300">${tx.note || "-"}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatDate(
          tx.date
        )}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${amountColor}">
          ${amountSign}${formatCurrency(Math.abs(tx.amount))}
        </td>
      </tr>
    `;
    })
    .join("");
}

// Render transactions (mobile grouped)
function renderTransactionsMobile() {
  const container = document.getElementById("transactionsMobile");

  if (filteredTransactions.length === 0) {
    container.innerHTML = `
      <div class="text-gray-400 text-center py-8">No transactions found</div>
    `;
    return;
  }

  const grouped = groupTransactionsByDate(filteredTransactions);

  container.innerHTML = Object.entries(grouped)
    .map(([groupKey, transactions]) => {
      const transactionsHtml = transactions
        .map((tx) => {
          const isIncome = tx.type === "income";
          const amountColor = isIncome ? "text-white" : "text-red-500";
          const amountSign = isIncome ? "+" : "-";
          const icon = getCategoryIcon(tx.category);

          return `
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-2">
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="fas ${icon} text-white text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium truncate">${tx.category}</p>
              <p class="text-gray-400 text-xs truncate">${
                tx.note || tx.category
              }</p>
            </div>
            <div class="text-right">
              <p class="${amountColor} font-bold">${amountSign} ${formatCurrency(
            Math.abs(tx.amount)
          )}</p>
            </div>
          </div>
        </div>
      `;
        })
        .join("");

      return `
      <div>
        <h3 class="text-white font-bold text-lg mb-3">${groupKey}</h3>
        <div class="space-y-2">
          ${transactionsHtml}
        </div>
      </div>
    `;
    })
    .join("");
}

// Generate calendar
function generateCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Update month display
  document.getElementById("calendarMonth").textContent =
    currentCalendarDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Day names
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  let calendarHTML = "";

  // Day headers
  dayNames.forEach((day) => {
    calendarHTML += `<div class="text-gray-400 text-xs font-medium py-1">${day}</div>`;
  });

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarHTML += `<div class="h-8"></div>`;
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected =
      date.toDateString() === currentCalendarDate.toDateString();

    let classes =
      "h-8 flex items-center justify-center text-sm rounded cursor-pointer hover:bg-gray-700";
    if (isSelected) {
      classes += " bg-blue-600 text-white";
    } else if (isToday) {
      classes += " bg-gray-700 text-white";
    } else {
      classes += " text-gray-300";
    }

    calendarHTML += `
      <div class="${classes}" data-date="${date.toISOString().split("T")[0]}">
        ${day}
      </div>
    `;
  }

  document.getElementById("calendarGrid").innerHTML = calendarHTML;

  // Add click handlers
  document.querySelectorAll("#calendarGrid [data-date]").forEach((cell) => {
    cell.addEventListener("click", () => {
      const selectedDate = new Date(cell.dataset.date);
      currentCalendarDate = selectedDate;
      generateCalendar();
      // Filter by selected date
      filterByDate(selectedDate);
    });
  });
}

// Filter by specific date
function filterByDate(date) {
  const dateStr = date.toISOString().split("T")[0];
  filteredTransactions = allTransactions.filter((tx) => {
    const txDate = new Date(tx.date).toISOString().split("T")[0];
    return txDate === dateStr;
  });
  renderTransactions();
  renderTransactionsMobile();
}

// Load categories for filter
async function loadCategories() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${CATEGORIES_API}/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const categories = await response.json();
      const categorySelect = document.getElementById("categoryFilter");

      // Get unique categories from transactions
      const uniqueCategories = [
        ...new Set(allTransactions.map((tx) => tx.category)),
      ];

      uniqueCategories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Initialize
async function init() {
  await loadHistory();
  generateCalendar();
  await loadCategories();

  // Date filter buttons (desktop)
  document.querySelectorAll(".date-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".date-filter-btn").forEach((b) => {
        b.classList.remove("bg-blue-600");
        b.classList.add("bg-gray-800");
      });
      btn.classList.add("bg-blue-600");
      btn.classList.remove("bg-gray-800");

      const filter = btn.dataset.filter;
      currentDateFilter = filter;

      if (filter === "today") {
        loadFilteredTransactions("daily");
      } else if (filter === "weekly") {
        loadFilteredTransactions("weekly");
      } else if (filter === "monthly") {
        loadFilteredTransactions("monthly");
      }
    });
  });

  // Date filter buttons (mobile)
  document.querySelectorAll(".date-filter-btn-mobile").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".date-filter-btn-mobile").forEach((b) => {
        b.classList.remove("bg-blue-600", "text-white");
        b.classList.add("bg-gray-900", "text-gray-400");
      });
      btn.classList.add("bg-blue-600", "text-white");
      btn.classList.remove("bg-gray-900", "text-gray-400");

      const filter = btn.dataset.filter;
      currentDateFilter = filter;
      loadFilteredTransactions(filter);
    });
  });

  // Type filter buttons
  document.querySelectorAll(".type-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".type-filter-btn").forEach((b) => {
        b.classList.remove("bg-blue-600");
      });
      btn.classList.add("bg-blue-600");

      currentTypeFilter = btn.dataset.type;
      applyFilters();
    });
  });

  // Category filter
  document.getElementById("categoryFilter")?.addEventListener("change", (e) => {
    currentCategoryFilter = e.target.value;
    applyFilters();
  });

  // Search input (desktop)
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    applyFilters();
  });

  // Search input (mobile)
  document
    .getElementById("searchInputMobile")
    ?.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value;
      applyFilters();
    });

  // Calendar navigation
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
  });
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

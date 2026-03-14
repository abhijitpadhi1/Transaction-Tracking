// API Base URL (use centralized value from api.js when available)
const API_BASE_URL =
  (window.API_BASE_URL || "http://127.0.0.1:7860") + "/transactions";
const CATEGORIES_API =
  (window.API_BASE_URL || "http://127.0.0.1:7860") + "/categories";

// Default categories if API fails (type can be 'income' or 'expense')
// For categories that work with both, we'll show them for both types
const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: "Food", icon: "fa-utensils", type: "expense" },
  { name: "Shopping", icon: "fa-shopping-bag", type: "expense" },
  { name: "Transport", icon: "fa-car", type: "expense" },
  { name: "Travel", icon: "fa-plane", type: "expense" },
  { name: "Home", icon: "fa-home", type: "expense" },
  { name: "Health", icon: "fa-heart", type: "expense" },
  { name: "Entertainment", icon: "fa-film", type: "expense" },
  { name: "Education", icon: "fa-graduation-cap", type: "expense" },
  { name: "Gifts", icon: "fa-gift", type: "expense" },
  { name: "Investments", icon: "fa-chart-line", type: "expense" },
  { name: "Bills", icon: "fa-file-invoice-dollar", type: "expense" },
  { name: "Other", icon: "fa-ellipsis-h", type: "expense" },
  // Income categories
  { name: "Salary", icon: "fa-money-bill-alt", type: "income" },
  { name: "PocketMoney", icon: "fa-rupee-sign", type: "income" },
  { name: "Work", icon: "fa-briefcase", type: "income" },
  { name: "Freelance", icon: "fa-laptop", type: "income" },
  { name: "Business", icon: "fa-briefcase", type: "income" },
];

// Get authentication token
function getAuthToken() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// Set current date and time as default
function setDefaultDateTime() {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 5);

  // Desktop
  document.getElementById("date").value = dateStr;
  document.getElementById("time").value = timeStr;

  // Mobile
  document.getElementById("dateMobile").value = dateStr;
  document.getElementById("timeMobile").value = timeStr;
}

// Handle type toggle
function setupTypeToggle() {
  // Desktop toggles
  const incomeBtn = document.getElementById("typeIncome");
  const expenseBtn = document.getElementById("typeExpense");
  const typeInput = document.getElementById("type");

  incomeBtn.addEventListener("click", () => {
    incomeBtn.classList.add("bg-blue-600");
    expenseBtn.classList.remove("bg-blue-600");
    typeInput.value = "income";
    updateCategoryGrid();
  });

  expenseBtn.addEventListener("click", () => {
    expenseBtn.classList.add("bg-blue-600");
    incomeBtn.classList.remove("bg-blue-600");
    typeInput.value = "expense";
    updateCategoryGrid();
  });

  // Mobile toggles
  const incomeBtnMobile = document.getElementById("typeIncomeMobile");
  const expenseBtnMobile = document.getElementById("typeExpenseMobile");
  const typeInputMobile = document.getElementById("typeMobile");

  incomeBtnMobile.addEventListener("click", () => {
    incomeBtnMobile.classList.add("bg-blue-600");
    expenseBtnMobile.classList.remove("bg-blue-600");
    typeInputMobile.value = "income";
    updateCategoryGrid();
  });

  expenseBtnMobile.addEventListener("click", () => {
    expenseBtnMobile.classList.add("bg-blue-600");
    incomeBtnMobile.classList.remove("bg-blue-600");
    typeInputMobile.value = "expense";
    updateCategoryGrid();
  });
}

// Load categories from API or use defaults
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
      return categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    } else {
      return DEFAULT_CATEGORIES;
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    return DEFAULT_CATEGORIES;
  }
}

// Update category grid based on selected type
let allCategories = [];
let selectedCategory = null;

async function updateCategoryGrid() {
  function getVisibleValue(ids, fallback = "expense") {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      try {
        const style = window.getComputedStyle(el);
        if (style && style.display !== "none") return el.value;
      } catch (e) {
        if (el.offsetParent !== null) return el.value;
      }
    }
    // If none are visible, return the first non-empty value or fallback
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.value) return el.value;
    }
    return fallback;
  }

  const type = getVisibleValue(["typeMobile", "type"]);

  // Filter categories by type (API returns 'income' or 'expense')
  const filteredCategories = allCategories.filter((cat) => {
    return cat.type === type;
  });

  // Desktop grid
  const desktopGrid = document.getElementById("categoryGrid");
  desktopGrid.innerHTML = filteredCategories
    .map((cat) => {
      const isSelected = selectedCategory === cat.name;
      return `
      <button
        type="button"
        class="category-btn bg-gray-800 hover:bg-gray-700 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-colors ${
          isSelected ? "bg-blue-600 border-2 border-blue-500" : ""
        }"
        data-category="${cat.name}"
      >
        <i class="fas ${cat.icon} text-white text-xl"></i>
        <span class="text-white text-xs">${cat.name}</span>
      </button>
    `;
    })
    .join("");

  // Mobile grid
  const mobileGrid = document.getElementById("categoryGridMobile");
  mobileGrid.innerHTML = filteredCategories
    .map((cat) => {
      const isSelected = selectedCategory === cat.name;
      return `
      <button
        type="button"
        class="category-btn-mobile bg-gray-900 hover:bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-colors border border-gray-800 ${
          isSelected ? "bg-blue-600 border-blue-500" : ""
        }"
        data-category="${cat.name}"
      >
        <i class="fas ${cat.icon} text-white text-lg"></i>
        <span class="text-white text-xs">${cat.name}</span>
      </button>
    `;
    })
    .join("");

  // Add click handlers
  document
    .querySelectorAll(".category-btn, .category-btn-mobile")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove previous selection
        document
          .querySelectorAll(".category-btn, .category-btn-mobile")
          .forEach((b) => {
            b.classList.remove("bg-blue-600", "border-blue-500");
            b.classList.add("bg-gray-800", "bg-gray-900");
          });

        // Select new category
        btn.classList.add("bg-blue-600", "border-blue-500");
        btn.classList.remove(
          "bg-gray-800",
          "bg-gray-900",
          "hover:bg-gray-700",
          "hover:bg-gray-800"
        );

        selectedCategory = btn.dataset.category;
        document.getElementById("category").value = selectedCategory;
        document.getElementById("categoryMobile").value = selectedCategory;
      });
    });

  // Auto-select first category if none selected
  if (!selectedCategory && filteredCategories.length > 0) {
    selectedCategory = filteredCategories[0].name;
    document.getElementById("category").value = selectedCategory;
    document.getElementById("categoryMobile").value = selectedCategory;
    // Trigger click on first button
    const firstBtn = document.querySelector(
      ".category-btn, .category-btn-mobile"
    );
    if (firstBtn) firstBtn.click();
  }
}

// Add transaction function
async function addTransaction(formData) {
  try {
    const token = getAuthToken();
    if (!token) return;

    // Validate required fields
    if (
      !formData.amount ||
      !formData.type ||
      !formData.category ||
      !formData.date
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${formData.date}T${formData.time || "00:00"}`);

    // Prepare transaction data
    const transactionData = {
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      note: formData.note || null,
      date: dateTime.toISOString(),
    };

    // Make API request
    const response = await fetch(`${API_BASE_URL}/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail ||
        data.message ||
        "Failed to add transaction. Please try again.";
      alert(errorMessage);
      return;
    }

    // Success - redirect to dashboard
    alert("Transaction added successfully!");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Add transaction error:", error);
    alert(
      "An error occurred while adding the transaction. Please try again later."
    );
  }
}

// Initialize page
async function init() {
  // Set default date and time
  setDefaultDateTime();

  // Setup type toggle
  setupTypeToggle();

  // Load categories
  allCategories = await loadCategories();
  await updateCategoryGrid();

  // Handle form submission (desktop)
  document
    .getElementById("addTransactionForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = {
        amount: document.getElementById("amount").value,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        note: document.getElementById("note").value,
      };
      await addTransaction(formData);
    });

  // Handle form submission (mobile)
  document
    .getElementById("saveButtonMobile")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      const formData = {
        amount: document.getElementById("amountMobile").value,
        type: document.getElementById("typeMobile").value,
        category: document.getElementById("categoryMobile").value,
        date: document.getElementById("dateMobile").value,
        time: document.getElementById("timeMobile").value,
        note: document.getElementById("noteMobile").value,
      };
      await addTransaction(formData);
    });
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// API Base URL
const API_BASE_URL =
  (window.API_BASE_URL || "http://127.0.0.1:8000") + "/categories";
const TRANSACTIONS_API =
  (window.API_BASE_URL || "http://127.0.0.1:8000") + "/transactions";

// Get authentication token
function getAuthToken() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// Load categories
async function loadCategories() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/list`, {
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
      throw new Error("Failed to load categories");
    }

    const categories = await response.json();
    renderCategories(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
    document.getElementById("categoryList").innerHTML = `
      <div class="text-red-400 text-center py-8">Error loading categories</div>
    `;
    document.getElementById("categoryListMobile").innerHTML = `
      <div class="text-red-400 text-center py-4">Error loading categories</div>
    `;
  }
}

// Render categories
function renderCategories(categories) {
  // Desktop list
  const desktopList = document.getElementById("categoryList");
  if (categories.length === 0) {
    desktopList.innerHTML = `
      <div class="text-gray-400 text-center py-8">No categories yet. Add one below!</div>
    `;
  } else {
    desktopList.innerHTML = categories
      .map(
        (cat) => `
      <div class="flex items-center justify-between py-3 px-4 bg-gray-800 rounded-lg border border-gray-700">
        <div class="flex items-center space-x-3">
          ${
            cat.icon
              ? `<i class="fas ${cat.icon} text-blue-500"></i>`
              : '<i class="fas fa-circle text-gray-500"></i>'
          }
          <div>
            <p class="text-white font-medium">${cat.name}</p>
            <p class="text-gray-400 text-xs">${cat.type}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            class="edit-category-btn text-blue-500 hover:text-blue-400 p-2"
            data-id="${cat._id}"
            data-name="${cat.name}"
            data-type="${cat.type}"
            data-icon="${cat.icon || ""}"
          >
            <i class="fas fa-edit"></i>
          </button>
          <button
            class="delete-category-btn text-red-500 hover:text-red-400 p-2"
            data-id="${cat._id}"
            data-name="${cat.name}"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Mobile list
  const mobileList = document.getElementById("categoryListMobile");
  if (categories.length === 0) {
    mobileList.innerHTML = `
      <div class="text-gray-400 text-center py-4">No categories yet</div>
    `;
  } else {
    mobileList.innerHTML = categories
      .map(
        (cat) => `
      <div class="flex items-center justify-between py-3 border-b border-gray-800">
        <span class="text-white">${cat.name}</span>
        <div class="flex items-center space-x-3">
          <button
            class="edit-category-btn-mobile text-blue-500 p-2"
            data-id="${cat._id}"
            data-name="${cat.name}"
            data-type="${cat.type}"
            data-icon="${cat.icon || ""}"
          >
            <i class="fas fa-edit"></i>
          </button>
          <button
            class="delete-category-btn-mobile text-red-500 p-2"
            data-id="${cat._id}"
            data-name="${cat.name}"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Add event listeners
  document
    .querySelectorAll(".delete-category-btn, .delete-category-btn-mobile")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const categoryId = btn.dataset.id;
        const categoryName = btn.dataset.name;
        if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
          deleteCategory(categoryId);
        }
      });
    });

  document
    .querySelectorAll(".edit-category-btn, .edit-category-btn-mobile")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        // For now, editing is not implemented in the API
        alert("Edit functionality coming soon!");
      });
    });
}

// Add category
async function addCategory(name, type, icon) {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        type: type,
        icon: icon || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail || data.message || "Failed to add category";
      alert(errorMessage);
      return;
    }

    // Reload categories
    await loadCategories();

    // Clear form
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryIcon").value = "";
    document.getElementById("categoryType").value = "expense";

    // Close mobile modal
    document.getElementById("addCategoryModal").classList.add("hidden");

    alert("Category added successfully!");
  } catch (error) {
    console.error("Error adding category:", error);
    alert("An error occurred while adding the category. Please try again.");
  }
}

// Delete category
async function deleteCategory(categoryId) {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/delete/${categoryId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage =
        data.detail || data.message || "Failed to delete category";
      alert(errorMessage);
      return;
    }

    // Reload categories
    await loadCategories();
    alert("Category deleted successfully!");
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("An error occurred while deleting the category. Please try again.");
  }
}

// Export data as CSV
async function exportData() {
  try {
    const token = getAuthToken();
    if (!token) return;

    // Fetch transactions
    const response = await fetch(`${TRANSACTIONS_API}/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const groupedData = await response.json();

    // Flatten transactions
    const transactions = [];
    Object.values(groupedData).forEach((group) => {
      transactions.push(...group);
    });

    // Create CSV content
    const headers = ["Date", "Type", "Category", "Amount", "Note"];
    const rows = transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.category,
      tx.amount,
      tx.note || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert("Data exported successfully!");
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("An error occurred while exporting data. Please try again.");
  }
}

// Clear all data
async function clearAllData() {
  if (
    !confirm(
      "Are you sure you want to clear ALL data? This action cannot be undone!"
    )
  ) {
    return;
  }

  if (
    !confirm(
      "This will permanently delete all your transactions and categories. Are you absolutely sure?"
    )
  ) {
    return;
  }

  try {
    const token = getAuthToken();
    if (!token) return;

    // Fetch all transactions
    const txResponse = await fetch(`${TRANSACTIONS_API}/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (txResponse.ok) {
      const groupedData = await txResponse.json();
      const transactions = [];
      Object.values(groupedData).forEach((group) => {
        transactions.push(...group);
      });

      // Delete all transactions
      for (const tx of transactions) {
        await fetch(`${TRANSACTIONS_API}/delete/${tx._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Fetch all categories
    const catResponse = await fetch(`${API_BASE_URL}/list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (catResponse.ok) {
      const categories = await catResponse.json();

      // Delete all categories
      for (const cat of categories) {
        await fetch(`${API_BASE_URL}/delete/${cat._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    }

    alert("All data cleared successfully!");
    await loadCategories();
  } catch (error) {
    console.error("Error clearing data:", error);
    alert("An error occurred while clearing data. Please try again.");
  }
}

// Initialize settings
function initSettings() {
  // Load saved preferences
  const savedCurrency = localStorage.getItem("defaultCurrency") || "INR";
  document.getElementById("defaultCurrency").value = savedCurrency;
  document.getElementById("defaultCurrencyMobile").value = savedCurrency;

  const darkMode = localStorage.getItem("darkMode") !== "false";
  document.getElementById("darkModeToggle").checked = darkMode;

  // Save currency preference
  document
    .getElementById("defaultCurrency")
    ?.addEventListener("change", (e) => {
      localStorage.setItem("defaultCurrency", e.target.value);
    });

  document
    .getElementById("defaultCurrencyMobile")
    ?.addEventListener("change", (e) => {
      localStorage.setItem("defaultCurrency", e.target.value);
    });

  // Save dark mode preference
  document.getElementById("darkModeToggle")?.addEventListener("change", (e) => {
    localStorage.setItem("darkMode", e.target.checked);
  });

  // Load and save budget preference
  const savedBudget = localStorage.getItem("budget");
  const budgetValue = savedBudget !== null ? savedBudget : "2000";
  const budgetEl = document.getElementById("budget");
  const budgetMobileEl = document.getElementById("budgetMobile");
  if (budgetEl) budgetEl.value = budgetValue;
  if (budgetMobileEl) budgetMobileEl.value = budgetValue;

  // Save when desktop value changes
  budgetEl?.addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "" || isNaN(Number(v))) {
      // ignore invalid
      return;
    }
    localStorage.setItem("budget", String(Number(v)));
    // mirror to mobile input if present
    if (budgetMobileEl) budgetMobileEl.value = String(Number(v));
  });

  // Save when mobile value changes
  budgetMobileEl?.addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "" || isNaN(Number(v))) {
      return;
    }
    localStorage.setItem("budget", String(Number(v)));
    if (budgetEl) budgetEl.value = String(Number(v));
  });

  // Expose a getter for other scripts
  window.getBudget = function () {
    const b = Number(localStorage.getItem("budget"));
    if (!b || isNaN(b)) return 2000;
    return b;
  };

  // Desktop tab switching
  document.querySelectorAll(".settings-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = tab.dataset.tab;

      // Update tab styles
      document.querySelectorAll(".settings-tab").forEach((t) => {
        t.classList.remove("bg-blue-600", "text-white");
        t.classList.add("text-gray-400");
      });
      tab.classList.add("bg-blue-600", "text-white");
      tab.classList.remove("text-gray-400");

      // Show/hide content
      document.querySelectorAll(".settings-content").forEach((content) => {
        content.classList.add("hidden");
      });
      document.getElementById(`${tabName}Tab`).classList.remove("hidden");
    });
  });

  // Add category form (desktop)
  document
    .getElementById("addCategoryForm")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("categoryName").value;
      const type = document.getElementById("categoryType").value;
      const icon = document.getElementById("categoryIcon").value;
      addCategory(name, type, icon);
    });

  // Add category form (mobile)
  document
    .getElementById("addCategoryFormMobile")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("categoryNameMobile").value;
      const type = document.getElementById("categoryTypeMobile").value;
      const icon = document.getElementById("categoryIconMobile").value;
      addCategory(name, type, icon);
    });

  // Mobile modal controls
  document
    .getElementById("addCategoryBtnMobile")
    ?.addEventListener("click", () => {
      document.getElementById("addCategoryModal").classList.remove("hidden");
    });

  document.getElementById("closeModalBtn")?.addEventListener("click", () => {
    document.getElementById("addCategoryModal").classList.add("hidden");
  });

  // Export data buttons
  document
    .getElementById("exportDataBtn")
    ?.addEventListener("click", exportData);
  document
    .getElementById("exportDataBtnMobile")
    ?.addEventListener("click", exportData);

  // Clear data buttons
  document
    .getElementById("clearDataBtn")
    ?.addEventListener("click", clearAllData);
  document
    .getElementById("clearDataBtnMobile")
    ?.addEventListener("click", clearAllData);

  // Load categories
  loadCategories();
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSettings);
} else {
  initSettings();
}

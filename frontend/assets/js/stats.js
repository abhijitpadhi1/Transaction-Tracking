// API Base URL
const API_BASE_URL =
  (window.API_BASE_URL || "http://127.0.0.1:8000") + "/analytics";

// Chart instances
let pieChart = null;
let pieChartMobile = null;
let barChart = null;
let barChartMobile = null;

// Current filter period
let currentPeriod = 30; // days

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

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    Food: "fa-utensils",
    "Food & Dining": "fa-utensils",
    Groceries: "fa-shopping-cart",
    Shopping: "fa-shopping-bag",
    Work: "fa-briefcase",
    Home: "fa-home",
    "Home & Utilities": "fa-home",
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
    Utilities: "fa-bolt",
    Coffee: "fa-coffee",
  };

  const categoryLower = category.toLowerCase();
  for (const [key, icon] of Object.entries(icons)) {
    if (categoryLower.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "fa-circle";
}

// Load pie chart data
async function loadPieChart() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/pie`, {
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
      throw new Error("Failed to load pie chart data");
    }

    const data = await response.json();

    // Convert to array format for ApexCharts
    const categories = Object.keys(data);
    const amounts = Object.values(data);
    const total = amounts.reduce((sum, val) => sum + val, 0);

    // Update total expenses (mobile)
    document.getElementById("totalExpenses").textContent =
      formatCurrency(total);

    // Color palette
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // orange
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
      "#f97316", // orange-red
      "#6366f1", // indigo
    ];

    const chartData = categories.map((cat, index) => ({
      name: cat,
      y: data[cat],
      color: colors[index % colors.length],
    }));

    // Desktop pie chart
    if (pieChart) {
      pieChart.destroy();
    }

    pieChart = new ApexCharts(document.querySelector("#pieChart"), {
      chart: {
        type: "donut",
        height: 320,
        toolbar: { show: false },
      },
      series: amounts,
      labels: categories,
      colors: colors,
      legend: {
        position: "bottom",
        labels: {
          colors: "#9ca3af",
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toFixed(1) + "%";
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
          },
        },
      },
      theme: {
        mode: "dark",
      },
    });
    pieChart.render();

    // Mobile pie chart
    if (pieChartMobile) {
      pieChartMobile.destroy();
    }

    pieChartMobile = new ApexCharts(document.querySelector("#pieChartMobile"), {
      chart: {
        type: "donut",
        height: 256,
        toolbar: { show: false },
      },
      series: amounts,
      labels: categories,
      colors: colors,
      legend: {
        position: "bottom",
        labels: {
          colors: "#9ca3af",
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toFixed(0) + "%";
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
          },
        },
      },
      theme: {
        mode: "dark",
      },
    });
    pieChartMobile.render();
  } catch (error) {
    console.error("Error loading pie chart:", error);
  }
}

// Load bar chart data
async function loadBarChart() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/bar?days=${currentPeriod}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load bar chart data");
    }

    const data = await response.json();

    // Sort dates
    const sortedDates = Object.keys(data).sort();
    const dates = sortedDates.map((date) => {
      const d = new Date(date);
      if (currentPeriod === 7) {
        // Show day names for weekly
        return d.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        // Show month names for monthly
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    });
    const amounts = sortedDates.map((date) => data[date]);

    // Desktop bar chart
    if (barChart) {
      barChart.destroy();
    }

    barChart = new ApexCharts(document.querySelector("#barChart"), {
      chart: {
        type: "bar",
        height: 320,
        toolbar: { show: false },
      },
      series: [
        {
          name: "Expenses",
          data: amounts,
        },
      ],
      xaxis: {
        categories: dates,
        labels: {
          style: {
            colors: "#9ca3af",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#9ca3af",
          },
          formatter: function (val) {
            return formatCurrency(val);
          },
        },
      },
      colors: ["#3b82f6"],
      dataLabels: {
        enabled: false,
      },
      grid: {
        borderColor: "#374151",
      },
      theme: {
        mode: "dark",
      },
    });
    barChart.render();

    // Mobile bar chart
    if (barChartMobile) {
      barChartMobile.destroy();
    }

    barChartMobile = new ApexCharts(document.querySelector("#barChartMobile"), {
      chart: {
        type: "bar",
        height: 256,
        toolbar: { show: false },
      },
      series: [
        {
          name: "Expenses",
          data: amounts,
        },
      ],
      xaxis: {
        categories: dates,
        labels: {
          style: {
            colors: "#9ca3af",
            fontSize: "10px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#9ca3af",
            fontSize: "10px",
          },
          formatter: function (val) {
            return "₹" + Math.round(val);
          },
        },
      },
      colors: ["#3b82f6"],
      dataLabels: {
        enabled: false,
      },
      grid: {
        borderColor: "#374151",
      },
      theme: {
        mode: "dark",
      },
    });
    barChartMobile.render();
  } catch (error) {
    console.error("Error loading bar chart:", error);
  }
}

// Load top categories
async function loadTopCategories() {
  try {
    const token = getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/top-categories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load top categories");
    }

    const categories = await response.json();

    // Calculate total for percentage
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

    // Desktop: Top 6 categories
    const desktopContainer = document.getElementById("topCategories");
    desktopContainer.innerHTML = categories
      .slice(0, 6)
      .map((cat) => {
        const percentage =
          total > 0 ? Math.round((cat.amount / total) * 100) : 0;
        const icon = getCategoryIcon(cat.category);

        return `
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div class="flex items-center space-x-3 mb-3">
            <i class="fas ${icon} text-blue-500"></i>
            <div class="flex-1">
              <p class="text-white font-medium text-sm">${cat.category}</p>
              <p class="text-gray-400 text-xs">${formatCurrency(cat.amount)}</p>
            </div>
          </div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-gray-400 text-xs">${percentage}%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: ${percentage}%"
            ></div>
          </div>
        </div>
      `;
      })
      .join("");

    // Mobile: Top spenders list (need to get transaction counts)
    // For now, we'll show the amount without count
    const mobileContainer = document.getElementById("topSpendersMobile");
    mobileContainer.innerHTML = categories
      .slice(0, 4)
      .map((cat, index) => {
        const icon = getCategoryIcon(cat.category);
        const iconColors = ["#ec4899", "#10b981", "#3b82f6", "#f59e0b"];
        const colorIndex = index % iconColors.length;

        return `
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${
            iconColors[colorIndex]
          }20">
            <i class="fas ${icon} text-lg" style="color: ${
          iconColors[colorIndex]
        }"></i>
          </div>
          <div class="flex-1">
            <p class="text-white font-medium">${cat.category}</p>
            <p class="text-gray-400 text-xs">Transactions</p>
          </div>
          <div class="text-right">
            <p class="text-red-500 font-bold">-${formatCurrency(cat.amount)}</p>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading top categories:", error);
    document.getElementById("topCategories").innerHTML = `
      <div class="text-red-400 text-center py-8 col-span-3">Error loading categories</div>
    `;
    document.getElementById("topSpendersMobile").innerHTML = `
      <div class="text-red-400 text-center py-4">Error loading top spenders</div>
    `;
  }
}

// Reload all charts
async function reloadAllCharts() {
  await loadPieChart();
  await loadBarChart();
  await loadTopCategories();
}

// Initialize
async function init() {
  await reloadAllCharts();

  // Desktop period filter
  document.getElementById("periodFilter")?.addEventListener("change", (e) => {
    currentPeriod = parseInt(e.target.value);
    loadBarChart();
  });

  // Mobile period filters
  document.getElementById("filter7Days")?.addEventListener("click", () => {
    currentPeriod = 7;
    document
      .getElementById("filter7Days")
      .classList.add("bg-blue-600", "text-white");
    document
      .getElementById("filter7Days")
      .classList.remove("bg-gray-800", "text-gray-400");
    document
      .getElementById("filter30Days")
      .classList.remove("bg-blue-600", "text-white");
    document
      .getElementById("filter30Days")
      .classList.add("bg-gray-800", "text-gray-400");
    loadBarChart();
  });

  document.getElementById("filter30Days")?.addEventListener("click", () => {
    currentPeriod = 30;
    document
      .getElementById("filter30Days")
      .classList.add("bg-blue-600", "text-white");
    document
      .getElementById("filter30Days")
      .classList.remove("bg-gray-800", "text-gray-400");
    document
      .getElementById("filter7Days")
      .classList.remove("bg-blue-600", "text-white");
    document
      .getElementById("filter7Days")
      .classList.add("bg-gray-800", "text-gray-400");
    loadBarChart();
  });
}

// Run on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

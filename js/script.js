const STORAGE_KEY = "expenseBudgetTransactions";
const THEME_KEY = "expenseBudgetTheme";

const form = document.getElementById("transactionForm");
const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const transactionList = document.getElementById("transactionList");
const totalBalance = document.getElementById("totalBalance");
const transactionCount = document.getElementById("transactionCount");
const formMessage = document.getElementById("formMessage");
const clearAllBtn = document.getElementById("clearAllBtn");
const themeToggle = document.getElementById("themeToggle");
const categorySummary = document.getElementById("categorySummary");
const monthlySummary = document.getElementById("monthlySummary");

let transactions = loadTransactions();
let expenseChart = null;

const categoryColors = {
  Makanan: "#2ecc71",
  Transportasi: "#3498db",
  Hiburan: "#e67e22"
};

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "var(--danger)" : "var(--success)";
}

function setError(id, message) {
  document.getElementById(id).textContent = message;
}

function clearErrors() {
  setError("itemNameError", "");
  setError("amountError", "");
  setError("categoryError", "");
}

function validateForm() {
  clearErrors();
  let valid = true;

  const name = itemNameInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!name) {
    setError("itemNameError", "Nama barang wajib diisi.");
    valid = false;
  }

  if (!amountInput.value || !Number.isFinite(amount) || amount <= 0) {
    setError("amountError", "Jumlah harus lebih dari 0.");
    valid = false;
  }

  if (!category) {
    setError("categoryError", "Kategori wajib dipilih.");
    valid = false;
  }

  return valid;
}

function renderTransactions() {
  if (transactions.length === 0) {
    transactionList.innerHTML = `
      <div class="empty-state">
        <strong>Belum ada transaksi</strong>
        <p>Tambahkan pengeluaran pertama kamu melalui formulir di atas.</p>
      </div>
    `;
    return;
  }

  const sorted = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

  transactionList.innerHTML = sorted.map(transaction => `
    <article class="transaction-item">
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(transaction.name)}</div>
        <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
        <span class="category-badge">${escapeHtml(transaction.category)}</span>
      </div>
      <button class="delete-btn" type="button" data-id="${transaction.id}"
              aria-label="Hapus ${escapeHtml(transaction.name)}">Hapus</button>
    </article>
  `).join("");
}

function updateBalance() {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  totalBalance.textContent = formatCurrency(total);
  transactionCount.textContent = `${transactions.length} transaksi tercatat`;
}

function getCategoryTotals() {
  const totals = {
    Makanan: 0,
    Transportasi: 0,
    Hiburan: 0
  };

  transactions.forEach(transaction => {
    if (Object.prototype.hasOwnProperty.call(totals, transaction.category)) {
      totals[transaction.category] += transaction.amount;
    }
  });

  return totals;
}

function renderCategorySummary() {
  const totals = getCategoryTotals();

  categorySummary.innerHTML = Object.entries(totals).map(([category, amount]) => `
    <div class="category-card">
      <span>${category}</span>
      <strong>${formatCurrency(amount)}</strong>
    </div>
  `).join("");
}

function updateChart() {
  const totals = getCategoryTotals();
  const labels = Object.keys(totals);
  const values = Object.values(totals);

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(label => categoryColors[label]),
        borderColor: getComputedStyle(document.body).getPropertyValue("--surface").trim(),
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: getComputedStyle(document.body).getPropertyValue("--text").trim(),
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return ` ${context.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

function renderMonthlySummary() {
  const now = new Date();
  const months = [];

  for (let i = 2; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric"
    });

    const total = transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const transactionKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}`;
        return transactionKey === key;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    months.push({ label, total });
  }

  monthlySummary.innerHTML = months.map(month => `
    <div class="month-card">
      <div class="month-name">${month.label}</div>
      <div class="month-value">${formatCurrency(month.total)}</div>
    </div>
  `).join("");
}

function refreshUI() {
  renderTransactions();
  updateBalance();
  renderCategorySummary();
  updateChart();
  renderMonthlySummary();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  showMessage("");

  if (!validateForm()) {
    showMessage("Periksa kembali data yang diisi.", true);
    return;
  }

  const transaction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: itemNameInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    createdAt: Date.now()
  };

  transactions.push(transaction);
  saveTransactions();
  refreshUI();

  form.reset();
  itemNameInput.focus();
  showMessage("Transaksi berhasil ditambahkan.");
});

transactionList.addEventListener("click", event => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;

  const id = button.dataset.id;
  transactions = transactions.filter(transaction => transaction.id !== id);
  saveTransactions();
  refreshUI();
  showMessage("Transaksi berhasil dihapus.");
});

clearAllBtn.addEventListener("click", () => {
  if (transactions.length === 0) {
    showMessage("Tidak ada transaksi untuk dihapus.", true);
    return;
  }

  const confirmed = window.confirm("Hapus semua transaksi? Data yang dihapus tidak dapat dikembalikan.");
  if (!confirmed) return;

  transactions = [];
  saveTransactions();
  refreshUI();
  showMessage("Semua transaksi berhasil dihapus.");
});

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap";
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
  updateChart();
});

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
applyTheme(savedTheme);
refreshUI();

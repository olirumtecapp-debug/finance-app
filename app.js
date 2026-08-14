/* =========================================================
   FinSmart - Main Application Logic & State Engine
   ========================================================= */

// Predefined Categories with Emojis
const CATEGORIES = {
  expense: [
    { name: 'Alimentação', icon: '🍔' },
    { name: 'Moradia', icon: '🏠' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Contas & Boletos', icon: '📄' },
    { name: 'Lazer', icon: '🎉' },
    { name: 'Saúde', icon: '💊' },
    { name: 'Educação', icon: '📚' },
    { name: 'Compras', icon: '🛍️' },
    { name: 'Outros', icon: '🏷️' }
  ],
  income: [
    { name: 'Salário', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Investimentos', icon: '📈' },
    { name: 'Vendas', icon: '💰' },
    { name: 'Presentes', icon: '🎁' },
    { name: 'Outros', icon: '✨' }
  ]
};

// Storage Keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'finsmart_transactions_v1',
  GOALS: 'finsmart_goals_v1',
  HIDE_VALUES: 'finsmart_hide_values',
  THEME: 'finsmart_theme'
};

// Month Names in Portuguese
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// App State
const AppState = {
  currentDate: new Date(),
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  transactions: [],
  goals: [],
  hideValues: false,
  theme: 'dark',
  activeTab: 'tab-home',
  
  // Transactions Filter
  txTypeFilter: 'all',
  txCategoryFilter: 'all',
  txSearchQuery: ''
};

/* =========================================================
   1. Initialization & Sample Data Generation
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initAppState();
  bindEvents();
  renderAll();
});

function initAppState() {
  // Load Theme preference
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'light') {
    AppState.theme = 'light';
    document.body.classList.add('light-theme');
    updateThemeIcon();
  }

  // Load Hide Values preference
  const savedHide = localStorage.getItem(STORAGE_KEYS.HIDE_VALUES);
  if (savedHide === 'true') {
    AppState.hideValues = true;
    document.body.classList.add('hide-values');
    updateEyeIcon();
  }

  // Load Transactions
  const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (savedTx) {
    try {
      AppState.transactions = JSON.parse(savedTx);
    } catch (e) {
      AppState.transactions = [];
    }
  }

  // Load Goals
  const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (savedGoals) {
    try {
      AppState.goals = JSON.parse(savedGoals);
    } catch (e) {
      AppState.goals = [];
    }
  }

  // If new user, load rich demonstration data
  if (!savedTx && AppState.transactions.length === 0) {
    generateSampleData();
  }

  // Initialize Default Date in Transaction Form to Today
  const todayStr = new Date().toISOString().split('T')[0];
  const txDateInput = document.getElementById('tx-date');
  if (txDateInput) txDateInput.value = todayStr;
}

function generateSampleData() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const sampleGoals = [
    {
      id: 'g-1',
      name: 'Reserva de Emergência',
      target: 10000,
      current: 4500,
      deadline: `${currentYear}-12-31`,
      icon: '🛡️'
    },
    {
      id: 'g-2',
      name: 'Viagem de Férias',
      target: 3500,
      current: 2100,
      deadline: `${currentYear}-11-15`,
      icon: '✈️'
    },
    {
      id: 'g-3',
      name: 'Novo Smartphone',
      target: 2800,
      current: 1950,
      deadline: `${currentYear}-09-30`,
      icon: '📱'
    }
  ];

  // Helper to format ISO date
  const makeDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const sampleTx = [
    // Current Month Transactions
    { id: 'tx-1', type: 'income', amount: 4800, description: 'Salário Mensal', category: 'Salário', date: makeDate(currentYear, currentMonth, 5), paymentMethod: 'Transferência' },
    { id: 'tx-2', type: 'income', amount: 950, description: 'Projeto Freelance Web', category: 'Freelance', date: makeDate(currentYear, currentMonth, 12), paymentMethod: 'PIX' },
    { id: 'tx-3', type: 'expense', amount: 1350, description: 'Aluguel & Condomínio', category: 'Moradia', date: makeDate(currentYear, currentMonth, 6), paymentMethod: 'PIX' },
    { id: 'tx-4', type: 'expense', amount: 620.40, description: 'Compras Supermercado', category: 'Alimentação', date: makeDate(currentYear, currentMonth, 8), paymentMethod: 'Cartão de Crédito' },
    { id: 'tx-5', type: 'expense', amount: 180, description: 'Conta de Luz e Internet', category: 'Contas & Boletos', date: makeDate(currentYear, currentMonth, 10), paymentMethod: 'Boleto' },
    { id: 'tx-6', type: 'expense', amount: 125.50, description: 'Combustível / Posto', category: 'Transporte', date: makeDate(currentYear, currentMonth, 11), paymentMethod: 'Cartão de Débito' },
    { id: 'tx-7', type: 'expense', amount: 195, description: 'Jantar Restaurante', category: 'Lazer', date: makeDate(currentYear, currentMonth, 13), paymentMethod: 'PIX' },
    { id: 'tx-8', type: 'expense', amount: 89.90, description: 'Farmácia / Vitaminas', category: 'Saúde', date: makeDate(currentYear, currentMonth, 14), paymentMethod: 'Cartão de Crédito' },

    // Previous Month Transactions
    { id: 'tx-101', type: 'income', amount: 4800, description: 'Salário Mensal', category: 'Salário', date: makeDate(currentYear, currentMonth - 1, 5), paymentMethod: 'Transferência' },
    { id: 'tx-102', type: 'expense', amount: 1350, description: 'Aluguel & Condomínio', category: 'Moradia', date: makeDate(currentYear, currentMonth - 1, 6), paymentMethod: 'PIX' },
    { id: 'tx-103', type: 'expense', amount: 780, description: 'Supermercado Mensal', category: 'Alimentação', date: makeDate(currentYear, currentMonth - 1, 9), paymentMethod: 'Cartão de Crédito' },
    { id: 'tx-104', type: 'expense', amount: 240, description: 'Cinema & Passeios', category: 'Lazer', date: makeDate(currentYear, currentMonth - 1, 15), paymentMethod: 'PIX' },

    // 2 Months ago
    { id: 'tx-201', type: 'income', amount: 4800, description: 'Salário Mensal', category: 'Salário', date: makeDate(currentYear, currentMonth - 2, 5), paymentMethod: 'Transferência' },
    { id: 'tx-202', type: 'income', amount: 600, description: 'Venda de Item Usado', category: 'Vendas', date: makeDate(currentYear, currentMonth - 2, 14), paymentMethod: 'PIX' },
    { id: 'tx-203', type: 'expense', amount: 2400, description: 'Gastos Variados', category: 'Moradia', date: makeDate(currentYear, currentMonth - 2, 10), paymentMethod: 'Cartão de Crédito' }
  ];

  AppState.goals = sampleGoals;
  AppState.transactions = sampleTx;
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(AppState.transactions));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(AppState.goals));
}

/* =========================================================
   2. Event Listeners & Interactions
   ========================================================= */

function bindEvents() {
  // Navigation Tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Shortcut Links in Home
  document.getElementById('see-all-goals-btn')?.addEventListener('click', () => switchTab('tab-goals'));
  document.getElementById('see-all-transactions-btn')?.addEventListener('click', () => switchTab('tab-transactions'));

  // Quick Action Buttons
  document.getElementById('quick-add-income-btn')?.addEventListener('click', () => openTransactionModal('income'));
  document.getElementById('quick-add-expense-btn')?.addEventListener('click', () => openTransactionModal('expense'));
  document.getElementById('quick-add-goal-btn')?.addEventListener('click', () => openGoalModal());
  document.getElementById('fab-add-btn')?.addEventListener('click', () => openTransactionModal('expense'));
  document.getElementById('open-new-goal-modal-btn')?.addEventListener('click', () => openGoalModal());

  // Theme Toggle (Light / Dark)
  document.getElementById('toggle-theme-btn')?.addEventListener('click', toggleTheme);

  // Eye Icon Visibility Toggle
  document.getElementById('toggle-visibility-btn')?.addEventListener('click', toggleValuesVisibility);

  // Month Navigation
  document.getElementById('prev-month-btn')?.addEventListener('click', () => changeMonth(-1));
  document.getElementById('next-month-btn')?.addEventListener('click', () => changeMonth(1));

  // Modals Close handlers
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Close modal when clicking on backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });

  // Transaction Type Toggle inside Modal
  document.querySelectorAll('.tx-type-toggle .type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.tx-type-toggle');
      parent.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const txType = btn.getAttribute('data-type');
      if (txType) {
        populateCategorySelector(txType);
      }
    });
  });

  // Transaction Form Submit
  document.getElementById('transaction-form')?.addEventListener('submit', handleSaveTransaction);

  // Goal Form Submit
  document.getElementById('goal-form')?.addEventListener('submit', handleSaveGoal);

  // Goal Action Form Submit (Deposit / Withdraw)
  document.getElementById('goal-action-form')?.addEventListener('submit', handleConfirmGoalAction);

  // Goal Action Type Switcher
  document.getElementById('action-deposit-tab')?.addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('action-withdraw-tab').classList.remove('active');
  });
  document.getElementById('action-withdraw-tab')?.addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('action-deposit-tab').classList.remove('active');
  });

  // Goal Icon Picker
  document.querySelectorAll('.icon-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.icon-choice').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('goal-selected-icon').value = btn.getAttribute('data-icon');
    });
  });

  // Extrato Filters
  document.getElementById('transactions-search-input')?.addEventListener('input', (e) => {
    AppState.txSearchQuery = e.target.value.toLowerCase();
    renderTransactionsTab();
  });

  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.txTypeFilter = chip.getAttribute('data-filter');
      renderTransactionsTab();
    });
  });

  document.getElementById('transactions-category-filter')?.addEventListener('change', (e) => {
    AppState.txCategoryFilter = e.target.value;
    renderTransactionsTab();
  });

  // Settings Modal & Backup Handlers
  document.getElementById('open-settings-btn')?.addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);
  document.getElementById('export-json-btn')?.addEventListener('click', exportBackupJSON);
  document.getElementById('import-json-file')?.addEventListener('change', importBackupJSON);
  document.getElementById('load-sample-data-btn')?.addEventListener('click', () => {
    if (confirm('Deseja recarregar os dados de exemplo? Seus lançamentos atuais serão substituídos.')) {
      generateSampleData();
      closeModal('modal-settings');
      renderAll();
      showToast('Dados de exemplo recarregados com sucesso!');
    }
  });
  document.getElementById('clear-all-data-btn')?.addEventListener('click', () => {
    if (confirm('Atenção: Tem certeza que deseja apagar TODOS os seus lançamentos e cofrinhos? Esta ação não pode ser desfeita.')) {
      AppState.transactions = [];
      AppState.goals = [];
      saveData();
      closeModal('modal-settings');
      renderAll();
      showToast('Todos os dados foram excluídos.', 'fa-triangle-exclamation');
    }
  });
}

/* =========================================================
   3. Tab & Month Navigation
   ========================================================= */

function switchTab(tabId) {
  AppState.activeTab = tabId;
  
  document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(tabId);
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Re-render charts when switching to stats tab
  if (tabId === 'tab-stats') {
    ChartsManager.renderCategoryChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
    ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
  }
}

function changeMonth(delta) {
  let newMonth = AppState.selectedMonth + delta;
  let newYear = AppState.selectedYear;

  if (newMonth < 0) {
    newMonth = 11;
    newYear -= 1;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear += 1;
  }

  AppState.selectedMonth = newMonth;
  AppState.selectedYear = newYear;

  renderAll();
}

function updateMonthDisplay() {
  const display = document.getElementById('current-month-display');
  if (display) {
    display.textContent = `${MONTH_NAMES[AppState.selectedMonth]} de ${AppState.selectedYear}`;
  }
}

function toggleTheme() {
  AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
  if (AppState.theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem(STORAGE_KEYS.THEME, AppState.theme);
  updateThemeIcon();

  // Re-render charts to adapt colors if currently on stats tab
  if (AppState.activeTab === 'tab-stats') {
    ChartsManager.renderCategoryChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
    ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
  }
  showToast(AppState.theme === 'light' ? 'Modo Claro ativado ☀️' : 'Modo Escuro ativado 🌙');
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = AppState.theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    icon.style.color = AppState.theme === 'light' ? '#f59e0b' : '';
  }
}

function toggleValuesVisibility() {
  AppState.hideValues = !AppState.hideValues;
  if (AppState.hideValues) {
    document.body.classList.add('hide-values');
  } else {
    document.body.classList.remove('hide-values');
  }
  localStorage.setItem(STORAGE_KEYS.HIDE_VALUES, AppState.hideValues);
  updateEyeIcon();
}

function updateEyeIcon() {
  const icon = document.getElementById('eye-icon');
  if (icon) {
    if (AppState.hideValues) {
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      icon.className = 'fa-solid fa-eye';
    }
  }
}

/* =========================================================
   4. Render Engine
   ========================================================= */

function renderAll() {
  updateMonthDisplay();
  renderHeaderBalances();
  renderHomeTab();
  renderTransactionsTab();
  renderGoalsTab();
  renderStatsTab();
}

// Format numbers to BRL string
function formatCurrency(val) {
  return Number(val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format date to Brazilian format
function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// 4.1 Header Balance & Month Totals
function renderHeaderBalances() {
  // Total balance of ALL time
  let totalBalance = 0;
  AppState.transactions.forEach(t => {
    if (t.type === 'income') totalBalance += Number(t.amount);
    if (t.type === 'expense') totalBalance -= Number(t.amount);
  });

  // Current Month Totals
  let monthIncome = 0;
  let monthExpense = 0;

  AppState.transactions.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    if (d.getFullYear() === AppState.selectedYear && d.getMonth() === AppState.selectedMonth) {
      if (t.type === 'income') monthIncome += Number(t.amount);
      if (t.type === 'expense') monthExpense += Number(t.amount);
    }
  });

  // Update DOM
  const balEl = document.getElementById('total-balance-value');
  const incEl = document.getElementById('month-income-value');
  const expEl = document.getElementById('month-expense-value');
  const badgeEl = document.getElementById('savings-rate-badge');

  if (balEl) balEl.textContent = formatCurrency(totalBalance);
  if (incEl) incEl.textContent = `+R$ ${formatCurrency(monthIncome)}`;
  if (expEl) expEl.textContent = `-R$ ${formatCurrency(monthExpense)}`;

  // Savings rate badge calculation
  if (badgeEl) {
    if (monthIncome > 0) {
      const savedRate = Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 100));
      badgeEl.textContent = `Economia: ${savedRate}%`;
      badgeEl.className = savedRate >= 20 ? 'badge badge-health' : 'badge';
    } else {
      badgeEl.textContent = 'Sem receitas';
      badgeEl.className = 'badge';
    }
  }
}

// 4.2 Home Tab Render
function renderHomeTab() {
  // Goals preview (top 2 goals)
  const homeGoalsContainer = document.getElementById('home-goals-preview-list');
  const homeGoalsTotal = document.getElementById('home-goals-total');
  
  let totalSavedGoals = 0;
  AppState.goals.forEach(g => totalSavedGoals += Number(g.current || 0));
  if (homeGoalsTotal) homeGoalsTotal.textContent = `R$ ${formatCurrency(totalSavedGoals)}`;

  if (homeGoalsContainer) {
    if (AppState.goals.length === 0) {
      homeGoalsContainer.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-piggy-bank"></i>
          <span>Nenhum cofrinho criado ainda.</span>
        </div>
      `;
    } else {
      const topGoals = AppState.goals.slice(0, 2);
      homeGoalsContainer.innerHTML = topGoals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        return `
          <div class="mini-goal-item" onclick="openGoalActionModal('${g.id}')">
            <div class="mini-goal-header">
              <span class="mini-goal-title">${g.icon || '🐷'} ${g.name}</span>
              <span class="mini-goal-pct">${pct}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
            <div class="mini-goal-footer">
              <span>Guardado: <strong class="sensitive-value">R$ ${formatCurrency(g.current)}</strong></span>
              <span>Meta: R$ ${formatCurrency(g.target)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Recent Transactions (last 5 in current selected month)
  const homeTxContainer = document.getElementById('home-recent-transactions-list');
  if (homeTxContainer) {
    const monthTx = AppState.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === AppState.selectedYear && d.getMonth() === AppState.selectedMonth;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (monthTx.length === 0) {
      homeTxContainer.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-receipt"></i>
          <span>Nenhum lançamento neste mês.</span>
        </div>
      `;
    } else {
      homeTxContainer.innerHTML = monthTx.slice(0, 5).map(t => renderTransactionItemHtml(t)).join('');
    }
  }
}

// 4.3 Transactions Tab Render
function renderTransactionsTab() {
  const container = document.getElementById('full-transactions-list');
  const countLabel = document.getElementById('filtered-count-label');
  const catSelect = document.getElementById('transactions-category-filter');

  // Populate Categories Filter Dropdown if needed
  if (catSelect && catSelect.options.length <= 1) {
    const allCategories = new Set();
    [...CATEGORIES.expense, ...CATEGORIES.income].forEach(c => allCategories.add(c.name));
    allCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  }

  // Filter current month transactions
  let filtered = AppState.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === AppState.selectedYear && d.getMonth() === AppState.selectedMonth;
  });

  // Type filter
  if (AppState.txTypeFilter !== 'all') {
    filtered = filtered.filter(t => t.type === AppState.txTypeFilter);
  }

  // Category filter
  if (AppState.txCategoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === AppState.txCategoryFilter);
  }

  // Search filter
  if (AppState.txSearchQuery) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(AppState.txSearchQuery) ||
      (t.category && t.category.toLowerCase().includes(AppState.txSearchQuery))
    );
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (countLabel) {
    countLabel.textContent = `${filtered.length} lançamento${filtered.length === 1 ? '' : 's'}`;
  }

  if (container) {
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-magnifying-glass"></i>
          <span>Nenhum lançamento encontrado com os filtros selecionados.</span>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(t => renderTransactionItemHtml(t)).join('');
    }
  }
}

function getCategoryIcon(categoryName, type) {
  const catList = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  const match = catList.find(c => c.name === categoryName);
  return match ? match.icon : '🏷️';
}

function renderTransactionItemHtml(tx) {
  const isIncome = tx.type === 'income';
  const icon = getCategoryIcon(tx.category, tx.type);
  const sign = isIncome ? '+' : '-';
  const amountClass = isIncome ? 'income' : 'expense';

  return `
    <div class="transaction-item" id="item-${tx.id}">
      <div class="tx-left">
        <div class="tx-cat-icon">${icon}</div>
        <div class="tx-details">
          <span class="tx-desc">${escapeHtml(tx.description)}</span>
          <span class="tx-meta">
            <span>${tx.category || 'Geral'}</span> • 
            <span>${formatDateBR(tx.date)}</span> • 
            <span>${tx.paymentMethod || 'PIX'}</span>
          </span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${amountClass} sensitive-value">${sign}R$ ${formatCurrency(tx.amount)}</span>
        <div class="tx-actions">
          <button class="tx-action-del" title="Excluir" onclick="deleteTransaction('${tx.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// 4.4 Goals Tab Render
function renderGoalsTab() {
  const container = document.getElementById('full-goals-container');
  const heroValue = document.getElementById('total-saved-in-goals');

  let totalSaved = 0;
  AppState.goals.forEach(g => totalSaved += Number(g.current || 0));
  if (heroValue) heroValue.textContent = formatCurrency(totalSaved);

  if (container) {
    if (AppState.goals.length === 0) {
      container.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-piggy-bank"></i>
          <span>Você ainda não cadastrou nenhum cofrinho.<br>Clique em "+ Nova Meta" acima para começar!</span>
        </div>
      `;
    } else {
      container.innerHTML = AppState.goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const remaining = Math.max(0, g.target - g.current);
        const deadlineText = g.deadline ? `Prazo: ${formatDateBR(g.deadline)}` : 'Sem prazo definido';

        return `
          <div class="full-goal-card" id="goal-card-${g.id}">
            <div class="goal-card-top">
              <div class="goal-info-title">
                <div class="goal-avatar">${g.icon || '🐷'}</div>
                <div class="goal-names">
                  <h3>${escapeHtml(g.name)}</h3>
                  <span class="goal-deadline-label">${deadlineText}</span>
                </div>
              </div>
              <button class="btn-icon-del" title="Excluir Meta" onclick="deleteGoal('${g.id}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <div class="goal-card-values">
              <div>
                <span style="font-size: 11px; color: var(--text-muted); display: block;">Guardado</span>
                <span class="goal-current-saved sensitive-value">R$ ${formatCurrency(g.current)}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; color: var(--text-muted); display: block;">Meta Total</span>
                <span class="goal-target-total">R$ ${formatCurrency(g.target)}</span>
              </div>
            </div>

            <div class="progress-bar-container" style="height: 10px; margin: 10px 0;">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
              <span><strong>${pct}%</strong> atingido</span>
              <span>Faltam: <strong class="sensitive-value">R$ ${formatCurrency(remaining)}</strong></span>
            </div>

            <div class="goal-actions-row">
              <button class="btn-sm btn-deposit" onclick="openGoalActionModal('${g.id}', 'deposit')">
                <i class="fa-solid fa-plus"></i> Guardar
              </button>
              <button class="btn-sm btn-withdraw" onclick="openGoalActionModal('${g.id}', 'withdraw')">
                <i class="fa-solid fa-minus"></i> Resgatar
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// 4.5 Statistics & Insights Render
function renderStatsTab() {
  const currentMonthTx = AppState.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === AppState.selectedYear && d.getMonth() === AppState.selectedMonth;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};

  currentMonthTx.forEach(t => {
    if (t.type === 'income') totalIncome += Number(t.amount);
    if (t.type === 'expense') {
      const amt = Number(t.amount);
      totalExpense += amt;
      const cat = t.category || 'Outros';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    }
  });

  // 1. Daily Average
  const daysInMonth = new Date(AppState.selectedYear, AppState.selectedMonth + 1, 0).getDate();
  const dailyAvg = totalExpense / daysInMonth;
  const dailyEl = document.getElementById('stat-daily-avg');
  if (dailyEl) dailyEl.textContent = `R$ ${formatCurrency(dailyAvg)}`;

  // 2. Top Expense Category
  let topCat = '-';
  let topCatVal = 0;
  for (const cat in categoryExpenses) {
    if (categoryExpenses[cat] > topCatVal) {
      topCatVal = categoryExpenses[cat];
      topCat = cat;
    }
  }
  const topCatEl = document.getElementById('stat-top-expense-category');
  const topCatValEl = document.getElementById('stat-top-expense-val');
  if (topCatEl) topCatEl.textContent = topCat;
  if (topCatValEl) topCatValEl.textContent = topCatVal > 0 ? `R$ ${formatCurrency(topCatVal)}` : 'R$ 0,00';

  // 3. Net Savings Balance
  const netSavings = totalIncome - totalExpense;
  const netEl = document.getElementById('stat-net-savings');
  const netPctEl = document.getElementById('stat-savings-percentage');
  if (netEl) {
    netEl.textContent = `${netSavings >= 0 ? '+' : '-'}R$ ${formatCurrency(Math.abs(netSavings))}`;
    netEl.style.color = netSavings >= 0 ? 'var(--income)' : 'var(--expense)';
  }
  if (netPctEl) {
    if (totalIncome > 0) {
      const pct = Math.round((netSavings / totalIncome) * 100);
      netPctEl.textContent = `${pct}% da receita total`;
    } else {
      netPctEl.textContent = 'Sem receitas registradas';
    }
  }

  // 4. Compare with Previous Month
  let prevMonth = AppState.selectedMonth - 1;
  let prevYear = AppState.selectedYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }

  const prevMonthTx = AppState.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  let prevTotalExpense = 0;
  prevMonthTx.forEach(t => {
    if (t.type === 'expense') prevTotalExpense += Number(t.amount);
  });

  const vsMonthEl = document.getElementById('stat-vs-last-month');
  const vsMonthSubEl = document.getElementById('stat-vs-last-month-sub');
  if (vsMonthEl && vsMonthSubEl) {
    if (prevTotalExpense > 0) {
      const diffPct = Math.round(((totalExpense - prevTotalExpense) / prevTotalExpense) * 100);
      if (diffPct > 0) {
        vsMonthEl.textContent = `+${diffPct}%`;
        vsMonthEl.style.color = 'var(--expense)';
        vsMonthSubEl.textContent = 'a mais em gastos que o mês anterior';
      } else if (diffPct < 0) {
        vsMonthEl.textContent = `${diffPct}%`;
        vsMonthEl.style.color = 'var(--income)';
        vsMonthSubEl.textContent = 'a menos em gastos (economia!)';
      } else {
        vsMonthEl.textContent = '0%';
        vsMonthEl.style.color = 'var(--text-secondary)';
        vsMonthSubEl.textContent = 'mesmo valor do mês anterior';
      }
    } else {
      vsMonthEl.textContent = 'N/D';
      vsMonthEl.style.color = 'var(--text-secondary)';
      vsMonthSubEl.textContent = 'sem dados no mês anterior';
    }
  }

  // Render Charts
  ChartsManager.renderCategoryChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
  ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.selectedYear, AppState.selectedMonth);
}

/* =========================================================
   5. Modals Management & CRUD Operations
   ========================================================= */

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('hidden');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('hidden');
}

// 5.1 Transactions Modal
function openTransactionModal(type = 'expense') {
  const form = document.getElementById('transaction-form');
  if (form) form.reset();

  document.getElementById('tx-id').value = '';
  document.getElementById('modal-tx-title').textContent = 'Novo Lançamento';

  // Toggle button state
  const typeBtns = document.querySelectorAll('.tx-type-toggle .type-btn');
  typeBtns.forEach(btn => {
    if (btn.getAttribute('data-type') === type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Populate categories
  populateCategorySelector(type);

  // Set default date to today or current month view
  const today = new Date();
  let defaultDateStr = today.toISOString().split('T')[0];
  document.getElementById('tx-date').value = defaultDateStr;

  openModal('modal-transaction');
}

function populateCategorySelector(type) {
  const grid = document.getElementById('category-selector-grid');
  const hiddenInput = document.getElementById('tx-category');
  if (!grid || !hiddenInput) return;

  const list = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  grid.innerHTML = '';

  list.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-btn ${idx === 0 ? 'selected' : ''}`;
    btn.innerHTML = `<span class="emoji">${cat.icon}</span><span>${cat.name}</span>`;
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      hiddenInput.value = cat.name;
    });
    grid.appendChild(btn);
  });

  // Default select first
  hiddenInput.value = list[0].name;
}

function handleSaveTransaction(e) {
  e.preventDefault();
  const txId = document.getElementById('tx-id').value;
  const activeTypeBtn = document.querySelector('.tx-type-toggle .type-btn.active');
  const type = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'expense';
  
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const description = document.getElementById('tx-description').value.trim();
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value;
  const paymentMethod = document.getElementById('tx-payment-method').value;

  if (isNaN(amount) || amount <= 0) {
    alert('Por favor, informe um valor válido maior que zero.');
    return;
  }

  if (txId) {
    // Edit
    const index = AppState.transactions.findIndex(t => t.id === txId);
    if (index !== -1) {
      AppState.transactions[index] = { id: txId, type, amount, description, category, date, paymentMethod };
    }
  } else {
    // New
    const newTx = {
      id: 'tx-' + Date.now(),
      type,
      amount,
      description,
      category,
      date,
      paymentMethod
    };
    AppState.transactions.unshift(newTx);
  }

  saveData();
  closeModal('modal-transaction');
  renderAll();
  showToast(type === 'income' ? 'Receita registrada!' : 'Despesa registrada!');
}

window.deleteTransaction = function(txId) {
  if (confirm('Deseja realmente excluir este lançamento?')) {
    AppState.transactions = AppState.transactions.filter(t => t.id !== txId);
    saveData();
    renderAll();
    showToast('Lançamento excluído.');
  }
};

// 5.2 Goals Modal
function openGoalModal() {
  const form = document.getElementById('goal-form');
  if (form) form.reset();

  document.getElementById('goal-id').value = '';
  document.getElementById('modal-goal-title').textContent = 'Novo Cofrinho';
  document.getElementById('goal-selected-icon').value = '✈️';

  document.querySelectorAll('#goal-icon-picker .icon-choice').forEach((b, i) => {
    if (i === 0) b.classList.add('active');
    else b.classList.remove('active');
  });

  openModal('modal-goal');
}

function handleSaveGoal(e) {
  e.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);
  const current = parseFloat(document.getElementById('goal-initial').value || 0);
  const deadline = document.getElementById('goal-deadline').value;
  const icon = document.getElementById('goal-selected-icon').value || '🐷';

  if (!name || isNaN(target) || target <= 0) {
    alert('Informe um nome e uma meta de valor válidos.');
    return;
  }

  const newGoal = {
    id: 'g-' + Date.now(),
    name,
    target,
    current: Math.max(0, current),
    deadline,
    icon
  };

  AppState.goals.push(newGoal);
  saveData();
  closeModal('modal-goal');
  renderAll();
  showToast('Cofrinho criado com sucesso! 🎉');
}

window.deleteGoal = function(goalId) {
  if (confirm('Deseja excluir este cofrinho? O saldo guardado nele será desconsiderado.')) {
    AppState.goals = AppState.goals.filter(g => g.id !== goalId);
    saveData();
    renderAll();
    showToast('Cofrinho excluído.');
  }
};

// 5.3 Goal Action (Deposit / Withdraw) Modal
window.openGoalActionModal = function(goalId, defaultAction = 'deposit') {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('action-goal-id').value = goal.id;
  document.getElementById('action-goal-name').textContent = `${goal.icon || '🐷'} ${goal.name}`;
  document.getElementById('action-goal-current-val').textContent = `R$ ${formatCurrency(goal.current)}`;
  document.getElementById('goal-action-amount').value = '';

  const depositTab = document.getElementById('action-deposit-tab');
  const withdrawTab = document.getElementById('action-withdraw-tab');

  if (defaultAction === 'deposit') {
    depositTab.classList.add('active');
    withdrawTab.classList.remove('active');
  } else {
    withdrawTab.classList.add('active');
    depositTab.classList.remove('active');
  }

  openModal('modal-goal-action');
};

function handleConfirmGoalAction(e) {
  e.preventDefault();
  const goalId = document.getElementById('action-goal-id').value;
  const amount = parseFloat(document.getElementById('goal-action-amount').value);
  const isDeposit = document.getElementById('action-deposit-tab').classList.contains('active');

  if (isNaN(amount) || amount <= 0) {
    alert('Informe um valor válido.');
    return;
  }

  const goal = AppState.goals.find(g => g.id === goalId);
  if (!goal) return;

  if (isDeposit) {
    goal.current = (goal.current || 0) + amount;
    showToast(`R$ ${formatCurrency(amount)} guardados no cofrinho! 🐷`);
  } else {
    if (amount > goal.current) {
      alert('Você não pode resgatar um valor maior do que o saldo atual no cofrinho.');
      return;
    }
    goal.current -= amount;
    showToast(`R$ ${formatCurrency(amount)} resgatados com sucesso.`);
  }

  saveData();
  closeModal('modal-goal-action');
  renderAll();
}

/* =========================================================
   6. Backup, Export & Restore Engine
   ========================================================= */

function exportToCSV() {
  if (AppState.transactions.length === 0) {
    alert('Não há transações para exportar.');
    return;
  }

  let csvContent = '\uFEFF'; // BOM for UTF-8 Excel compatibility
  csvContent += 'Data;Tipo;Categoria;Descricao;MetodoPagamento;Valor (R$)\n';

  AppState.transactions.forEach(t => {
    const typeLabel = t.type === 'income' ? 'Entrada' : 'Saída';
    const amountVal = t.amount.toString().replace('.', ',');
    csvContent += `"${t.date}";"${typeLabel}";"${t.category || ''}";"${t.description.replace(/"/g, '""')}";"${t.paymentMethod || ''}";"${amountVal}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finsmart_extrato_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Extrato CSV exportado com sucesso!');
}

function exportBackupJSON() {
  const backupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    transactions: AppState.transactions,
    goals: AppState.goals
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `finsmart_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Backup JSON baixado com sucesso!');
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (data.transactions && Array.isArray(data.transactions)) {
        AppState.transactions = data.transactions;
      }
      if (data.goals && Array.isArray(data.goals)) {
        AppState.goals = data.goals;
      }
      saveData();
      closeModal('modal-settings');
      renderAll();
      showToast('Backup restaurado com sucesso! 🎉');
    } catch (err) {
      alert('Erro ao importar arquivo JSON. Certifique-se de que é um backup válido.');
    }
  };
  reader.readAsText(file);
}

/* =========================================================
   7. Helper Utilities
   ========================================================= */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, iconClass = 'fa-circle-check') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.querySelector('.toast-icon').className = `toast-icon fa-solid ${iconClass}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

/* =========================================================
   FinSmart - Main Application Logic & State Engine (v2.0)
   ========================================================= */

// Default Categories
const DEFAULT_CATEGORIES = {
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

// Storage Keys (Completely backwards compatible)
const STORAGE_KEYS = {
  TRANSACTIONS: 'finsmart_transactions_v1',
  GOALS: 'finsmart_goals_v1',
  HIDE_VALUES: 'finsmart_hide_values',
  THEME: 'finsmart_theme',
  CUSTOM_CATEGORIES: 'finsmart_custom_categories_v1',
  SECURITY_ENABLED: 'finsmart_security_enabled_v1',
  PIN_CODE: 'finsmart_pin_code_v1',
  BIOMETRIC_ENABLED: 'finsmart_biometric_enabled_v1'
};

// Month Names in Portuguese
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// App State
const AppState = {
  transactions: [],
  goals: [],
  customCategories: { expense: [], income: [] },
  hideValues: false,
  theme: 'dark',
  activeTab: 'tab-home',
  
  // Period Filter State
  selectedPeriod: 'monthly', // 'daily', 'weekly', 'monthly', 'annual'
  periodRefDate: new Date(),
  
  // Security & Lock State
  securityEnabled: false,
  pinCode: '',
  biometricEnabled: true,
  isUnlocked: false,
  enteredPin: '',
  
  // Transactions Filter
  txTypeFilter: 'all',
  txCategoryFilter: 'all',
  txSearchQuery: ''
};

// Helper to get all categories (Default + Custom)
function getAllCategories(type = 'expense') {
  const base = DEFAULT_CATEGORIES[type] || [];
  const custom = (AppState.customCategories && AppState.customCategories[type]) || [];
  return [...base, ...custom];
}

/* =========================================================
   1. Initialization & Preservation of Data
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initAppState();
  bindEvents();
  checkSecurityOnStartup();
});

function initAppState() {
  // 1. Load Theme preference
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  applyTheme(savedTheme, false);

  // 2. Load Hide Values preference
  const savedHide = localStorage.getItem(STORAGE_KEYS.HIDE_VALUES);
  if (savedHide === 'true') {
    AppState.hideValues = true;
    document.body.classList.add('hide-values');
    updateEyeIcon();
  }

  // 3. Load Security Settings
  AppState.securityEnabled = localStorage.getItem(STORAGE_KEYS.SECURITY_ENABLED) === 'true';
  AppState.pinCode = localStorage.getItem(STORAGE_KEYS.PIN_CODE) || '';
  const savedBio = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  AppState.biometricEnabled = savedBio !== null ? savedBio === 'true' : true;

  // 4. Load Custom Categories
  const savedCats = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
  if (savedCats) {
    try {
      AppState.customCategories = JSON.parse(savedCats);
    } catch (e) {
      AppState.customCategories = { expense: [], income: [] };
    }
  }

  // 5. Load Existing User Transactions (100% Preserved)
  const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (savedTx) {
    try {
      AppState.transactions = JSON.parse(savedTx);
    } catch (e) {
      AppState.transactions = [];
    }
  }

  // 6. Load Existing Goals (100% Preserved)
  const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (savedGoals) {
    try {
      AppState.goals = JSON.parse(savedGoals);
      AppState.goals.forEach(g => {
        if (!Array.isArray(g.history)) g.history = [];
      });
    } catch (e) {
      AppState.goals = [];
    }
  }

  // Load sample data ONLY if user has completely empty state on first run
  if (!savedTx && AppState.transactions.length === 0) {
    generateSampleData();
  }

  // Set default date in transaction form to Today
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
      icon: '🛡️',
      history: [
        { id: 'gh-1', type: 'deposit', amount: 3000, date: `${currentYear}-07-10`, description: 'Aporte Inicial' },
        { id: 'gh-2', type: 'deposit', amount: 1500, date: `${currentYear}-08-05`, description: 'Economia do Salário' }
      ]
    },
    {
      id: 'g-2',
      name: 'Viagem de Férias',
      target: 3500,
      current: 2100,
      deadline: `${currentYear}-11-15`,
      icon: '✈️',
      history: [
        { id: 'gh-3', type: 'deposit', amount: 1500, date: `${currentYear}-06-20`, description: 'Início da Meta' },
        { id: 'gh-4', type: 'deposit', amount: 600, date: `${currentYear}-08-01`, description: 'Depósito Mensal' }
      ]
    },
    {
      id: 'g-3',
      name: 'Novo Smartphone',
      target: 2800,
      current: 1950,
      deadline: `${currentYear}-09-30`,
      icon: '📱',
      history: [
        { id: 'gh-5', type: 'deposit', amount: 1950, date: `${currentYear}-07-15`, description: 'Reserva para Celular' }
      ]
    }
  ];

  const makeDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const sampleTx = [
    { id: 'tx-1', type: 'income', amount: 4800, description: 'Salário Mensal', category: 'Salário', date: makeDate(currentYear, currentMonth, 5), paymentMethod: 'Transferência' },
    { id: 'tx-2', type: 'income', amount: 950, description: 'Projeto Freelance Web', category: 'Freelance', date: makeDate(currentYear, currentMonth, 12), paymentMethod: 'PIX' },
    { id: 'tx-3', type: 'expense', amount: 1350, description: 'Aluguel & Condomínio', category: 'Moradia', date: makeDate(currentYear, currentMonth, 6), paymentMethod: 'PIX' },
    { id: 'tx-4', type: 'expense', amount: 620.40, description: 'Compras Supermercado', category: 'Alimentação', date: makeDate(currentYear, currentMonth, 8), paymentMethod: 'Cartão de Crédito' },
    { id: 'tx-5', type: 'expense', amount: 180, description: 'Conta de Luz e Internet', category: 'Contas & Boletos', date: makeDate(currentYear, currentMonth, 10), paymentMethod: 'Boleto' },
    { id: 'tx-6', type: 'expense', amount: 125.50, description: 'Combustível / Posto', category: 'Transporte', date: makeDate(currentYear, currentMonth, 11), paymentMethod: 'Cartão de Débito' },
    { id: 'tx-7', type: 'expense', amount: 195, description: 'Jantar Restaurante', category: 'Lazer', date: makeDate(currentYear, currentMonth, 13), paymentMethod: 'PIX' },
    { id: 'tx-8', type: 'expense', amount: 89.90, description: 'Farmácia / Vitaminas', category: 'Saúde', date: makeDate(currentYear, currentMonth, 14), paymentMethod: 'Cartão de Crédito' }
  ];

  AppState.goals = sampleGoals;
  AppState.transactions = sampleTx;
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(AppState.transactions));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(AppState.goals));
  localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(AppState.customCategories));
  localStorage.setItem(STORAGE_KEYS.SECURITY_ENABLED, AppState.securityEnabled);
  localStorage.setItem(STORAGE_KEYS.PIN_CODE, AppState.pinCode);
  localStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, AppState.biometricEnabled);
}

/* =========================================================
   2. Security & Lock Screen Engine (PIN + Biometrics)
   ========================================================= */

function checkSecurityOnStartup() {
  const lockOverlay = document.getElementById('lock-screen-overlay');
  
  if (AppState.securityEnabled && AppState.pinCode) {
    AppState.isUnlocked = false;
    AppState.enteredPin = '';
    updatePinDots();
    if (lockOverlay) lockOverlay.classList.remove('hidden');
    
    // Auto-prompt for Biometrics if supported
    if (AppState.biometricEnabled && window.PublicKeyCredential) {
      setTimeout(() => {
        triggerBiometricAuth(true);
      }, 350);
    }
  } else {
    AppState.isUnlocked = true;
    if (lockOverlay) lockOverlay.classList.add('hidden');
    renderAll();
  }
}

function triggerBiometricAuth(silentFail = false) {
  // If Web Authentication API is available
  if (window.PublicKeyCredential && navigator.credentials) {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Try mock WebAuthn authentication assertion
    navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        timeout: 60000,
        userVerification: 'preferred'
      }
    }).then(assertion => {
      if (assertion) {
        unlockAppWithSuccess();
      }
    }).catch(err => {
      console.log('Biometrics not completed or fallback to PIN requested:', err);
      if (!silentFail) {
        // Simulated biometric confirmation for smartphone web browsers
        if (confirm('Simular Leitor Digital / Biometria do Celular?\nClique em OK para desbloquear instantaneamente com sua digital cadastrada.')) {
          unlockAppWithSuccess();
        }
      }
    });
  } else {
    if (!silentFail) {
      if (confirm('Simular Leitor Digital / Biometria do Celular?\nClique em OK para desbloquear instantaneamente com sua digital cadastrada.')) {
        unlockAppWithSuccess();
      }
    }
  }
}

function handleKeypadPress(key) {
  const errorMsg = document.getElementById('lock-error-msg');
  if (errorMsg) errorMsg.classList.add('hidden');

  if (AppState.enteredPin.length < 4) {
    AppState.enteredPin += key;
    updatePinDots();

    if (AppState.enteredPin.length === 4) {
      setTimeout(validateEnteredPin, 150);
    }
  }
}

function handleKeypadBackspace() {
  if (AppState.enteredPin.length > 0) {
    AppState.enteredPin = AppState.enteredPin.slice(0, -1);
    updatePinDots();
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll('#pin-dots .pin-dot');
  dots.forEach((dot, index) => {
    if (index < AppState.enteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function validateEnteredPin() {
  const errorMsg = document.getElementById('lock-error-msg');
  const targetPin = AppState.pinCode || '1234';

  if (AppState.enteredPin === targetPin) {
    unlockAppWithSuccess();
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
    AppState.enteredPin = '';
    updatePinDots();
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

function unlockAppWithSuccess() {
  AppState.isUnlocked = true;
  AppState.enteredPin = '';
  const lockOverlay = document.getElementById('lock-screen-overlay');
  if (lockOverlay) lockOverlay.classList.add('hidden');
  renderAll();
  showToast('Aplicativo desbloqueado! 🔓');
}

/* =========================================================
   3. Period Filtering Engine (Diário, Semanal, Mensal, Anual)
   ========================================================= */

function getPeriodDateRange() {
  const ref = new Date(AppState.periodRefDate);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  let startStr, endStr, displayLabel;

  if (AppState.selectedPeriod === 'daily') {
    const dStr = ref.toISOString().split('T')[0];
    startStr = dStr;
    endStr = dStr;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dStr === todayStr) {
      displayLabel = `Hoje, ${String(day).padStart(2, '0')} de ${MONTH_NAMES[month]}`;
    } else {
      displayLabel = `${String(day).padStart(2, '0')} de ${MONTH_NAMES[month]} de ${year}`;
    }
  } 
  else if (AppState.selectedPeriod === 'weekly') {
    // Current week (Monday to Sunday)
    const currentDay = ref.getDay(); // 0 is Sunday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(ref);
    monday.setDate(ref.getDate() + distanceToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startStr = monday.toISOString().split('T')[0];
    endStr = sunday.toISOString().split('T')[0];

    const mDay = String(monday.getDate()).padStart(2, '0');
    const mMonth = String(monday.getMonth() + 1).padStart(2, '0');
    const sDay = String(sunday.getDate()).padStart(2, '0');
    const sMonth = String(sunday.getMonth() + 1).padStart(2, '0');

    displayLabel = `Semana: ${mDay}/${mMonth} a ${sDay}/${sMonth}`;
  } 
  else if (AppState.selectedPeriod === 'annual') {
    startStr = `${year}-01-01`;
    endStr = `${year}-12-31`;
    displayLabel = `Ano de ${year}`;
  } 
  else {
    // Monthly (Default)
    const lastDay = new Date(year, month + 1, 0).getDate();
    startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    displayLabel = `${MONTH_NAMES[month]} de ${year}`;
  }

  return { startStr, endStr, displayLabel };
}

function getTransactionsForSelectedPeriod() {
  const { startStr, endStr } = getPeriodDateRange();
  return AppState.transactions.filter(t => t.date >= startStr && t.date <= endStr);
}

function changePeriod(delta) {
  const ref = new Date(AppState.periodRefDate);

  if (AppState.selectedPeriod === 'daily') {
    ref.setDate(ref.getDate() + delta);
  } else if (AppState.selectedPeriod === 'weekly') {
    ref.setDate(ref.getDate() + (delta * 7));
  } else if (AppState.selectedPeriod === 'monthly') {
    ref.setMonth(ref.getMonth() + delta);
  } else if (AppState.selectedPeriod === 'annual') {
    ref.setFullYear(ref.getFullYear() + delta);
  }

  AppState.periodRefDate = ref;
  renderAll();
}

function setPeriodMode(periodMode) {
  AppState.selectedPeriod = periodMode;
  document.querySelectorAll('.period-chip').forEach(chip => {
    if (chip.getAttribute('data-period') === periodMode) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  renderAll();
}

/* =========================================================
   4. Event Listeners & Interactions
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

  // Period Selector Chips
  document.querySelectorAll('.period-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const p = chip.getAttribute('data-period');
      if (p) setPeriodMode(p);
    });
  });

  // Period Navigation (< and > buttons)
  document.getElementById('prev-month-btn')?.addEventListener('click', () => changePeriod(-1));
  document.getElementById('next-month-btn')?.addEventListener('click', () => changePeriod(1));

  // Theme Toggles
  document.getElementById('toggle-theme-btn')?.addEventListener('click', () => {
    applyTheme(AppState.theme === 'light' ? 'dark' : 'light', true);
  });
  document.getElementById('set-theme-dark-btn')?.addEventListener('click', () => applyTheme('dark', true));
  document.getElementById('set-theme-light-btn')?.addEventListener('click', () => applyTheme('light', true));

  // Eye Icon Visibility Toggle
  document.getElementById('toggle-visibility-btn')?.addEventListener('click', toggleValuesVisibility);

  // Keypad Click Handlers
  document.querySelectorAll('.keypad-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleKeypadPress(btn.getAttribute('data-key'));
    });
  });
  document.getElementById('keypad-backspace-btn')?.addEventListener('click', handleKeypadBackspace);
  document.getElementById('keypad-bio-btn')?.addEventListener('click', () => triggerBiometricAuth(false));

  // Security Settings Handlers
  document.getElementById('security-lock-toggle')?.addEventListener('change', (e) => {
    if (e.target.checked && !AppState.pinCode) {
      openModal('modal-pin-setup');
      e.target.checked = false;
      return;
    }
    AppState.securityEnabled = e.target.checked;
    saveData();
    showToast(AppState.securityEnabled ? 'Bloqueio de segurança ativado! 🔒' : 'Bloqueio desativado 🔓');
  });

  document.getElementById('open-pin-setup-btn')?.addEventListener('click', () => {
    openModal('modal-pin-setup');
  });
  document.getElementById('test-biometrics-btn')?.addEventListener('click', () => {
    triggerBiometricAuth(false);
  });
  document.getElementById('pin-setup-form')?.addEventListener('submit', handleSavePin);

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

  // Transaction Form Submit (Handles both ADD and EDIT)
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
  document.querySelectorAll('#goal-icon-picker .icon-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#goal-icon-picker .icon-choice').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('goal-selected-icon').value = btn.getAttribute('data-icon');
    });
  });

  // Category Modal Openers & Picker
  document.getElementById('open-new-cat-from-tx-btn')?.addEventListener('click', () => {
    const activeTypeBtn = document.querySelector('.tx-type-toggle .type-btn.active');
    const type = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'expense';
    openCategoryModal(type);
  });
  document.getElementById('open-new-cat-from-settings-btn')?.addEventListener('click', () => {
    openCategoryModal('expense');
  });

  document.querySelectorAll('#cat-emoji-picker .emoji-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#cat-emoji-picker .emoji-choice').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('selected-cat-emoji').value = btn.getAttribute('data-emoji');
    });
  });

  document.getElementById('cat-type-expense-btn')?.addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('cat-type-income-btn').classList.remove('active');
  });
  document.getElementById('cat-type-income-btn')?.addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('cat-type-expense-btn').classList.remove('active');
  });

  document.getElementById('category-form')?.addEventListener('submit', handleSaveCategory);

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
  document.getElementById('open-settings-btn')?.addEventListener('click', () => {
    renderCustomCategoriesList();
    renderSettingsThemeButtons();
    renderSettingsSecurity();
    openModal('modal-settings');
  });
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
   5. Theme & Settings Renderers
   ========================================================= */

function applyTheme(themeName, showNotification = false) {
  AppState.theme = themeName;
  if (themeName === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  localStorage.setItem(STORAGE_KEYS.THEME, themeName);
  
  updateThemeIcon();
  renderSettingsThemeButtons();

  if (AppState.activeTab === 'tab-stats') {
    const periodTx = getTransactionsForSelectedPeriod();
    ChartsManager.renderCategoryChart(periodTx);
    ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.periodRefDate.getFullYear(), AppState.periodRefDate.getMonth());
  }

  if (showNotification) {
    showToast(themeName === 'light' ? 'Modo Claro ativado ☀️' : 'Modo Escuro ativado 🌙');
  }
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = AppState.theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    icon.style.color = AppState.theme === 'light' ? '#f59e0b' : '';
  }
}

function renderSettingsThemeButtons() {
  const darkBtn = document.getElementById('set-theme-dark-btn');
  const lightBtn = document.getElementById('set-theme-light-btn');
  if (darkBtn && lightBtn) {
    if (AppState.theme === 'light') {
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
    } else {
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
    }
  }
}

function renderSettingsSecurity() {
  const lockToggle = document.getElementById('security-lock-toggle');
  if (lockToggle) {
    lockToggle.checked = AppState.securityEnabled;
  }
}

function handleSavePin(e) {
  e.preventDefault();
  const p1 = document.getElementById('setup-new-pin').value;
  const p2 = document.getElementById('setup-confirm-pin').value;

  if (p1.length !== 4 || !/^\d{4}$/.test(p1)) {
    alert('O PIN deve conter exatamente 4 dígitos numéricos.');
    return;
  }

  if (p1 !== p2) {
    alert('Os PINs digitados não coincidem!');
    return;
  }

  AppState.pinCode = p1;
  AppState.securityEnabled = true;
  saveData();

  renderSettingsSecurity();
  closeModal('modal-pin-setup');
  showToast('Senha PIN definida e proteção ativada! 🛡️');
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
    icon.className = AppState.hideValues ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }
}

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

  if (tabId === 'tab-stats') {
    const periodTx = getTransactionsForSelectedPeriod();
    ChartsManager.renderCategoryChart(periodTx);
    ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.periodRefDate.getFullYear(), AppState.periodRefDate.getMonth());
  }
}

/* =========================================================
   6. Render Engine
   ========================================================= */

function renderAll() {
  const { displayLabel } = getPeriodDateRange();
  const displayEl = document.getElementById('current-month-display');
  if (displayEl) displayEl.textContent = displayLabel;

  renderHeaderBalances();
  renderHomeTab();
  renderTransactionsTab();
  renderGoalsTab();
  renderStatsTab();
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function renderHeaderBalances() {
  let totalBalance = 0;
  AppState.transactions.forEach(t => {
    if (t.type === 'income') totalBalance += Number(t.amount);
    if (t.type === 'expense') totalBalance -= Number(t.amount);
  });

  // Calculate totals for active period
  const periodTx = getTransactionsForSelectedPeriod();
  let periodIncome = 0;
  let periodExpense = 0;

  periodTx.forEach(t => {
    if (t.type === 'income') periodIncome += Number(t.amount);
    if (t.type === 'expense') periodExpense += Number(t.amount);
  });

  const balEl = document.getElementById('total-balance-value');
  const incEl = document.getElementById('month-income-value');
  const expEl = document.getElementById('month-expense-value');
  const badgeEl = document.getElementById('savings-rate-badge');

  if (balEl) balEl.textContent = formatCurrency(totalBalance);
  if (incEl) incEl.textContent = `+R$ ${formatCurrency(periodIncome)}`;
  if (expEl) expEl.textContent = `-R$ ${formatCurrency(periodExpense)}`;

  if (badgeEl) {
    if (periodIncome > 0) {
      const savedRate = Math.max(0, Math.round(((periodIncome - periodExpense) / periodIncome) * 100));
      badgeEl.textContent = `Economia: ${savedRate}%`;
      badgeEl.className = savedRate >= 20 ? 'badge badge-health' : 'badge';
    } else {
      badgeEl.textContent = 'Sem receitas';
      badgeEl.className = 'badge';
    }
  }
}

function renderHomeTab() {
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

  const homeTxContainer = document.getElementById('home-recent-transactions-list');
  if (homeTxContainer) {
    const periodTx = getTransactionsForSelectedPeriod().sort((a, b) => new Date(b.date) - new Date(a.date));

    if (periodTx.length === 0) {
      homeTxContainer.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-receipt"></i>
          <span>Nenhum lançamento no período selecionado.</span>
        </div>
      `;
    } else {
      homeTxContainer.innerHTML = periodTx.slice(0, 5).map(t => renderTransactionItemHtml(t)).join('');
    }
  }
}

function renderTransactionsTab() {
  const container = document.getElementById('full-transactions-list');
  const countLabel = document.getElementById('filtered-count-label');
  const catSelect = document.getElementById('transactions-category-filter');

  if (catSelect) {
    const currentVal = catSelect.value || 'all';
    catSelect.innerHTML = '<option value="all">Todas as Categorias</option>';
    const allCategories = new Set();
    [...getAllCategories('expense'), ...getAllCategories('income')].forEach(c => allCategories.add(c.name));
    allCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
    catSelect.value = currentVal;
  }

  let filtered = getTransactionsForSelectedPeriod();

  if (AppState.txTypeFilter !== 'all') {
    filtered = filtered.filter(t => t.type === AppState.txTypeFilter);
  }

  if (AppState.txCategoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === AppState.txCategoryFilter);
  }

  if (AppState.txSearchQuery) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(AppState.txSearchQuery) ||
      (t.category && t.category.toLowerCase().includes(AppState.txSearchQuery))
    );
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (countLabel) {
    countLabel.textContent = `${filtered.length} lançamento${filtered.length === 1 ? '' : 's'}`;
  }

  if (container) {
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-placeholder">
          <i class="fa-solid fa-magnifying-glass"></i>
          <span>Nenhum lançamento encontrado no período.</span>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(t => renderTransactionItemHtml(t)).join('');
    }
  }
}

function getCategoryIcon(categoryName, type) {
  const all = getAllCategories(type);
  const match = all.find(c => c.name === categoryName);
  return match ? match.icon : '🏷️';
}

function renderTransactionItemHtml(tx) {
  const isIncome = tx.type === 'income';
  const icon = getCategoryIcon(tx.category, tx.type);
  const sign = isIncome ? '+' : '-';
  const amountClass = isIncome ? 'income' : 'expense';

  return `
    <div class="transaction-item" id="item-${tx.id}" onclick="openEditTransactionModal('${tx.id}')">
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
          <button class="tx-action-edit" title="Editar Lançamento" onclick="event.stopPropagation(); openEditTransactionModal('${tx.id}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="tx-action-del" title="Excluir" onclick="event.stopPropagation(); deleteTransaction('${tx.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

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
              <div class="goal-info-title" style="cursor: pointer;" onclick="openGoalActionModal('${g.id}', 'deposit')">
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

function renderStatsTab() {
  const periodTx = getTransactionsForSelectedPeriod();

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};

  periodTx.forEach(t => {
    if (t.type === 'income') totalIncome += Number(t.amount);
    if (t.type === 'expense') {
      const amt = Number(t.amount);
      totalExpense += amt;
      const cat = t.category || 'Outros';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    }
  });

  const daysCount = AppState.selectedPeriod === 'daily' ? 1 : 
                    AppState.selectedPeriod === 'weekly' ? 7 : 
                    AppState.selectedPeriod === 'annual' ? 365 : 30;
  const dailyAvg = totalExpense / daysCount;
  const dailyEl = document.getElementById('stat-daily-avg');
  if (dailyEl) dailyEl.textContent = `R$ ${formatCurrency(dailyAvg)}`;

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
      netPctEl.textContent = `${pct}% da receita`;
    } else {
      netPctEl.textContent = 'Sem receitas no período';
    }
  }

  // Comparison
  const vsMonthEl = document.getElementById('stat-vs-last-month');
  const vsMonthSubEl = document.getElementById('stat-vs-last-month-sub');
  if (vsMonthEl && vsMonthSubEl) {
    vsMonthEl.textContent = `${periodTx.length}`;
    vsMonthSubEl.textContent = 'lançamentos neste período';
  }

  ChartsManager.renderCategoryChart(periodTx);
  ChartsManager.renderHistoryBarChart(AppState.transactions, AppState.periodRefDate.getFullYear(), AppState.periodRefDate.getMonth());
}

/* =========================================================
   7. Modals & Transaction Add / Edit CRUD
   ========================================================= */

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('hidden');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('hidden');
}

function openTransactionModal(type = 'expense') {
  const form = document.getElementById('transaction-form');
  if (form) form.reset();

  document.getElementById('tx-id').value = '';
  document.getElementById('modal-tx-title').textContent = 'Novo Lançamento';
  document.getElementById('save-tx-btn').textContent = 'Salvar Lançamento';

  const typeBtns = document.querySelectorAll('.tx-type-toggle .type-btn');
  typeBtns.forEach(btn => {
    if (btn.getAttribute('data-type') === type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  populateCategorySelector(type);

  const today = new Date();
  let defaultDateStr = today.toISOString().split('T')[0];
  document.getElementById('tx-date').value = defaultDateStr;

  openModal('modal-transaction');
}

// EDIT TRANSACTION IN-PLACE
window.openEditTransactionModal = function(txId) {
  const tx = AppState.transactions.find(t => t.id === txId);
  if (!tx) return;

  const form = document.getElementById('transaction-form');
  if (form) form.reset();

  document.getElementById('tx-id').value = tx.id;
  document.getElementById('modal-tx-title').textContent = 'Editar Lançamento ✏️';
  document.getElementById('save-tx-btn').textContent = 'Atualizar Lançamento';

  const typeBtns = document.querySelectorAll('.tx-type-toggle .type-btn');
  typeBtns.forEach(btn => {
    if (btn.getAttribute('data-type') === tx.type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  populateCategorySelector(tx.type, tx.category);

  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-description').value = tx.description;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-payment-method').value = tx.paymentMethod || 'PIX';

  openModal('modal-transaction');
};

function populateCategorySelector(type, selectedCategory = '') {
  const grid = document.getElementById('category-selector-grid');
  const hiddenInput = document.getElementById('tx-category');
  if (!grid || !hiddenInput) return;

  const list = getAllCategories(type);
  grid.innerHTML = '';

  const initialCat = selectedCategory || (list.length > 0 ? list[0].name : '');

  list.forEach((cat) => {
    const isSel = cat.name.toLowerCase() === initialCat.toLowerCase();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-btn ${isSel ? 'selected' : ''}`;
    btn.innerHTML = `<span class="emoji">${cat.icon}</span><span>${cat.name}</span>`;
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      hiddenInput.value = cat.name;
    });
    grid.appendChild(btn);
  });

  hiddenInput.value = initialCat;
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
    // EDIT IN-PLACE (No deletion/recreation required!)
    const index = AppState.transactions.findIndex(t => t.id === txId);
    if (index !== -1) {
      AppState.transactions[index] = { id: txId, type, amount, description, category, date, paymentMethod };
      showToast('Lançamento atualizado com sucesso! ✏️');
    }
  } else {
    // NEW TRANSACTION
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
    showToast(type === 'income' ? 'Receita registrada!' : 'Despesa registrada!');
  }

  saveData();
  closeModal('modal-transaction');
  renderAll();
}

window.deleteTransaction = function(txId) {
  if (confirm('Deseja realmente excluir este lançamento?')) {
    AppState.transactions = AppState.transactions.filter(t => t.id !== txId);
    saveData();
    renderAll();
    showToast('Lançamento excluído.');
  }
};

// Goals CRUD
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

  const initialHistory = [];
  if (current > 0) {
    initialHistory.push({
      id: 'gh-' + Date.now(),
      type: 'deposit',
      amount: current,
      date: new Date().toISOString().split('T')[0],
      description: 'Saldo Inicial'
    });
  }

  const newGoal = {
    id: 'g-' + Date.now(),
    name,
    target,
    current: Math.max(0, current),
    deadline,
    icon,
    history: initialHistory
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

window.openGoalActionModal = function(goalId, defaultAction = 'deposit') {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (!goal) return;

  if (!Array.isArray(goal.history)) goal.history = [];

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

  renderGoalHistoryList(goal.id);
  openModal('modal-goal-action');
};

function renderGoalHistoryList(goalId) {
  const goal = AppState.goals.find(g => g.id === goalId);
  const container = document.getElementById('goal-history-list');
  if (!container || !goal) return;

  const history = goal.history || [];
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-placeholder" style="padding: 12px;">
        <i class="fa-solid fa-clock-rotate-left" style="font-size: 20px;"></i>
        <span style="font-size: 11px;">Nenhuma movimentação registrada neste cofrinho.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(item => {
    const isDeposit = item.type === 'deposit';
    const iconClass = isDeposit ? 'deposit fa-arrow-down' : 'withdraw fa-arrow-up';
    const typeLabel = isDeposit ? 'Guardado (+)' : 'Resgatado (-)';
    const amountClass = isDeposit ? 'deposit' : 'withdraw';
    const sign = isDeposit ? '+' : '-';

    return `
      <div class="goal-history-item" id="gh-item-${item.id}">
        <div class="goal-hist-left">
          <div class="goal-hist-icon ${item.type}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="goal-hist-info">
            <span class="goal-hist-label">${typeLabel}</span>
            <span class="goal-hist-date">${formatDateBR(item.date)}</span>
          </div>
        </div>
        <div class="goal-hist-right">
          <span class="goal-hist-amount ${amountClass} sensitive-value">${sign}R$ ${formatCurrency(item.amount)}</span>
          <button type="button" class="goal-hist-del-btn" title="Estornar/Excluir lançamento" onclick="deleteGoalHistoryEntry('${goal.id}', '${item.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteGoalHistoryEntry = function(goalId, historyId) {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (!goal || !Array.isArray(goal.history)) return;

  const entryIndex = goal.history.findIndex(h => h.id === historyId);
  if (entryIndex === -1) return;

  const entry = goal.history[entryIndex];
  const typeText = entry.type === 'deposit' ? 'depósito (+)' : 'resgate (-)';

  if (confirm(`Deseja estornar/excluir este ${typeText} de R$ ${formatCurrency(entry.amount)}? O saldo do cofrinho será recalculado.`)) {
    if (entry.type === 'deposit') {
      goal.current = Math.max(0, goal.current - Number(entry.amount));
    } else {
      goal.current = Number(goal.current) + Number(entry.amount);
    }

    goal.history.splice(entryIndex, 1);
    saveData();

    document.getElementById('action-goal-current-val').textContent = `R$ ${formatCurrency(goal.current)}`;
    renderGoalHistoryList(goal.id);
    renderAll();
    showToast('Lançamento estornado do cofrinho!');
  }
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

  if (!Array.isArray(goal.history)) goal.history = [];
  const todayStr = new Date().toISOString().split('T')[0];

  if (isDeposit) {
    goal.current = (goal.current || 0) + amount;
    goal.history.unshift({
      id: 'gh-' + Date.now(),
      type: 'deposit',
      amount: amount,
      date: todayStr,
      description: 'Depósito no Cofrinho'
    });
    showToast(`R$ ${formatCurrency(amount)} guardados no cofrinho! 🐷`);
  } else {
    if (amount > goal.current) {
      alert('Você não pode resgatar um valor maior do que o saldo atual no cofrinho.');
      return;
    }
    goal.current -= amount;
    goal.history.unshift({
      id: 'gh-' + Date.now(),
      type: 'withdraw',
      amount: amount,
      date: todayStr,
      description: 'Resgate do Cofrinho'
    });
    showToast(`R$ ${formatCurrency(amount)} resgatados com sucesso.`);
  }

  saveData();
  document.getElementById('goal-action-amount').value = '';
  document.getElementById('action-goal-current-val').textContent = `R$ ${formatCurrency(goal.current)}`;
  renderGoalHistoryList(goal.id);
  renderAll();
}

// Categories Management
function openCategoryModal(type = 'expense') {
  const form = document.getElementById('category-form');
  if (form) form.reset();

  document.getElementById('new-cat-name').value = '';
  document.getElementById('selected-cat-emoji').value = '🐶';

  const expBtn = document.getElementById('cat-type-expense-btn');
  const incBtn = document.getElementById('cat-type-income-btn');

  if (type === 'income') {
    incBtn?.classList.add('active');
    expBtn?.classList.remove('active');
  } else {
    expBtn?.classList.add('active');
    incBtn?.classList.remove('active');
  }

  document.querySelectorAll('#cat-emoji-picker .emoji-choice').forEach((b, i) => {
    if (i === 0) b.classList.add('active');
    else b.classList.remove('active');
  });

  openModal('modal-category');
}

function handleSaveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('new-cat-name').value.trim();
  const emoji = document.getElementById('selected-cat-emoji').value || '🏷️';
  const isIncome = document.getElementById('cat-type-income-btn').classList.contains('active');
  const type = isIncome ? 'income' : 'expense';

  if (!name) {
    alert('Informe o nome da categoria.');
    return;
  }

  const existing = getAllCategories(type).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    alert('Já existe uma categoria com este nome!');
    return;
  }

  if (!AppState.customCategories) AppState.customCategories = { expense: [], income: [] };
  if (!AppState.customCategories[type]) AppState.customCategories[type] = [];

  AppState.customCategories[type].push({ name, icon: emoji, isCustom: true });
  saveData();

  closeModal('modal-category');
  populateCategorySelector(type, name);
  renderCustomCategoriesList();
  renderTransactionsTab();
  showToast(`Categoria "${name}" criada com sucesso! 🏷️`);
}

function renderCustomCategoriesList() {
  const container = document.getElementById('custom-categories-list');
  if (!container) return;

  const expenses = (AppState.customCategories && AppState.customCategories.expense) || [];
  const incomes = (AppState.customCategories && AppState.customCategories.income) || [];
  const allCustom = [
    ...expenses.map(c => ({ ...c, type: 'expense' })),
    ...incomes.map(c => ({ ...c, type: 'income' }))
  ];

  if (allCustom.length === 0) {
    container.innerHTML = `
      <div class="empty-placeholder" style="padding: 10px;">
        <span style="font-size: 11px;">Nenhuma categoria personalizada criada ainda.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = allCustom.map(c => `
    <div class="custom-cat-row">
      <div class="custom-cat-left">
        <span>${c.icon}</span>
        <strong>${escapeHtml(c.name)}</strong>
        <span class="cat-type-badge ${c.type === 'income' ? 'badge-income' : 'badge-expense'}">
          ${c.type === 'income' ? 'Receita' : 'Despesa'}
        </span>
      </div>
      <button type="button" class="btn-del-cat" title="Excluir Categoria" onclick="deleteCustomCategory('${c.name}', '${c.type}')">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

window.deleteCustomCategory = function(name, type) {
  if (confirm(`Deseja excluir a categoria personalizada "${name}"?`)) {
    if (AppState.customCategories && AppState.customCategories[type]) {
      AppState.customCategories[type] = AppState.customCategories[type].filter(c => c.name !== name);
      saveData();
      renderCustomCategoriesList();
      populateCategorySelector(type);
      renderTransactionsTab();
      showToast(`Categoria "${name}" excluída.`);
    }
  }
};

/* =========================================================
   8. Backup, Export & Restore Engine
   ========================================================= */

function exportToCSV() {
  if (AppState.transactions.length === 0) {
    alert('Não há transações para exportar.');
    return;
  }

  let csvContent = '\uFEFF';
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
    version: '2.0',
    exportDate: new Date().toISOString(),
    transactions: AppState.transactions,
    goals: AppState.goals,
    customCategories: AppState.customCategories,
    theme: AppState.theme,
    securityEnabled: AppState.securityEnabled,
    pinCode: AppState.pinCode
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
      if (data.customCategories) {
        AppState.customCategories = data.customCategories;
      }
      if (data.theme) {
        applyTheme(data.theme, false);
      }
      if (data.pinCode) {
        AppState.pinCode = data.pinCode;
        AppState.securityEnabled = data.securityEnabled || false;
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
   9. Helper Utilities
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

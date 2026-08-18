/* =========================================================
   FinSmart - Chart.js Manager & Dynamic Visualizations (v2.3)
   ========================================================= */

const ChartsManager = {
  pieChartInstance: null,
  barChartInstance: null,

  // Color Palette per category
  categoryColors: {
    'Alimentação': '#f97316',
    'Moradia': '#3b82f6',
    'Transporte': '#eab308',
    'Contas & Boletos': '#ec4899',
    'Lazer': '#a855f7',
    'Saúde': '#ef4444',
    'Educação': '#06b6d4',
    'Compras': '#10b981',
    'Salário': '#10b981',
    'Freelance': '#06b6d4',
    'Investimentos': '#8b5cf6',
    'Vendas': '#f59e0b',
    'Presentes': '#ec4899',
    'Outros': '#64748b'
  },

  getCategoryColor(categoryName) {
    if (this.categoryColors[categoryName]) {
      return this.categoryColors[categoryName];
    }
    const dynamicPalette = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#eab308', '#14b8a6', '#f43f5e', '#a855f7', '#84cc16', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return dynamicPalette[Math.abs(hash) % dynamicPalette.length];
  },

  // 1. Render or Update Category Donut Chart
  renderCategoryChart(filteredTransactions) {
    const canvas = document.getElementById('category-pie-chart');
    const legendContainer = document.getElementById('category-legend-list');
    if (!canvas || !legendContainer) return;

    // Filter expenses from current active period
    const expenses = (filteredTransactions || []).filter(t => t.type === 'expense');

    const categoryTotals = {};
    let totalExpense = 0;

    expenses.forEach(t => {
      const cat = t.category || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
      totalExpense += Number(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);
    const backgroundColors = labels.map(lbl => this.getCategoryColor(lbl));

    // Handle Empty State
    if (labels.length === 0) {
      if (this.pieChartInstance) {
        this.pieChartInstance.destroy();
        this.pieChartInstance = null;
      }
      legendContainer.innerHTML = `
        <div class="empty-placeholder" style="padding: 16px;">
          <i class="fa-solid fa-chart-pie" style="font-size: 24px;"></i>
          <span>Nenhuma despesa registrada neste período.</span>
        </div>
      `;
      return;
    }

    // Build Custom HTML Legend
    let legendHtml = '';
    const sortedCategories = labels.map(name => ({
      name,
      amount: categoryTotals[name],
      pct: ((categoryTotals[name] / totalExpense) * 100).toFixed(1),
      color: this.getCategoryColor(name)
    })).sort((a, b) => b.amount - a.amount);

    sortedCategories.forEach(item => {
      legendHtml += `
        <div class="legend-item">
          <div class="legend-left">
            <span class="legend-dot" style="background-color: ${item.color};"></span>
            <span>${item.name}</span>
          </div>
          <div>
            <span class="legend-pct">${item.pct}%</span>
            <span class="text-muted sensitive-value" style="font-size: 11px; margin-left: 6px;">(R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
          </div>
        </div>
      `;
    });
    legendContainer.innerHTML = legendHtml;

    const isLight = document.body.classList.contains('light-theme');
    
    // Chart.js Configuration
    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: isLight ? '#ffffff' : '#131b2e',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const pct = ((val / totalExpense) * 100).toFixed(1);
                return ` R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    };

    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }
    this.pieChartInstance = new Chart(canvas, chartConfig);
  },

  // 2. Render or Update Adaptive History & Comparison Bar Chart
  renderAdaptiveBarChart(transactions, periodMode, periodRefDate) {
    const canvas = document.getElementById('history-bar-chart');
    const titleEl = document.getElementById('history-bar-title');
    if (!canvas) return;

    const ref = new Date(periodRefDate);
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const day = ref.getDate();

    let labels = [];
    let incomeData = [];
    let expenseData = [];

    const formatShortBR = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayNum}`;
    };

    if (periodMode === 'daily') {
      if (titleEl) titleEl.textContent = 'Histórico dos Últimos 7 Dias';
      // 7 days ending at current ref date
      for (let i = 6; i >= 0; i--) {
        const d = new Date(year, month, day - i);
        const dStr = formatShortBR(d);
        labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);

        let dayInc = 0;
        let dayExp = 0;
        transactions.forEach(t => {
          if (t.date === dStr) {
            if (t.type === 'income') dayInc += Number(t.amount);
            if (t.type === 'expense') dayExp += Number(t.amount);
          }
        });
        incomeData.push(dayInc);
        expenseData.push(dayExp);
      }
    } 
    else if (periodMode === 'weekly') {
      if (titleEl) titleEl.textContent = 'Comparativo dos 7 Dias da Semana';
      const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const currentDay = ref.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(year, month, day + distanceToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const dStr = formatShortBR(d);
        labels.push(`${dayNames[i]} (${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')})`);

        let dayInc = 0;
        let dayExp = 0;
        transactions.forEach(t => {
          if (t.date === dStr) {
            if (t.type === 'income') dayInc += Number(t.amount);
            if (t.type === 'expense') dayExp += Number(t.amount);
          }
        });
        incomeData.push(dayInc);
        expenseData.push(dayExp);
      }
    } 
    else if (periodMode === 'annual') {
      if (titleEl) titleEl.textContent = `Meses do Ano de ${year}`;
      const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let m = 0; m < 12; m++) {
        labels.push(monthNamesShort[m]);
        const mStr = String(m + 1).padStart(2, '0');
        const prefix = `${year}-${mStr}`;

        let mInc = 0;
        let mExp = 0;
        transactions.forEach(t => {
          if (t.date && t.date.startsWith(prefix)) {
            if (t.type === 'income') mInc += Number(t.amount);
            if (t.type === 'expense') mExp += Number(t.amount);
          }
        });
        incomeData.push(mInc);
        expenseData.push(mExp);
      }
    } 
    else {
      // Monthly (Default): Last 6 Months
      if (titleEl) titleEl.textContent = 'Histórico dos Últimos 6 Meses';
      const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let i = 5; i >= 0; i--) {
        let targetMonth = month - i;
        let targetYear = year;
        if (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        labels.push(`${monthNamesShort[targetMonth]}/${String(targetYear).slice(2)}`);

        const mStr = String(targetMonth + 1).padStart(2, '0');
        const prefix = `${targetYear}-${mStr}`;

        let mInc = 0;
        let mExp = 0;
        transactions.forEach(t => {
          if (t.date && t.date.startsWith(prefix)) {
            if (t.type === 'income') mInc += Number(t.amount);
            if (t.type === 'expense') mExp += Number(t.amount);
          }
        });
        incomeData.push(mInc);
        expenseData.push(mExp);
      }
    }

    const isLight = document.body.classList.contains('light-theme');

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Entradas',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 6,
            maxBarThickness: 16
          },
          {
            label: 'Saídas',
            data: expenseData,
            backgroundColor: '#f43f5e',
            borderRadius: 6,
            maxBarThickness: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: isLight ? '#475569' : '#94a3b8',
              font: {
                family: 'Plus Jakarta Sans',
                size: 11,
                weight: '600'
              },
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                return ` ${label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: isLight ? '#64748b' : '#64748b',
              font: {
                family: 'Plus Jakarta Sans',
                size: 10,
                weight: '600'
              }
            }
          },
          y: {
            grid: {
              color: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: isLight ? '#64748b' : '#64748b',
              font: {
                family: 'Plus Jakarta Sans',
                size: 10
              },
              callback: function(value) {
                if (value >= 1000) {
                  return 'R$' + (value / 1000).toFixed(0) + 'k';
                }
                return 'R$' + value;
              }
            }
          }
        }
      }
    };

    if (this.barChartInstance) {
      this.barChartInstance.destroy();
    }
    this.barChartInstance = new Chart(canvas, chartConfig);
  }
};

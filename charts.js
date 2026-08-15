/* =========================================================
   FinSmart - Charts & Visualization Engine (Chart.js)
   ========================================================= */

const ChartsManager = {
  pieChartInstance: null,
  barChartInstance: null,

  // Palette for Categories
  categoryColors: {
    'Alimentação': '#f97316',     // Orange
    'Moradia': '#6366f1',         // Indigo
    'Transporte': '#0ea5e9',     // Sky Blue
    'Lazer': '#ec4899',           // Pink
    'Saúde': '#14b8a6',           // Teal
    'Educação': '#eab308',       // Yellow
    'Contas & Boletos': '#f43f5e',// Rose
    'Compras': '#a855f7',         // Purple
    'Salário': '#10b981',         // Green
    'Investimentos': '#06b6d4',   // Cyan
    'Freelance': '#3b82f6',       // Blue
    'Vendas': '#84cc16',          // Lime
    'Presentes': '#f472b6',       // Light Pink
    'Outros': '#64748b'           // Slate
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
  renderCategoryChart(transactions, currentYear, currentMonth) {
    const canvas = document.getElementById('category-pie-chart');
    const legendContainer = document.getElementById('category-legend-list');
    if (!canvas || !legendContainer) return;

    // Filter expenses in current selected month
    const expenses = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'expense' && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

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
        <div class="empty-placeholder">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Nenhuma despesa registrada neste mês.</span>
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

  // 2. Render or Update 6-Month History Bar Chart
  renderHistoryBarChart(transactions, currentYear, currentMonth) {
    const canvas = document.getElementById('history-bar-chart');
    if (!canvas) return;

    const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Generate the last 6 months list ending at currentYear/currentMonth
    const monthSlots = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      monthSlots.push({
        year: targetYear,
        month: targetMonth,
        label: `${monthNamesShort[targetMonth]}/${String(targetYear).slice(2)}`,
        income: 0,
        expense: 0
      });
    }

    // Accumulate transactions
    transactions.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      const y = d.getFullYear();
      const m = d.getMonth();

      const slot = monthSlots.find(s => s.year === y && s.month === m);
      if (slot) {
        if (t.type === 'income') {
          slot.income += Number(t.amount);
        } else if (t.type === 'expense') {
          slot.expense += Number(t.amount);
        }
      }
    });

    const labels = monthSlots.map(s => s.label);
    const incomeData = monthSlots.map(s => s.income);
    const expenseData = monthSlots.map(s => s.expense);

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
              color: '#94a3b8',
              font: {
                family: 'Plus Jakarta Sans',
                size: 11,
                weight: '600'
              },
              boxWidth: 12,
              usePointStyle: true
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
              color: '#64748b',
              font: {
                family: 'Plus Jakarta Sans',
                size: 10,
                weight: '600'
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#64748b',
              font: {
                family: 'Plus Jakarta Sans',
                size: 10
              },
              callback: function(value) {
                if (value >= 1000) {
                  return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                }
                return 'R$ ' + value;
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

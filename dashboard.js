// dashboard.js — renders charts and scan history table

const CHART_DEFAULTS = {
  color: { safe: '#22c55e', warning: '#f59e0b', danger: '#ef4444', blue: '#4f7cff' },
  font: { family: "'Segoe UI', system-ui, sans-serif", color: '#8892a4' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function scoreClass(score) {
  if (score < 35) return 'safe';
  if (score < 65) return 'warning';
  return 'danger';
}

function init() {
  const stats = window.ScanHistory.stats();
  const emptyEl = document.getElementById('emptyDash');
  const contentEl = document.getElementById('dashContent');

  if (!stats) {
    emptyEl.classList.remove('hidden');
    return;
  }
  contentEl.classList.remove('hidden');

  // ── Summary cards ──────────────────────────────────────────────────────────
  const grid = document.getElementById('statGrid');
  grid.innerHTML = `
    <div class="stat-card blue">
      <div class="stat-number">${stats.total}</div>
      <div class="stat-label">Total Scans</div>
    </div>
    <div class="stat-card red">
      <div class="stat-number">${stats.danger}</div>
      <div class="stat-label">High Risk</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-number">${stats.warning}</div>
      <div class="stat-label">Caution</div>
    </div>
    <div class="stat-card green">
      <div class="stat-number">${stats.safe}</div>
      <div class="stat-label">Likely Safe</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--accent)">${stats.avgRisk}</div>
      <div class="stat-label">Avg Risk Score</div>
    </div>
  `;

  // ── Chart.js global defaults ───────────────────────────────────────────────
  Chart.defaults.color = CHART_DEFAULTS.font.color;
  Chart.defaults.font.family = CHART_DEFAULTS.font.family;

  // ── Risk Score Distribution (bar chart) ───────────────────────────────────
  new Chart(document.getElementById('riskChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(stats.buckets),
      datasets: [{
        label: 'Scans',
        data: Object.values(stats.buckets),
        backgroundColor: ['#22c55e99', '#86efac99', '#fbbf2499', '#f9731699', '#ef444499'],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { stepSize: 1 }, grid: { color: '#2a2f45' } },
        x: { grid: { display: false } },
      }
    }
  });

  // ── Verdict Doughnut ───────────────────────────────────────────────────────
  new Chart(document.getElementById('verdictChart'), {
    type: 'doughnut',
    data: {
      labels: ['Likely Safe', 'Caution', 'High Risk'],
      datasets: [{
        data: [stats.safe, stats.warning, stats.danger],
        backgroundColor: [CHART_DEFAULTS.color.safe, CHART_DEFAULTS.color.warning, CHART_DEFAULTS.color.danger],
        borderColor: '#1e2335',
        borderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, boxWidth: 12 } },
      }
    }
  });

  // ── Top Red Flags (horizontal bar) ────────────────────────────────────────
  if (stats.topFlags.length) {
    new Chart(document.getElementById('flagChart'), {
      type: 'bar',
      data: {
        labels: stats.topFlags.map(([label]) => label.length > 35 ? label.slice(0, 35) + '…' : label),
        datasets: [{
          label: 'Times triggered',
          data: stats.topFlags.map(([, count]) => count),
          backgroundColor: '#4f7cff88',
          borderColor: '#4f7cff',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { stepSize: 1 }, grid: { color: '#2a2f45' } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        }
      }
    });
  } else {
    document.getElementById('flagChart').parentElement.innerHTML += '<p style="color:var(--muted);font-size:0.9rem;">Not enough data yet — scan more postings.</p>';
  }

  // ── History Table ──────────────────────────────────────────────────────────
  const tableContainer = document.getElementById('historyTable');
  const rows = stats.history.slice(0, 50).map(h => `
    <tr>
      <td style="color:var(--muted);font-size:0.82rem;white-space:nowrap;">${formatDate(h.timestamp)}</td>
      <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h.snippet.replace(/"/g, '&quot;')}">${h.snippet}</td>
      <td><span class="score-pill ${scoreClass(h.riskScore)}">${h.riskScore}</span></td>
      <td style="color:var(--muted);font-size:0.82rem;">${(h.flags || []).slice(0, 2).join(', ')}${h.flags?.length > 2 ? ` +${h.flags.length - 2} more` : ''}</td>
    </tr>`).join('');

  tableContainer.innerHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Posting snippet</th>
          <th>Score</th>
          <th>Top flags</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // ── Clear button ──────────────────────────────────────────────────────────
  document.getElementById('clearHistory').addEventListener('click', () => {
    if (confirm('Clear all scan history? This cannot be undone.')) {
      window.ScanHistory.clear();
      location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

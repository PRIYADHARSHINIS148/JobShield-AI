// popup.js — extension popup logic (inlines scam engine for self-contained extension)

const RED_FLAGS_EXT = [
  { severity: 'high', label: 'Upfront fee', patterns: ['registration fee', 'joining fee', 'security deposit', 'training fee', 'pay to join', 'advance fee', 'processing fee'] },
  { severity: 'high', label: 'Personal email contact', patterns: ['@gmail.com', '@yahoo.com', '@hotmail.com', '@rediffmail.com'] },
  { severity: 'high', label: 'No experience, high pay', patterns: ['no experience required', 'no experience needed', 'freshers earn', 'no qualification required'] },
  { severity: 'high', label: 'Guaranteed income', patterns: ['guaranteed income', 'guaranteed earnings', '100% guaranteed', 'assured income'] },
  { severity: 'high', label: 'Extreme urgency', patterns: ['limited seats', 'apply immediately', 'last chance', 'today only', 'act now'] },
  { severity: 'medium', label: 'Vague company', patterns: ['leading company', 'reputed company', 'company name confidential', 'undisclosed company'] },
  { severity: 'medium', label: 'Easy money language', patterns: ['easy money', 'earn while you sleep', 'passive income', 'earn from mobile', 'refer and earn'] },
  { severity: 'medium', label: 'Interview / training fee', patterns: ['interview fee', 'training material cost', 'buy starter kit', 'starter kit'] },
  { severity: 'low', label: 'Too-good-to-be-true', patterns: ['dream job', 'financial freedom', 'become rich', 'life changing opportunity'] },
];

function quickAnalyse(text) {
  const lower = text.toLowerCase();
  let score = 0;
  const flags = [];
  RED_FLAGS_EXT.forEach(f => {
    const hit = f.patterns.some(p => lower.includes(p));
    if (hit) {
      flags.push(f.label);
      score += f.severity === 'high' ? 25 : f.severity === 'medium' ? 12 : 5;
    }
  });
  score = Math.min(score, 99);
  let verdict, icon;
  if (score < 35) { verdict = 'safe'; icon = '✅ Likely Legitimate'; }
  else if (score < 65) { verdict = 'warning'; icon = '⚠️ Proceed With Caution'; }
  else { verdict = 'danger'; icon = '🚨 High Scam Risk'; }
  return { score, verdict, icon, flags };
}

document.getElementById('scanBtn').addEventListener('click', () => {
  const text = document.getElementById('jobText').value.trim();
  if (!text) return;
  const { score, verdict, icon, flags } = quickAnalyse(text);
  const salary = window.SalaryChecker?.checkSalary(text);
  const resultEl = document.getElementById('result');

  const salaryLine = salary
    ? `<div style="font-size:0.8rem;margin-top:0.4rem;color:#8892a4;">💰 Salary: ${salary.raw} · <span style="color:${salary.status==='ok'?'#22c55e':salary.status==='suspicious'?'#f59e0b':'#ef4444'}">${salary.badge}</span></div>`
    : '';

  const flagTags = flags.map(f => `<span class="flag-tag">${f}</span>`).join('');

  resultEl.innerHTML = `
    <div class="verdict ${verdict}">
      <span class="score">${score}</span>
      <strong>${icon}</strong>
      ${salaryLine}
      ${flags.length ? `<div class="flags">${flagTags}</div>` : '<div class="flags" style="color:#22c55e;">No red flags found</div>'}
    </div>
    <a class="open-link" href="#" id="openFull">Open full analysis in JobShield →</a>
  `;

  document.getElementById('openFull').addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: `http://localhost:5000/index.html?text=${encodeURIComponent(text)}` });
  });
});

// Load selected text from page if passed via message
chrome.storage?.local?.get('selectedText', ({ selectedText }) => {
  if (selectedText) {
    document.getElementById('jobText').value = selectedText;
    chrome.storage.local.remove('selectedText');
  }
});

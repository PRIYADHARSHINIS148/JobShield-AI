// app.js — JobShield scam detection engine (v2 — with all 4 new features)

// ─── RED FLAG DATABASE ────────────────────────────────────────────────────────
const RED_FLAGS = [
  { id: 'upfront_fee', severity: 'high', label: 'Upfront payment required',
    patterns: ['registration fee', 'joining fee', 'security deposit', 'training fee', 'pay to join', 'pay before', 'send money', 'advance fee', 'processing fee', 'application fee'],
    explanation: 'Legitimate employers never ask candidates to pay money before or during hiring.' },

  { id: 'whatsapp_only', severity: 'high', label: 'WhatsApp/personal contact only',
    patterns: ['contact on whatsapp', 'whatsapp only', 'message on whatsapp', 'call on whatsapp', '@gmail.com', '@yahoo.com', '@hotmail.com', '@rediffmail.com'],
    explanation: 'Real companies use official domain emails (@company.com). Gmail/Yahoo contacts are a major scam signal.' },

  { id: 'no_experience', severity: 'high', label: 'Unrealistic "no experience needed" claim',
    patterns: ['no experience required', 'no experience needed', 'freshers earn', 'no qualification required', 'anyone can apply', 'no skills required', 'zero experience'],
    explanation: 'High-paying jobs always require skills or experience. "No experience, high pay" is a classic lure.' },

  { id: 'guaranteed_income', severity: 'high', label: 'Guaranteed income promise',
    patterns: ['guaranteed income', 'guaranteed earnings', 'guaranteed salary', '100% guaranteed', 'assured income', 'earn guaranteed'],
    explanation: 'No legitimate employer can guarantee a specific income. This is fabricated to attract victims.' },

  { id: 'work_from_home_high_pay', severity: 'high', label: 'Extreme work-from-home pay claims',
    patterns: ['earn 50000 from home', 'earn 1 lakh from home', 'work from home earn', 'lakhs from home', 'earn daily from home'],
    explanation: 'Work-from-home jobs claiming extremely high earnings are almost always scams or pyramid schemes.' },

  { id: 'urgency', severity: 'high', label: 'Extreme urgency / pressure tactics',
    patterns: ['limited seats', 'only 5 seats', 'apply immediately', 'urgent hiring', 'last chance', 'today only', 'offer expires', 'act now', "don't miss", 'hurry'],
    explanation: 'Creating artificial urgency is a manipulation tactic to prevent you from researching the company.' },

  { id: 'vague_company', severity: 'medium', label: 'Vague or unnamed company',
    patterns: ['leading company', 'reputed company', 'mnc company', 'top company', 'well-known company', 'name will be disclosed', 'company name confidential', 'undisclosed company'],
    explanation: 'Legitimate companies are transparent about their identity. Hiding the company name is suspicious.' },

  { id: 'easy_money', severity: 'medium', label: 'Easy money / passive income language',
    patterns: ['easy money', 'earn while you sleep', 'passive income', 'make money online', 'extra income', 'earn from mobile', 'earn from phone', 'task based earning', 'like and earn', 'refer and earn'],
    explanation: 'These phrases are hallmarks of task scams, investment fraud, and multi-level marketing schemes.' },

  { id: 'gift_card', severity: 'medium', label: 'Gift cards or cryptocurrency payment',
    patterns: ['gift card', 'itunes card', 'amazon gift', 'bitcoin', 'crypto payment', 'usdt', 'pay in crypto', 'wire transfer'],
    explanation: 'Scammers prefer untraceable payment methods. Legitimate employers pay via bank transfer / cheque.' },

  { id: 'overqualified_pay', severity: 'medium', label: 'Suspiciously high pay for simple tasks',
    patterns: ['data entry earn', 'typing work earn', 'simple work high salary', 'copy paste earn', 'form filling earn'],
    explanation: 'Routine tasks never command exceptional salaries. Inflated pay for simple work is a lure tactic.' },

  { id: 'poor_language', severity: 'medium', label: 'Poor grammar / unprofessional language',
    patterns: ['kindly revert', 'do the needful', 'irregardless', 'as per my knowledge', 'intimate us', 'prepone'],
    explanation: 'While not definitive, extremely unprofessional language combined with other flags raises risk.' },

  { id: 'interview_fee', severity: 'medium', label: 'Fee for interview or training kit',
    patterns: ['interview fee', 'interview kit', 'training material cost', 'buy training kit', 'starter kit', 'buy starter'],
    explanation: 'Companies pay for their own training. Any cost charged to you before joining is a scam tactic.' },

  { id: 'too_good', severity: 'low', label: 'Too-good-to-be-true overall tone',
    patterns: ['dream job', 'change your life', 'financial freedom', 'become rich', 'become wealthy', 'life changing opportunity'],
    explanation: 'Emotional/aspirational language in job postings often signals a pitch rather than a real job.' },

  { id: 'foreign_company', severity: 'low', label: 'Unverified foreign company',
    patterns: ['uk company', 'us company', 'dubai company', 'canada company', 'singapore company', 'foreign company hiring', 'international company'],
    explanation: 'Legitimate foreign companies hiring in India use proper recruitment channels, not social media DMs.' },

  { id: 'no_interview', severity: 'low', label: 'No interview / instant selection',
    patterns: ['no interview', 'direct selection', 'selected already', 'you are selected', 'instant joining', 'immediate joining without interview'],
    explanation: 'Real companies always interview candidates. Skipping interviews is unusual and suspicious.' },
];

// ─── SCAM DETECTION ENGINE ────────────────────────────────────────────────────
function analysePosting(text) {
  const lower = text.toLowerCase();
  const triggered = [];
  for (const flag of RED_FLAGS) {
    const matched = flag.patterns.filter(p => lower.includes(p));
    if (matched.length) triggered.push({ ...flag, matched });
  }
  let score = 0;
  triggered.forEach(f => {
    if (f.severity === 'high') score += 25;
    else if (f.severity === 'medium') score += 12;
    else score += 5;
  });
  if (text.trim().length < 100) score += 10;
  score = Math.min(score, 99);
  let verdict, verdictLabel, verdictIcon;
  if (score < 35) { verdict = 'safe'; verdictLabel = 'Likely Legitimate'; verdictIcon = '✅'; }
  else if (score < 65) { verdict = 'warning'; verdictLabel = 'Proceed With Caution'; verdictIcon = '⚠️'; }
  else { verdict = 'danger'; verdictLabel = 'High Scam Risk'; verdictIcon = '🚨'; }
  return { riskScore: score, verdict, verdictLabel, verdictIcon, flags: triggered };
}

// ─── PATTERN HIGHLIGHTER ─────────────────────────────────────────────────────
function buildPatternHTML(text, flags) {
  if (!flags.length) return `<p class="no-flags-note">✓ No suspicious phrases detected in this posting.</p>`;
  const highlights = [];
  flags.forEach(flag => flag.matched.forEach(phrase => highlights.push({ phrase, severity: flag.severity, label: flag.label })));
  highlights.sort((a, b) => b.phrase.length - a.phrase.length);
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const used = new Set();
  highlights.forEach(({ phrase, severity, label }) => {
    if (used.has(phrase)) return;
    used.add(phrase);
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`(${escaped})`, 'gi'), `<mark class="${severity}-flag" title="${label}">$1</mark>`);
  });
  return html.replace(/\n/g, '<br>');
}

// ─── SALARY RENDER ────────────────────────────────────────────────────────────
function renderSalarySection(text) {
  const result = window.SalaryChecker.checkSalary(text);
  if (!result) return '';
  const fmt = n => '₹' + n.toLocaleString('en-IN');
  const usdWarn = result.isUSD ? '<span style="color:var(--red);font-size:0.8rem;"> ⚠️ Salary quoted in USD — very unusual for Indian job postings</span>' : '';
  return `
  <div class="result-section">
    <div class="section-title">💰 Salary Reality Check</div>
    <div class="salary-card">
      <div class="salary-row">
        <span class="salary-claimed">Claimed: ${result.raw}${usdWarn}</span>
        <span class="salary-badge ${result.status}">${result.badge}</span>
      </div>
      <div class="salary-range">
        Market rate for <strong>${result.role}</strong>${result.city ? ' in <strong>' + result.city.charAt(0).toUpperCase() + result.city.slice(1) + '</strong>' : ''}:
        <strong>${fmt(result.marketMin)} – ${fmt(result.marketMax)} / month</strong>
      </div>
      <div class="salary-explanation">${result.explanation}</div>
    </div>
  </div>`;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────
async function renderResult(text, analysis, aiHtml = '') {
  const { riskScore, verdict, verdictLabel, verdictIcon, flags } = analysis;
  const highFlags = flags.filter(f => f.severity === 'high');
  const medFlags  = flags.filter(f => f.severity === 'medium');
  const lowFlags  = flags.filter(f => f.severity === 'low');
  const allFlags  = [...highFlags, ...medFlags, ...lowFlags];

  const flagsHTML = (list) => list.map(f => `
    <div class="flag-item ${f.severity}">
      <span class="flag-sev">${f.severity}</span>
      <div>
        <strong>${f.label}</strong><br>
        <span style="color:var(--muted);font-size:0.85rem;">${f.explanation}</span>
      </div>
    </div>`).join('');

  const patternHTML  = buildPatternHTML(text, flags);
  const salaryHTML   = renderSalarySection(text);
  const contactsHTML = window.ContactAnalyser.renderContactsSection(text);
  const salaryResult = window.SalaryChecker.checkSalary(text);

  // Company verify (async — show placeholder first, fill in)
  const verifyResult = await window.CompanyVerifier.verifyCompany(text);
  const verifyHTML   = window.CompanyVerifier.renderCompanySection(verifyResult);
  const checklistHTML = window.ChecklistGenerator.renderChecklist(text, analysis, verifyResult, salaryResult);

  return `
    <div class="verdict-banner ${verdict}">
      <span class="verdict-icon">${verdictIcon}</span>
      <div class="verdict-text">
        <h2>${verdictLabel}</h2>
        <p>${flags.length} red flag${flags.length !== 1 ? 's' : ''} detected · Risk score ${riskScore}/99</p>
      </div>
      <div class="verdict-score">${riskScore}</div>
    </div>

    <div class="risk-meter">
      <div class="meter-bar"><div class="meter-fill" style="width:${riskScore}%"></div></div>
      <div class="meter-labels"><span>Safe</span><span>Caution</span><span>Danger</span></div>
    </div>

    ${aiHtml}

    ${salaryHTML}
    ${verifyHTML}
    ${contactsHTML}

    ${allFlags.length ? `
    <div class="result-section">
      <div class="section-title">🚩 Red Flags Found (${allFlags.length})</div>
      <div class="flags-list">${flagsHTML(allFlags)}</div>
    </div>` : `
    <div class="result-section">
      <div class="section-title">✅ No Red Flags</div>
      <p style="color:var(--muted)">No suspicious patterns detected. Always verify the company independently.</p>
    </div>`}

    <div class="result-section">
      <div class="section-title">🔬 Scam Pattern Explainer</div>
      <p style="color:var(--muted);font-size:0.85rem;margin-bottom:0.8rem;">Highlighted phrases triggered the red flags above. Hover to see which flag.</p>
      <div class="pattern-text">${patternHTML}</div>
      ${flags.length ? `<div class="pattern-legend">
        <div class="legend-item"><span class="legend-dot high"></span> High-risk phrase</div>
        <div class="legend-item"><span class="legend-dot medium"></span> Medium-risk phrase</div>
      </div>` : ''}
    </div>

    ${checklistHTML}

    <div class="result-section">
      <div class="section-title">🛡️ Emergency Contacts</div>
      <ul style="color:var(--muted);font-size:0.9rem;padding-left:1.2rem;line-height:2.2;">
        <li>National Cyber Crime Helpline: <strong>1930</strong></li>
        <li>Report online: <a href="https://cybercrime.gov.in" target="_blank">cybercrime.gov.in</a></li>
        <li>Verify company: <a href="https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do" target="_blank">MCA Company Registry</a></li>
        <li>Check phone: <a href="https://www.truecaller.com" target="_blank">Truecaller.com</a></li>
      </ul>
    </div>`;
}

// ─── OCR IMAGE HANDLING ──────────────────────────────────────────────────────
let ocrWorker = null;

async function getOcrWorker() {
  if (!ocrWorker) {
    ocrWorker = await Tesseract.createWorker('eng');
  }
  return ocrWorker;
}

async function runOCR(imageFile) {
  const statusEl = document.getElementById('ocrStatus');
  const extractBox = document.getElementById('extractedTextBox');
  const extractTA = document.getElementById('extractedText');
  const preview = document.getElementById('ocrPreview');

  statusEl.classList.remove('hidden');
  statusEl.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 auto 0.5rem;"></div><p>Reading text from image…</p>';
  extractBox.classList.add('hidden');

  // Show image preview
  const url = URL.createObjectURL(imageFile);
  preview.innerHTML = `<img src="${url}" alt="Uploaded screenshot" style="max-width:100%;border-radius:8px;margin-bottom:0.5rem;"/>`;
  preview.classList.remove('hidden');

  try {
    const worker = await getOcrWorker();
    const { data: { text } } = await worker.recognize(imageFile);
    statusEl.innerHTML = `<span style="color:var(--green)">✓ Text extracted successfully (${text.trim().length} characters)</span>`;
    extractTA.value = text.trim();
    extractBox.classList.remove('hidden');
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--red)">✗ OCR failed: ${err.message}. Try a clearer image.</span>`;
  }
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// Upload zone
const uploadZone = document.getElementById('uploadZone');
const imageFile  = document.getElementById('imageFile');
const uploadInner = document.getElementById('uploadInner');

uploadInner.addEventListener('click', () => imageFile.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) runOCR(file);
});
imageFile.addEventListener('change', () => {
  if (imageFile.files[0]) runOCR(imageFile.files[0]);
});
// ─── AI CONTROLS UI WIRING ───────────────────────────────────────────────────
const aiScanToggle = document.getElementById('aiScanToggle');
const aiSettingsBtn = document.getElementById('aiSettingsBtn');
const aiSettingsPanel = document.getElementById('aiSettingsPanel');
const geminiApiKey = document.getElementById('geminiApiKey');
const saveKeyBtn = document.getElementById('saveKeyBtn');

// Load saved settings
if (aiScanToggle) {
  aiScanToggle.checked = localStorage.getItem('ai_scan_enabled') === 'true';
  aiScanToggle.addEventListener('change', () => {
    localStorage.setItem('ai_scan_enabled', aiScanToggle.checked);
  });
}

if (aiSettingsBtn && aiSettingsPanel) {
  aiSettingsBtn.addEventListener('click', () => {
    aiSettingsPanel.classList.toggle('hidden');
  });
}

if (geminiApiKey) {
  geminiApiKey.value = localStorage.getItem('gemini_api_key') || '';
}

if (saveKeyBtn && geminiApiKey) {
  saveKeyBtn.addEventListener('click', () => {
    const key = geminiApiKey.value.trim();
    localStorage.setItem('gemini_api_key', key);
    alert('Gemini API Key saved locally!');
    aiSettingsPanel.classList.add('hidden');
  });
}

// ─── UI WIRING ────────────────────────────────────────────────────────────────
const scanBtn     = document.getElementById('scanBtn');
const clearBtn    = document.getElementById('clearBtn');
const jobInput    = document.getElementById('jobInput');
const loadingState = document.getElementById('loadingState');
const loadingMsg  = document.getElementById('loadingMsg');
const resultPanel = document.getElementById('resultPanel');

scanBtn.addEventListener('click', async () => {
  // Get text from active tab
  const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
  let text = activeTab === 'image'
    ? document.getElementById('extractedText').value.trim()
    : jobInput.value.trim();

  if (!text) {
    if (activeTab === 'image') alert('Please upload an image first and wait for OCR to complete.');
    else jobInput.focus();
    return;
  }

  loadingState.classList.remove('hidden');
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';
  loadingMsg.textContent = 'Analysing posting for scam patterns…';

  // Slight delay for UX
  await new Promise(r => setTimeout(r, 400));
  loadingMsg.textContent = 'Verifying company domain…';

  const analysis = analysePosting(text);

  let aiHtml = '';
  if (aiScanToggle && aiScanToggle.checked) {
    loadingMsg.textContent = 'Performing Gemini AI semantic review…';
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const response = await fetch('http://localhost:5000/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, apiKey })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const aiData = result.data;
          
          // Generate threat items
          const threatRows = (aiData.threats || []).map(t => {
            const isCritical = aiData.verdict === 'danger' || t.type.toLowerCase().includes('fee') || t.type.toLowerCase().includes('payment');
            return `
              <div class="ai-threat-item ${isCritical ? 'danger' : 'warning'}">
                <div class="ai-threat-title">⚠️ ${t.type}</div>
                <div class="ai-threat-desc">${t.description}</div>
              </div>`;
          }).join('');

          aiHtml = `
            <div class="ai-result-card">
              <div class="ai-result-header">
                <span class="ai-result-title">✨ Gemini Semantic Review</span>
                <span class="ai-badge">${aiData.verdict} · Risk: ${aiData.riskScore || 50}/99</span>
              </div>
              <div class="ai-summary">${aiData.summary}</div>
              
              ${threatRows ? `<div class="ai-threats-container">${threatRows}</div>` : ''}
              
              <div class="ai-advice-box">
                <span style="font-size:1.2rem;">🛡️</span>
                <div><strong>AI Safety Advice:</strong> ${aiData.advice || 'Verify all communication channels independently.'}</div>
              </div>
            </div>
          `;
        } else {
          console.warn('AI analysis returned unsuccessful:', result.message);
          aiHtml = `<div class="ai-result-card" style="border-left-color:var(--yellow)">
            <div class="ai-result-title" style="color:var(--yellow)">✨ AI Analysis Warning</div>
            <p style="font-size:0.88rem; color:var(--text-muted); margin-top:0.4rem;">${result.message || 'Unknown server error.'}</p>
          </div>`;
        }
      } else {
        const errText = await response.json().catch(() => ({ message: 'Server error or missing API key.' }));
        console.warn('AI analysis API failed:', errText);
        aiHtml = `<div class="ai-result-card" style="border-left-color:var(--yellow)">
          <div class="ai-result-title" style="color:var(--yellow)">✨ AI Analysis Warning</div>
          <p style="font-size:0.88rem; color:var(--text-muted); margin-top:0.4rem;">${errText.message || 'Configure your API key in settings or verify the backend server is running.'}</p>
        </div>`;
      }
    } catch (err) {
      console.error('Error during AI analysis fetch:', err);
      aiHtml = `<div class="ai-result-card" style="border-left-color:var(--yellow)">
        <div class="ai-result-title" style="color:var(--yellow)">✨ AI Analysis Offline</div>
        <p style="font-size:0.88rem; color:var(--text-muted); margin-top:0.4rem;">Could not connect to JobShield backend. Start the backend server (\`node server.js\`) to unlock semantic reviews.</p>
      </div>`;
    }
  }

  const html = await renderResult(text, analysis, aiHtml);

  // Save to history
  const snippet = text.slice(0, 120) + (text.length > 120 ? '…' : '');
  window.ScanHistory.add({
    snippet,
    riskScore: analysis.riskScore,
    verdict: analysis.verdict,
    flags: analysis.flags.map(f => f.label),
    salaryStatus: window.SalaryChecker.checkSalary(text)?.status || null,
    timestamp: new Date().toISOString(),
  });

  resultPanel.innerHTML = html;
  loadingState.classList.add('hidden');
  resultPanel.classList.remove('hidden');
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

clearBtn.addEventListener('click', () => {
  jobInput.value = '';
  document.getElementById('extractedText').value = '';
  document.getElementById('ocrPreview').classList.add('hidden');
  document.getElementById('extractedTextBox').classList.add('hidden');
  document.getElementById('ocrStatus').classList.add('hidden');
  resultPanel.classList.add('hidden');
  resultPanel.innerHTML = '';
  jobInput.focus();
});

jobInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') scanBtn.click();
});

// Check if text was passed from the extension in the URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const textParam = urlParams.get('text');
if (textParam) {
  if (jobInput) {
    jobInput.value = textParam;
    // Switch to text tab
    const tabTextBtn = document.querySelector('[data-tab="text"]');
    if (tabTextBtn) tabTextBtn.click();
    // Trigger the scan
    scanBtn.click();
  }
}

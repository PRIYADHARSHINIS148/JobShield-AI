// checklist.js — Personalised "Before You Apply" Checklist Generator

function generateChecklist(text, analysis, verifyResult, salaryResult) {
  const { riskScore, verdict, flags } = analysis;
  const flagIds = flags.map(f => f.id);

  const items = [];

  // ── Always-present items ───────────────────────────────────────────────────
  items.push({
    priority: 'always',
    icon: '🔍',
    task: 'Search the company name on Google',
    detail: verifyResult?.name
      ? `Search: "<strong>${verifyResult.name} company India reviews scam</strong>"`
      : 'Look for the company name mentioned in the posting',
    done: false,
  });

  items.push({
    priority: 'always',
    icon: '💼',
    task: 'Find the company on LinkedIn',
    detail: 'A real company has a verified LinkedIn page with employees. Fake ones don\'t.',
    done: false,
  });

  // ── Conditional: upfront fee ───────────────────────────────────────────────
  if (flagIds.includes('upfront_fee') || flagIds.includes('interview_fee')) {
    items.push({
      priority: 'critical',
      icon: '🚫',
      task: 'REFUSE any payment request immediately',
      detail: 'This posting asks for money. No legitimate employer in India charges candidates. Stop here.',
      done: false,
    });
  }

  // ── Conditional: personal email ────────────────────────────────────────────
  if (flagIds.includes('whatsapp_only')) {
    items.push({
      priority: 'high',
      icon: '✉️',
      task: 'Ask for an official company email address',
      detail: 'Request communication via a @company.com email, not Gmail/WhatsApp. Refusal = red flag.',
      done: false,
    });
  }

  // ── Conditional: salary suspicious ────────────────────────────────────────
  if (salaryResult && (salaryResult.status === 'suspicious' || salaryResult.status === 'extreme')) {
    items.push({
      priority: 'high',
      icon: '💰',
      task: 'Verify the salary claim independently',
      detail: `Check <a href="https://www.ambitionbox.com" target="_blank">AmbitionBox</a> or <a href="https://www.glassdoor.co.in" target="_blank">Glassdoor</a> for real salary data for this role. The claimed amount appears unrealistic.`,
      done: false,
    });
  }

  // ── Conditional: domain check ──────────────────────────────────────────────
  if (verifyResult?.domain) {
    items.push({
      priority: 'always',
      icon: '🌐',
      task: `Visit the company website: ${verifyResult.domain}`,
      detail: `Type <strong>${verifyResult.domain}</strong> directly in your browser. Check if it looks professional and has real contact info.`,
      done: false,
    });
  }

  // ── Conditional: vague company ─────────────────────────────────────────────
  if (flagIds.includes('vague_company')) {
    items.push({
      priority: 'high',
      icon: '🏢',
      task: 'Demand the company name before proceeding',
      detail: 'Any legitimate employer will tell you their name upfront. If they refuse, do not apply.',
      done: false,
    });
  }

  // ── Conditional: no interview ──────────────────────────────────────────────
  if (flagIds.includes('no_interview')) {
    items.push({
      priority: 'high',
      icon: '🎤',
      task: 'Insist on a proper interview process',
      detail: 'Ask for a video call interview on Google Meet or Zoom with an official company email invite. Reject "instant selection".',
      done: false,
    });
  }

  // ── Conditional: urgency ───────────────────────────────────────────────────
  if (flagIds.includes('urgency')) {
    items.push({
      priority: 'high',
      icon: '⏱️',
      task: 'Take your time — ignore artificial deadlines',
      detail: 'Real jobs don\'t disappear in hours. Urgency is a pressure tactic. Research thoroughly before responding.',
      done: false,
    });
  }

  // ── Always: offer letter ───────────────────────────────────────────────────
  if (verdict !== 'safe') {
    items.push({
      priority: 'always',
      icon: '📄',
      task: 'Request an official offer letter before sharing any documents',
      detail: 'Never share your Aadhaar, PAN, or bank details until you have a signed offer letter on company letterhead.',
      done: false,
    });
  }

  // ── Always: MCA check ─────────────────────────────────────────────────────
  items.push({
    priority: 'always',
    icon: '🏛️',
    task: 'Verify company registration on MCA portal',
    detail: `Visit <a href="https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do" target="_blank">mca.gov.in</a> — search the company name to confirm it's legally registered in India.`,
    done: false,
  });

  // ── High risk: report ─────────────────────────────────────────────────────
  if (verdict === 'danger') {
    items.push({
      priority: 'critical',
      icon: '🚔',
      task: 'Report this posting if it turns out to be a scam',
      detail: 'File a complaint at <a href="https://cybercrime.gov.in" target="_blank">cybercrime.gov.in</a> or call the National Cyber Crime Helpline: <strong>1930</strong>.',
      done: false,
    });
  }

  // Sort: critical first, then high, then always
  const order = { critical: 0, high: 1, always: 2 };
  items.sort((a, b) => order[a.priority] - order[b.priority]);

  return items;
}

function renderChecklist(text, analysis, verifyResult, salaryResult) {
  const items = generateChecklist(text, analysis, verifyResult, salaryResult);

  const priorityLabel = { critical: '🚨 Critical', high: '⚠️ Important', always: '✓ Always Do' };
  const priorityCls = { critical: 'critical', high: 'high', always: 'always' };

  const itemsHTML = items.map((item, i) => `
    <label class="checklist-item ${priorityCls[item.priority]}" for="chk${i}">
      <input type="checkbox" id="chk${i}" class="chk-box" onchange="updateChecklistProgress()"/>
      <span class="chk-icon">${item.icon}</span>
      <div class="chk-content">
        <span class="chk-task">${item.task}</span>
        <span class="chk-priority ${priorityCls[item.priority]}">${priorityLabel[item.priority]}</span>
        <span class="chk-detail">${item.detail}</span>
      </div>
    </label>`).join('');

  return `
  <div class="result-section">
    <div class="section-title">✅ Before You Apply — Personalised Checklist</div>
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">
      ${items.length} steps generated based on what was found in this posting. Check off as you go.
    </p>
    <div class="checklist-progress">
      <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
      <span class="progress-label" id="progressLabel">0 / ${items.length} complete</span>
    </div>
    <div class="checklist-items" id="checklistItems">
      ${itemsHTML}
    </div>
  </div>`;
}

// Called by checkbox onchange
function updateChecklistProgress() {
  const all = document.querySelectorAll('.chk-box');
  const done = document.querySelectorAll('.chk-box:checked').length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const fill = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done} / ${all.length} complete`;

  // Mark checked items visually
  all.forEach(box => {
    const item = box.closest('.checklist-item');
    if (box.checked) item.classList.add('checked');
    else item.classList.remove('checked');
  });
}

window.ChecklistGenerator = { renderChecklist };

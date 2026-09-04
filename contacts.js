// contacts.js — Phone Number & Email Analyser

const PERSONAL_DOMAINS = ['gmail.com','yahoo.com','yahoo.in','hotmail.com','outlook.com',
  'rediffmail.com','ymail.com','live.com','icloud.com','protonmail.com'];

const SUSPICIOUS_PREFIXES = ['+1','+44','+971','+65','+60','+27']; // US/UK/UAE/SG/MY/SA

// Extract all emails from text
function extractEmails(text) {
  const re = /[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi;
  return [...new Set(text.match(re) || [])];
}

// Extract all phone numbers from text
function extractPhones(text) {
  const re = /(?:\+?\d[\d\s\-().]{7,15}\d)/g;
  const raw = text.match(re) || [];
  // Filter: must have 7-15 digits
  return [...new Set(raw.filter(p => p.replace(/\D/g,'').length >= 7))];
}

function analyseEmail(email) {
  const lower = email.toLowerCase();
  const domain = lower.split('@')[1];
  const isPersonal = PERSONAL_DOMAINS.includes(domain);
  const isSuspiciousPattern = /\d{4,}@/.test(lower) || /hr\d+@/.test(lower) || /jobs?\d+@/.test(lower);

  let risk, note;
  if (isPersonal && isSuspiciousPattern) {
    risk = 'high';
    note = 'Personal email with number sequence — very common in scam postings';
  } else if (isPersonal) {
    risk = 'medium';
    note = 'Personal email domain — legitimate companies use @company.com';
  } else {
    risk = 'low';
    note = 'Company domain email — verify the domain is real';
  }
  return { email, domain, isPersonal, risk, note };
}

function analysePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  let risk = 'low', note = '';

  // Indian mobile: 10 digits starting with 6-9
  const isIndianMobile = digits.length === 10 && /^[6-9]/.test(digits);
  const isIndianWithCode = digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2]);

  const isForeign = SUSPICIOUS_PREFIXES.some(p => phone.trim().startsWith(p));
  const isWhatsAppMentioned = false; // checked separately in red flags

  if (isForeign) {
    risk = 'high';
    note = 'Foreign country code — unusual for Indian job postings, possible international scam';
  } else if (digits.length > 12) {
    risk = 'medium';
    note = 'Unusually long number — may be obfuscated to avoid detection';
  } else if (isIndianMobile || isIndianWithCode) {
    risk = 'low';
    note = 'Indian mobile number — verify via Truecaller or official company listing';
  } else {
    risk = 'medium';
    note = 'Non-standard number format';
  }

  // Check if same number repeated (copy-paste scam)
  return { phone, digits, risk, note };
}

function renderContactsSection(text) {
  const emails = extractEmails(text);
  const phones = extractPhones(text);

  if (!emails.length && !phones.length) return '';

  const emailRows = emails.map(e => {
    const a = analyseEmail(e);
    return `
      <div class="contact-item ${a.risk} contact-item-email" data-email="${e}">
        <span class="contact-icon">✉️</span>
        <div class="contact-details">
          <span class="contact-value">${a.email}</span>
          <span class="contact-note">${a.note}</span>
        </div>
        <span class="contact-risk ${a.risk}">${a.risk === 'high' ? '🚨 High' : a.risk === 'medium' ? '⚠️ Medium' : '✓ OK'}</span>
      </div>`;
  }).join('');

  const phoneRows = phones.map(p => {
    const a = analysePhone(p);
    const truecallerUrl = `https://www.truecaller.com/search/in/${a.digits.slice(-10)}`;
    return `
      <div class="contact-item ${a.risk} contact-item-phone" data-phone="${p}" data-digits="${a.digits}">
        <span class="contact-icon">📞</span>
        <div class="contact-details">
          <span class="contact-value">${p} <span class="truecaller-status-badge"></span></span>
          <span class="contact-note">${a.note} · <a href="${truecallerUrl}" target="_blank" style="color:var(--accent)">Check on Truecaller →</a></span>
        </div>
        <span class="contact-risk ${a.risk}">${a.risk === 'high' ? '🚨 High' : a.risk === 'medium' ? '⚠️ Medium' : '✓ OK'}</span>
      </div>`;
  }).join('');

  const hasHighRisk = [...emails.map(e => analyseEmail(e)), ...phones.map(p => analysePhone(p))]
    .some(a => a.risk === 'high');

  // Trigger verification check asynchronously after DOM renders
  setTimeout(() => {
    verifyContactsInline();
  }, 100);

  return `
  <div class="result-section">
    <div class="section-title">📬 Phone & Email Analyser</div>
    ${hasHighRisk ? `<div class="contact-alert">⚠️ High-risk contact details detected — do not call or email until you've verified this is a legitimate company.</div>` : ''}
    <div class="contacts-list">
      ${emailRows || ''}
      ${phoneRows || ''}
    </div>
  </div>`;
}

async function verifyContactsInline() {
  const phoneEls = document.querySelectorAll('.contact-item-phone');
  const emailEls = document.querySelectorAll('.contact-item-email');

  // 1. Fetch entire blacklist for email verification
  let blacklist = [];
  try {
    const blRes = await fetch('http://localhost:5000/api/blacklist');
    if (blRes.ok) {
      const blData = await blRes.json();
      blacklist = blData.blacklist || [];
    }
  } catch (e) {
    // Backend not running, skip central blacklist matching
    return;
  }

  // Verify emails against blacklist
  emailEls.forEach(el => {
    const emailVal = el.dataset.email.toLowerCase().trim();
    const match = blacklist.find(item => item.type === 'email' && item.value.toLowerCase().trim() === emailVal);
    if (match) {
      el.className = 'contact-item blacklist';
      el.querySelector('.contact-risk').outerHTML = `<span class="contact-risk blacklist">🚨 Blacklisted</span>`;
      el.querySelector('.contact-note').innerHTML = `⚠️ Central Blacklist match: "${match.reason}" (Reported by ${match.reportedBy})`;
    }
  });

  // 2. Call mock Truecaller lookup for each phone
  for (const el of phoneEls) {
    const rawPhone = el.dataset.phone;
    try {
      const res = await fetch(`http://localhost:5000/api/verify-phone?phone=${encodeURIComponent(rawPhone)}`);
      if (!res.ok) continue;
      const data = await res.json();

      const badgePlaceholder = el.querySelector('.truecaller-status-badge');
      const noteEl = el.querySelector('.contact-note');

      if (data && badgePlaceholder) {
        let badgeCls = 'clean';
        if (data.status === 'blacklist') badgeCls = 'blacklist';
        else if (data.status === 'suspicious' || data.status === 'danger') badgeCls = 'scam';
        else if (data.status === 'warning') badgeCls = 'warning';

        badgePlaceholder.outerHTML = `<span class="contact-badge-truecaller ${badgeCls}">📞 ${data.name}</span>`;

        let phoneDetails = `${data.reason} · <em>Carrier: ${data.carrier} (Spam Score: ${data.score}%)</em>`;
        if (noteEl) noteEl.innerHTML = phoneDetails;

        // Update container status styling
        if (data.status === 'blacklist') {
          el.className = 'contact-item blacklist contact-item-phone';
          el.querySelector('.contact-risk').outerHTML = `<span class="contact-risk blacklist">🚨 Blacklisted</span>`;
        } else if (data.status === 'danger' || data.status === 'suspicious') {
          el.className = 'contact-item scam contact-item-phone';
          el.querySelector('.contact-risk').outerHTML = `<span class="contact-risk high">🚨 High Risk</span>`;
        } else if (data.status === 'warning') {
          el.className = 'contact-item warning contact-item-phone';
          el.querySelector('.contact-risk').outerHTML = `<span class="contact-risk warning">⚠️ Medium</span>`;
        }
      }
    } catch (err) {
      console.warn("Error calling verify-phone API:", err);
    }
  }
}

window.ContactAnalyser = { renderContactsSection };

// verify.js — Company Verification Checker
// Extracts company name, checks domain existence via DNS-over-HTTPS, generates search links

const KNOWN_LEGIT = [
  'infosys', 'tcs', 'wipro', 'hcl', 'accenture', 'cognizant', 'capgemini',
  'ibm', 'microsoft', 'google', 'amazon', 'flipkart', 'zomato', 'swiggy',
  'paytm', 'byju', 'ola', 'uber', 'hdfc', 'icici', 'axis', 'sbi', 'reliance',
  'mahindra', 'tata', 'airtel', 'jio', 'vodafone', 'oracle', 'sap', 'adobe',
  'deloitte', 'kpmg', 'pwc', 'ey', 'ernst', 'myntra', 'nykaa', 'razorpay',
  'freshworks', 'zoho', 'phonepe', 'cred', 'meesho', 'dream11', 'mphasis',
  'tech mahindra', 'l&t', 'larsen', 'bajaj', 'hero', 'biocon', 'dr reddy'
];

// Extract company name from posting text
function extractCompanyName(text) {
  const patterns = [
    /company\s*(?:name)?[\s:–-]+([A-Z][A-Za-z0-9\s&.,'()-]{2,40}?)(?:\n|is hiring|pvt|ltd|limited|llp|inc)/i,
    /([A-Z][A-Za-z0-9\s&.]{2,30}?)\s+(?:Pvt\.?\s*Ltd\.?|Limited|LLP|Inc\.?|Technologies|Solutions|Services|Consulting)/i,
    /hiring\s+(?:at|for|by|from)\s+([A-Z][A-Za-z0-9\s&.]{2,30})/i,
    /^([A-Z][A-Za-z0-9\s&.]{3,30}?)\s+is\s+(?:hiring|looking|recruiting)/im,
    /employer\s*[:–]\s*([A-Za-z0-9\s&.]{3,40})/i,
    /organisation\s*[:–]\s*([A-Za-z0-9\s&.]{3,40})/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      return m[1].trim().replace(/\s+/g, ' ');
    }
  }
  return null;
}

// Extract domain from email in text
function extractDomain(text) {
  const emailRe = /[\w.+-]+@([\w-]+\.[\w.]{2,})/g;
  const domains = [];
  let m;
  while ((m = emailRe.exec(text)) !== null) {
    const domain = m[1].toLowerCase();
    // Skip personal email domains
    const personal = ['gmail.com','yahoo.com','hotmail.com','outlook.com','rediffmail.com','ymail.com','yahoo.in'];
    if (!personal.includes(domain)) domains.push(domain);
  }
  return domains.length ? domains[0] : null;
}

// Check domain via DNS-over-HTTPS (Cloudflare, no API key needed)
async function checkDomainExists(domain) {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const data = await res.json();
    // Status 0 = NOERROR (domain exists), 3 = NXDOMAIN (doesn't exist)
    return { exists: data.Status === 0, status: data.Status };
  } catch {
    return { exists: null, status: -1 }; // network error
  }
}

// Build Google search links for verification
function buildVerifyLinks(companyName) {
  const q = encodeURIComponent(companyName);
  return [
    { label: 'Google Search', url: `https://www.google.com/search?q=${q}+company+India`, icon: '🔍' },
    { label: 'MCA (Govt Registry)', url: `https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do`, icon: '🏛️', note: 'Search manually on MCA portal' },
    { label: 'LinkedIn', url: `https://www.linkedin.com/search/results/companies/?keywords=${q}`, icon: '💼' },
    { label: 'Glassdoor', url: `https://www.glassdoor.co.in/Search/results.htm?keyword=${q}`, icon: '⭐' },
    { label: 'Scam reports', url: `https://www.google.com/search?q=${q}+scam+OR+fraud+OR+fake+complaint+India`, icon: '🚨' },
  ];
}

async function verifyCompany(text) {
  const name = extractCompanyName(text);
  const domain = extractDomain(text);

  const result = {
    name,
    domain,
    isKnownLegit: false,
    domainExists: null,
    links: [],
    summary: '',
    status: 'unknown' // 'legit' | 'warning' | 'suspicious' | 'unknown'
  };

  if (!name && !domain) {
    result.summary = 'Could not identify a company name in this posting.';
    result.status = 'warning';
    return result;
  }

  // Check known legit companies
  const nameLower = (name || '').toLowerCase();
  result.isKnownLegit = KNOWN_LEGIT.some(k => nameLower.includes(k));

  // Check domain
  if (domain) {
    const { exists } = await checkDomainExists(domain);
    result.domainExists = exists;
  }

  // Build search links
  if (name) result.links = buildVerifyLinks(name);

  // Determine status
  if (result.isKnownLegit) {
    result.status = 'legit';
    result.summary = `"${name}" matches a known legitimate company. Still verify the posting is genuine — scammers impersonate real companies.`;
  } else if (domain && result.domainExists === false) {
    result.status = 'suspicious';
    result.summary = `The email domain "${domain}" does not appear to exist on the internet — strong scam indicator.`;
  } else if (domain && result.domainExists === true) {
    result.status = 'ok';
    result.summary = `Email domain "${domain}" exists. Verify the company name matches this domain independently.`;
  } else if (!domain && name) {
    result.status = 'warning';
    result.summary = `No official company email found. Use the links below to verify "${name}" is a real, registered company.`;
  }

  return result;
}

function renderCompanySection(verifyResult) {
  const { name, domain, domainExists, isKnownLegit, links, summary, status } = verifyResult;

  const statusConfig = {
    legit:      { cls: 'safe',    icon: '✅', label: 'Known Company' },
    ok:         { cls: 'safe',    icon: '✔',  label: 'Domain Verified' },
    warning:    { cls: 'warning', icon: '⚠️', label: 'Unverified' },
    suspicious: { cls: 'danger',  icon: '🚨', label: 'Domain Not Found' },
    unknown:    { cls: 'warning', icon: '❓', label: 'Unknown' },
  };
  const cfg = statusConfig[status] || statusConfig.unknown;

  const domainLine = domain
    ? `<div class="verify-row">
        <span class="verify-label">Email domain:</span>
        <span class="verify-value">${domain}
          ${domainExists === true ? '<span class="domain-badge ok">✓ Exists</span>' : ''}
          ${domainExists === false ? '<span class="domain-badge bad">✗ Not Found</span>' : ''}
          ${domainExists === null ? '<span class="domain-badge unknown">Could not check</span>' : ''}
        </span>
       </div>`
    : `<div class="verify-row"><span class="verify-label">Email domain:</span><span style="color:var(--red)">No official domain email found</span></div>`;

  const linksHTML = links.length
    ? `<div class="verify-links">${links.map(l =>
        `<a href="${l.url}" target="_blank" class="verify-link">${l.icon} ${l.label}</a>`
      ).join('')}</div>`
    : '';

  return `
  <div class="result-section">
    <div class="section-title">🏢 Company Verification</div>
    <div class="verify-card ${cfg.cls}">
      <div class="verify-header">
        <span class="verify-icon">${cfg.icon}</span>
        <div>
          <strong>${name || 'Unknown Company'}</strong>
          <span class="verify-badge ${cfg.cls}">${cfg.label}</span>
        </div>
      </div>
      ${domainLine}
      ${isKnownLegit ? '<div class="verify-row"><span class="verify-label">Status:</span><span style="color:var(--green)">✓ Matches known Indian company</span></div>' : ''}
      <div class="verify-summary">${summary}</div>
      ${linksHTML}
    </div>
  </div>`;
}

window.CompanyVerifier = { verifyCompany, renderCompanySection };

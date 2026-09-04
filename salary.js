// salary.js — Indian job market salary database & reality checker

const SALARY_DB = {
  // Format: keyword -> { monthly: [min, max] in INR, note }
  roles: [
    { keys: ['data entry', 'typing'], monthly: [10000, 18000], label: 'Data Entry' },
    { keys: ['data analyst', 'analytics'], monthly: [25000, 70000], label: 'Data Analyst' },
    { keys: ['software engineer', 'software developer', 'sde', 'backend', 'frontend', 'full stack', 'fullstack'], monthly: [30000, 150000], label: 'Software Engineer' },
    { keys: ['python developer', 'java developer', 'node developer'], monthly: [35000, 120000], label: 'Developer' },
    { keys: ['digital marketing', 'seo', 'social media'], monthly: [15000, 50000], label: 'Digital Marketing' },
    { keys: ['graphic design', 'graphic designer', 'ui ux', 'ui/ux'], monthly: [18000, 60000], label: 'Designer' },
    { keys: ['content writer', 'copywriter', 'writer'], monthly: [12000, 40000], label: 'Content Writer' },
    { keys: ['customer support', 'customer service', 'bpo', 'call center', 'telecaller'], monthly: [12000, 25000], label: 'Customer Support / BPO' },
    { keys: ['hr', 'human resource', 'recruiter', 'talent acquisition'], monthly: [18000, 55000], label: 'HR / Recruiter' },
    { keys: ['sales executive', 'sales representative', 'business development'], monthly: [15000, 45000], label: 'Sales Executive' },
    { keys: ['accountant', 'accounting', 'tally', 'finance executive'], monthly: [18000, 50000], label: 'Accountant' },
    { keys: ['project manager', 'project management'], monthly: [60000, 160000], label: 'Project Manager' },
    { keys: ['product manager'], monthly: [60000, 200000], label: 'Product Manager' },
    { keys: ['data scientist', 'machine learning', 'ml engineer', 'ai engineer'], monthly: [50000, 180000], label: 'Data Scientist / ML' },
    { keys: ['devops', 'cloud engineer', 'aws', 'azure'], monthly: [45000, 150000], label: 'DevOps / Cloud' },
    { keys: ['cybersecurity', 'security analyst', 'ethical hacker'], monthly: [35000, 130000], label: 'Cybersecurity' },
    { keys: ['teacher', 'faculty', 'tutor', 'educator'], monthly: [15000, 50000], label: 'Teacher / Educator' },
    { keys: ['medical', 'nurse', 'nursing', 'healthcare'], monthly: [18000, 60000], label: 'Healthcare' },
    { keys: ['logistics', 'supply chain', 'warehouse'], monthly: [15000, 40000], label: 'Logistics' },
    { keys: ['work from home', 'remote', 'freelance', 'part time', 'part-time', 'home based'], monthly: [8000, 25000], label: 'Work From Home / Part-time' },
  ],
  default: { monthly: [15000, 50000], label: 'General Role' }
};

// City multipliers (relative to national baseline)
const CITY_MULTIPLIER = {
  'bangalore': 1.4, 'bengaluru': 1.4,
  'mumbai': 1.35, 'pune': 1.2,
  'hyderabad': 1.25, 'chennai': 1.15,
  'delhi': 1.3, 'gurgaon': 1.3, 'noida': 1.2,
  'kolkata': 0.9, 'ahmedabad': 0.95,
  'jaipur': 0.85, 'lucknow': 0.85, 'bhopal': 0.82,
  'coimbatore': 0.9, 'kochi': 0.95, 'trivandrum': 0.9,
};

function detectCity(text) {
  const lower = text.toLowerCase();
  for (const city in CITY_MULTIPLIER) {
    if (lower.includes(city)) return { city, multiplier: CITY_MULTIPLIER[city] };
  }
  return { city: null, multiplier: 1.0 };
}

function detectRole(text) {
  const lower = text.toLowerCase();
  for (const role of SALARY_DB.roles) {
    if (role.keys.some(k => lower.includes(k))) return role;
  }
  return SALARY_DB.default;
}

// Extract salary figure from text — handles ₹, Rs, LPA, per month, per week, per day
function extractSalary(text) {
  const patterns = [
    // ₹X,XX,XXX or Rs X,XX,XXX
    { re: /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:per\s*(week|day|month|year|annum|lpa))?/gi, type: 'explicit' },
    // X LPA / X lakh per annum
    { re: /([\d.]+)\s*(?:lpa|lakh(?:s)?\s*per\s*annum|lakh(?:s)?\/(?:year|annum))/gi, type: 'lpa' },
    // X,XXX per week / month / day
    { re: /([\d,]+)\s*(?:per|\/)\s*(week|day|month|year)/gi, type: 'per_period' },
    // $X (USD — strong scam signal)
    { re: /\$([\d,]+(?:\.\d+)?)\s*(?:per\s*(week|day|month))?/gi, type: 'usd' },
  ];

  const results = [];

  for (const { re, type } of patterns) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      let amount = parseFloat(m[1].replace(/,/g, ''));
      let period = (m[2] || 'month').toLowerCase();
      let monthly, raw, currency = 'INR';

      if (type === 'lpa') {
        monthly = (amount * 100000) / 12;
        raw = `${amount} LPA`;
      } else if (type === 'usd') {
        currency = 'USD';
        monthly = amount * 84; // rough INR conversion
        period = period || 'month';
        raw = `$${amount} per ${period}`;
        if (period === 'week') monthly = (amount * 84) * 4.33;
        if (period === 'day') monthly = (amount * 84) * 22;
      } else {
        if (period === 'year' || period === 'annum') monthly = amount / 12;
        else if (period === 'week') monthly = amount * 4.33;
        else if (period === 'day') monthly = amount * 22;
        else monthly = amount;
        raw = `₹${m[1]} per ${period}`;
      }

      results.push({ monthly: Math.round(monthly), raw, currency, type });
    }
  }

  if (!results.length) return null;
  // Return highest found (scams usually quote the biggest number)
  return results.sort((a, b) => b.monthly - a.monthly)[0];
}

function checkSalary(text) {
  const extracted = extractSalary(text);
  if (!extracted) return null;

  const role = detectRole(text);
  const { city, multiplier } = detectCity(text);

  const marketMin = Math.round(role.monthly[0] * multiplier);
  const marketMax = Math.round(role.monthly[1] * multiplier);
  const claimed = extracted.monthly;

  let status, badge, explanation;

  if (claimed > marketMax * 3) {
    status = 'extreme';
    badge = '🚨 Extremely Suspicious';
    explanation = `This salary is ${Math.round(claimed / marketMax)}× the top of the typical range for ${role.label}${city ? ' in ' + city.charAt(0).toUpperCase() + city.slice(1) : ''}. This is a major red flag — scam postings routinely inflate salaries to lure applicants.`;
  } else if (claimed > marketMax * 1.5) {
    status = 'suspicious';
    badge = '⚠️ Suspiciously High';
    explanation = `Claimed salary is well above the market range for ${role.label}${city ? ' in ' + city.charAt(0).toUpperCase() + city.slice(1) : ''}. Could be legitimate for senior roles, but worth scrutinising.`;
  } else {
    status = 'ok';
    badge = '✓ Realistic Range';
    explanation = `Salary is within or near the expected market range for ${role.label}${city ? ' in ' + city.charAt(0).toUpperCase() + city.slice(1) : ''}.`;
  }

  return {
    raw: extracted.raw,
    claimedMonthly: claimed,
    marketMin,
    marketMax,
    role: role.label,
    city,
    status,
    badge,
    explanation,
    isUSD: extracted.currency === 'USD'
  };
}

window.SalaryChecker = { checkSalary };

// server.js — JobShield Backend Server
// Provides centralized blacklist database, Truecaller mock API, and Gemini AI Proxy

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');

// Initialize Database
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const seedBlacklist = [
      {
        id: 1,
        type: 'email',
        value: 'indigocareers.airport@gmail.com',
        reason: 'Indigo airline impersonation scam asking for registration fees',
        reportedBy: 'Priya Patel',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: 2,
        type: 'phone',
        value: '919876543210',
        reason: 'WhatsApp poacher claiming to represent Apex India and offering high salary YouTube task scam',
        reportedBy: 'Rahul Sharma',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 3,
        type: 'email',
        value: 'tcsrecruitmentindia@gmail.com',
        reason: 'Recruiter impersonating TCS using a Gmail address on WhatsApp',
        reportedBy: 'Demo Seeker',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString()
      }
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(seedBlacklist, null, 2), 'utf8');
  }
}

// Read database
function readBlacklist() {
  try {
    initDatabase();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return [];
  }
}

// Write database
function writeBlacklist(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

// 1. Get central blacklist
app.get('/api/blacklist', (req, res) => {
  const list = readBlacklist();
  res.json({ success: true, count: list.length, blacklist: list });
});

// 2. Report a scam/blacklist entry
app.post('/api/blacklist/report', (req, res) => {
  const { type, value, reason } = req.body;
  if (!type || !value || !reason) {
    return res.status(400).json({ success: false, message: 'Type, value, and reason are required.' });
  }

  const list = readBlacklist();
  const normalizedValue = value.toLowerCase().trim().replace(/[\s\-()]/g, '');

  // Check if already blacklisted
  const exists = list.some(item => {
    const itemVal = item.value.toLowerCase().trim().replace(/[\s\-()]/g, '');
    return itemVal === normalizedValue && item.type === type;
  });

  if (exists) {
    return res.json({ success: true, message: 'Item already exists in blacklist.' });
  }

  const newReport = {
    id: Date.now(),
    type,
    value: value.trim(),
    reason: reason.trim(),
    reportedBy: req.body.reportedBy || 'Anonymous Seeker',
    timestamp: new Date().toISOString()
  };

  list.push(newReport);
  writeBlacklist(list);

  res.json({ success: true, message: 'Successfully reported to central blacklist.', report: newReport });
});

// 3. Mock Truecaller number verification
app.get('/api/verify-phone', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone query parameter is required.' });
  }

  const digits = phone.replace(/\D/g, '');
  const list = readBlacklist();
  
  // Check if number is in blacklist (ends with matches to ignore code country differences)
  const isBlacklisted = list.some(item => {
    if (item.type !== 'phone') return false;
    const itemDigits = item.value.replace(/\D/g, '');
    return digits.endsWith(itemDigits) || itemDigits.endsWith(digits);
  });

  if (isBlacklisted) {
    const reportDetails = list.find(item => {
      if (item.type !== 'phone') return false;
      const itemDigits = item.value.replace(/\D/g, '');
      return digits.endsWith(itemDigits) || itemDigits.endsWith(digits);
    });

    return res.json({
      verified: false,
      score: 99,
      status: 'blacklist',
      name: '⚠️ Flagged Scam Recruiter',
      carrier: 'VoIP / Fake Connection',
      type: 'scam',
      reason: `Blacklisted: "${reportDetails.reason}" (Reported by ${reportDetails.reportedBy})`
    });
  }

  // Suspicious foreign prefixes (e.g. +1, +44, +971, +65, +60, +27)
  const foreignPrefixes = ['1', '44', '971', '65', '60', '27'];
  const hasForeignPrefix = foreignPrefixes.some(p => phone.trim().startsWith('+' + p) || phone.trim().startsWith(p));

  if (hasForeignPrefix) {
    return res.json({
      verified: false,
      score: 78,
      status: 'suspicious',
      name: '🚨 Overseas WhatsApp Lure',
      carrier: 'International VoIP',
      type: 'spam',
      reason: 'Overseas country code. Commonly used by task-scam operators using virtual numbers.'
    });
  }

  // Realistic mock responses based on digit checksums
  const lastDigit = parseInt(digits.slice(-1)) || 0;
  
  if (digits.length >= 10) {
    if (lastDigit % 3 === 0) {
      return res.json({
        verified: true,
        score: 12,
        status: 'clean',
        name: 'Amit Kumar (Job Recruiter)',
        carrier: 'Jio Mobile',
        type: 'clean',
        reason: 'Identified as standard recruiter number. Normal activity levels detected.'
      });
    } else if (lastDigit % 3 === 1) {
      return res.json({
        verified: true,
        score: 45,
        status: 'warning',
        name: 'Spam HR Services',
        carrier: 'Airtel',
        type: 'spam_warning',
        reason: 'Reported by 15+ users in the last 24 hours as high frequency cold-calling.'
      });
    } else {
      return res.json({
        verified: false,
        score: 85,
        status: 'danger',
        name: '🚨 Telegram Task Coordinator',
        carrier: 'Vi (Vodafone Idea)',
        type: 'scam',
        reason: 'Reported by 142 users as associated with "Like & Subscribe YouTube videos" prepaid tasks.'
      });
    }
  }

  res.json({
    verified: false,
    score: 50,
    status: 'warning',
    name: 'Unknown Number',
    carrier: 'Unidentified Telecom',
    type: 'unknown',
    reason: 'Non-standard number format. Be cautious.'
  });
});
// Helper function to extract JSON block from conversational text
function extractJSON(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
  } catch (e) {
    console.error("Error extracting JSON block:", e);
  }
  return text;
}

// 4. Gemini API Semantic Review Proxy
app.post('/api/analyze-ai', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Text body is required.' });
  }

  // Check client-provided key first, fallback to server process.env.GEMINI_API_KEY
  const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Gemini API Key is missing. Please configure it in the browser API Settings panel or backend .env file.'
    });
  }

  const prompt = `You are an expert cybersecurity analyst and recruitment fraud specialist protecting Indian job seekers.
Analyze this job posting description and perform a deep semantic review. Find risks like:
1. Requests for money (registration fee, training kit, documentation fee).
2. Phishing and identity theft (demanding Aadhaar, PAN card, bank details upfront).
3. YouTube video liking, Telegram prepaid tasks, or deposit-based task scams.
4. Extremely unrealistic salary levels (e.g. 5LPA for basic typing).
5. Vague descriptions or hidden company details.
6. Suspicious contact details (foreign VoIP phone numbers, Gmail addresses representing corporate entities).

Here is the job posting to analyze:
"""
${text}
"""

Output your response STRICTLY in valid JSON. No markdown backticks or conversational preambles. The schema must match:
{
  "verdict": "safe" | "warning" | "danger",
  "riskScore": number (0 to 99),
  "aiConfidence": "high" | "medium" | "low",
  "summary": "1-2 sentence friendly explanation of your verdict.",
  "threats": [
    {
      "type": "Name of threat (e.g. Upfront Fee Scam, Identity Theft Risk, Task Scam)",
      "description": "Short explanation of why you flagged this in the posting."
    }
  ],
  "advice": "Actionable, precise safety instruction for the candidate."
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, message: `Gemini API returned error: ${errText}` });
    }

    const data = await response.json();
    
    // Parse response
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('Empty response from Gemini model.');
    }

    // Use robust JSON extractor
    const cleanJson = extractJSON(generatedText.trim());
    const parsedResponse = JSON.parse(cleanJson);
    res.json({ success: true, data: parsedResponse });
  } catch (err) {
    console.error('Gemini API call failed:', err);
    res.status(500).json({ success: false, message: `Failed to perform AI analysis: ${err.message}` });
  }
});

// Start Server
initDatabase();
app.listen(PORT, () => {
  console.log(`JobShield backend running on port ${PORT}`);
});

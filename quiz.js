// quiz.js — Handles the quiz challenge game logic & certificate generation

const QUIZ_QUESTIONS = [
  {
    question: "You receive a WhatsApp message from a recruiter at 'TCS Pvt Ltd' using a Gmail address (tcsrecruitmentindia@gmail.com) claiming you're selected for a remote data entry job. What is the biggest red flag?",
    options: [
      "The job description mentions it is remote data entry.",
      "The recruiter initiated contact on WhatsApp.",
      "The recruiter claims to represent TCS but uses a personal Gmail address instead of an @tcs.com domain.",
      "There are no grammatical errors in the message."
    ],
    answer: 2,
    explanation: "Legitimate corporate recruiters use official corporate domain emails (like name@tcs.com) to communicate. Anyone can register a Gmail address like 'tcsrecruitmentindia@gmail.com' and claim to represent a large company."
  },
  {
    question: "A company called 'Star Solutions' offers you a position as an administrative assistant but says you must pay ₹950 for a 'security training kit' before receiving your offer letter. They promise this fee is 100% refundable. What should you do?",
    options: [
      "Pay the fee since it is only ₹950 and fully refundable.",
      "Refuse immediately. Legitimate companies never charge candidates any fees during hiring.",
      "Pay half the fee now and ask to deduct the rest from your first salary.",
      "Search the company register on MCA first; if they exist, pay it."
    ],
    answer: 1,
    explanation: "NO legitimate employer in India charges candidates for interviews, badges, laptops, training kits, or joining fees. Any request for money upfront — even if promised as refundable — is a scam."
  },
  {
    question: "A posting on Facebook for a 'Part-time YouTube Video Liker' claims you can earn ₹2,000 to ₹5,000 daily by simply liking videos. They pay you ₹150 for the first test task, then ask you to join a Telegram group and transfer ₹2,000 to unlock higher-paying tasks. What is this scam?",
    options: [
      "A YouTube Premium Affiliate Program promotion.",
      "A task-based prepaid scam (also known as deposit/investment scams).",
      "A digital marketing internship program.",
      "An Ad-Sense crowdsourcing test campaign."
    ],
    answer: 1,
    explanation: "This is a classic 'Task Scam'. They pay a tiny amount first to earn your trust, then coerce you into transferring money (under the guise of 'depositing' or 'prepaying' for tasks) before disappearing with your cash."
  },
  {
    question: "You are looking at a salary offer of ₹15,00,000 per year (15 LPA) for a junior copywriter position with 'flexible 2 hours daily work from home, zero experience required'. What is suspicious about this?",
    options: [
      "The salary description mentions 'LPA' instead of monthly terms.",
      "Copywriters cannot work remotely.",
      "The salary is extremely inflated (5-6x market rates) for simple work requiring no experience.",
      "The description does not mention the name of the tools you will use."
    ],
    answer: 2,
    explanation: "Routine tasks with zero experience requirements never command executive-level salaries. Scammers use highly inflated pay figures as bait to attract desperate job seekers."
  },
  {
    question: "A recruiter sends you a job offer letter on WhatsApp within 10 minutes of a text-only chat interview, without any voice or video calls. They demand your Aadhaar card and PAN card details immediately to 'register your payroll'. How should you react?",
    options: [
      "Send the documents quickly so you don't lose the opportunity.",
      "Ask them to call you on a personal phone number first, then send it.",
      "Refuse. Real companies conduct formal interviews and do not rush for sensitive identity documents without proper verification.",
      "Send only your Aadhaar card but blur out your address details."
    ],
    answer: 2,
    explanation: "Instant selection via text chat is a major warning sign. Scammers rush you for personal documents (Aadhaar, PAN) to steal your identity, apply for loans in your name, or open mule bank accounts."
  }
];

document.addEventListener('DOMContentLoaded', () => {
  let currentQuestionIndex = 0;
  let score = 0;
  let hasAnswered = false;

  const quizHeader = document.getElementById('quizHeader');
  const quizProgress = document.getElementById('quizProgress');
  const quizProgressFill = document.getElementById('quizProgressFill');
  const questionCounter = document.getElementById('questionCounter');
  const scoreTracker = document.getElementById('scoreTracker');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');
  const explanationBox = document.getElementById('explanationBox');
  const nextBtn = document.getElementById('nextBtn');
  const quizContent = document.getElementById('quizContent');
  const quizResult = document.getElementById('quizResult');

  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultScore = document.getElementById('resultScore');
  const resultText = document.getElementById('resultText');
  const certificateContainer = document.getElementById('certificateContainer');
  const certNameInput = document.getElementById('certNameInput');
  const certNameOutput = document.getElementById('certNameOutput');
  const certGenerateBtn = document.getElementById('certGenerateBtn');
  const certId = document.getElementById('certId');
  const restartBtn = document.getElementById('restartBtn');

  // Pre-fill user name if logged in
  const user = window.Auth?.getCurrentUser();
  if (user) {
    certNameInput.value = user.name;
    certNameOutput.textContent = user.name;
  }

  function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    hasAnswered = false;
    quizContent.classList.remove('hidden');
    quizResult.classList.add('hidden');
    quizHeader.classList.remove('hidden');
    quizProgress.classList.remove('hidden');
    loadQuestion();
  }

  function loadQuestion() {
    hasAnswered = false;
    nextBtn.classList.add('hidden');
    explanationBox.classList.add('hidden');
    explanationBox.innerHTML = '';
    
    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${QUIZ_QUESTIONS.length}`;
    scoreTracker.textContent = `Score: ${score} / ${currentQuestionIndex}`;
    questionText.textContent = q.question;

    // Update progress bar
    const pct = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;
    quizProgressFill.style.width = pct + '%';

    optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-marker" style="color:var(--text-muted);font-weight:700;">${String.fromCharCode(65 + idx)}.</span> ${opt}`;
      btn.addEventListener('click', () => handleOptionClick(idx));
      optionsContainer.appendChild(btn);
    });
  }

  function handleOptionClick(selectedIdx) {
    if (hasAnswered) return;
    hasAnswered = true;

    const q = QUIZ_QUESTIONS[currentQuestionIndex];
    const optionButtons = optionsContainer.querySelectorAll('.quiz-opt-btn');

    optionButtons.forEach((btn, idx) => {
      // Disable hover effects/clicks
      btn.style.cursor = 'default';
      
      if (idx === q.answer) {
        btn.classList.add('correct');
        btn.querySelector('.opt-marker').style.color = 'var(--green)';
      } else if (idx === selectedIdx) {
        btn.classList.add('wrong');
        btn.querySelector('.opt-marker').style.color = 'var(--red)';
      }
    });

    if (selectedIdx === q.answer) {
      score++;
    }

    scoreTracker.textContent = `Score: ${score} / ${currentQuestionIndex + 1}`;

    // Show explanation
    explanationBox.innerHTML = `<strong>💡 Explanation:</strong> ${q.explanation}`;
    explanationBox.classList.remove('hidden');
    
    // Show next button
    nextBtn.classList.remove('hidden');
    nextBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < QUIZ_QUESTIONS.length) {
      loadQuestion();
    } else {
      showResults();
    }
  });

  function showResults() {
    quizContent.classList.add('hidden');
    quizHeader.classList.add('hidden');
    quizProgress.classList.add('hidden');
    
    resultScore.textContent = `${score} / ${QUIZ_QUESTIONS.length}`;
    quizResult.classList.remove('hidden');

    if (score === QUIZ_QUESTIONS.length) {
      resultIcon.textContent = '🏆';
      resultTitle.textContent = 'Flawless Scam Immunity!';
      resultText.textContent = 'Outstanding! You identified every scam pattern successfully. Your awareness levels are extremely high.';
      certificateContainer.classList.remove('hidden');
      generateCertId();
    } else if (score >= 4) {
      resultIcon.textContent = '🛡️';
      resultTitle.textContent = 'Certified Safe Seeker!';
      resultText.textContent = 'Excellent! You spotted most of the scams. You are well prepared to browse jobs safely.';
      certificateContainer.classList.remove('hidden');
      generateCertId();
    } else {
      resultIcon.textContent = '⚠️';
      resultTitle.textContent = 'Needs Review';
      resultText.textContent = 'Some scams slipped past you. Read the explanations carefully and check our guides before applying to suspicious job ads.';
      certificateContainer.classList.add('hidden');
    }
    quizResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function generateCertId() {
    const num = Math.floor(10000 + Math.random() * 90000);
    certId.textContent = `JS-${num}`;
  }

  certGenerateBtn.addEventListener('click', () => {
    const name = certNameInput.value.trim() || 'Job Seeker';
    certNameOutput.textContent = name;
  });

  restartBtn.addEventListener('click', startQuiz);

  // Initialize
  startQuiz();
});

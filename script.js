// --- Simple Typing Test Logic ---
const WORDS = ("the quick brown fox jumps over the lazy dog " +
  "lorem ipsum dolor sit amet consectetur adipiscing elit " +
  "keyboard typing speed accuracy practice code chatgpt openai sample test").split(/\s+/).filter(Boolean);

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const wordsEl = document.getElementById('words');
const input = document.getElementById('input');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('acc');
const countsEl = document.getElementById('counts');
const historyEl = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistory');

let timeLimit = 30;
document.querySelectorAll('.timer-select button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.timer-select button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    timeLimit = Number(b.dataset.time);
    timerEl.textContent = timeLimit + 's';
    reset();
  });
});

let words = [];
let currentIndex = 0;
let correct = 0;
let incorrect = 0;
let totalTypedChars = 0;
let started = false;
let remaining = timeLimit;
let timerId = null;

// --- Helper Functions ---
function pickWords(count = 50) {
  return Array.from({ length: count }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
}

function renderWords() {
  wordsEl.innerHTML = '';
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.textContent = w + (i < words.length - 1 ? ' ' : '');
    span.dataset.idx = i;
    if (i === currentIndex) span.classList.add('current');
    wordsEl.appendChild(span);
  });
  const cur = wordsEl.querySelector('.current');
  if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function updateStats() {
  const minutes = timeLimit / 60;
  const wpm = Math.round(correct / minutes);
  const accuracy = totalTypedChars ? Math.round(((totalTypedChars - incorrect) / totalTypedChars) * 100) : 100;
  wpmEl.textContent = isFinite(wpm) ? wpm : 0;
  accEl.textContent = accuracy + '%';
  countsEl.textContent = `${correct} / ${incorrect}`;
  renderHistory();
}

function saveHistory(record) {
  const arr = JSON.parse(localStorage.getItem('lj_history') || '[]');
  arr.unshift(record);
  localStorage.setItem('lj_history', JSON.stringify(arr.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  const arr = JSON.parse(localStorage.getItem('lj_history') || '[]');
  historyEl.innerHTML = '';
  if (!arr.length) return historyEl.innerHTML = '<div class="small">No results yet</div>';
  arr.slice(0, 8).forEach(r => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div style="font-weight:700">${r.wpm} WPM</div><div class="small">${r.accuracy}% • ${r.time}s</div>`;
    historyEl.appendChild(row);
  });
}

function reset() {
  clearInterval(timerId);
  words = pickWords(70);
  currentIndex = 0;
  correct = 0;
  incorrect = 0;
  totalTypedChars = 0;
  started = false;
  remaining = timeLimit;
  input.value = '';
  input.disabled = true;
  timerEl.textContent = remaining + 's';
  renderWords();
  updateStats();
}

function start() {
  if (started) return;
  started = true;
  input.disabled = false;
  input.focus();
  const startTime = Date.now();

  timerId = setInterval(() => {
    remaining = Math.max(0, timeLimit - Math.floor((Date.now() - startTime) / 1000));
    timerEl.textContent = remaining + 's';
    if (remaining <= 0) endTest();
  }, 200);
}

function endTest() {
  clearInterval(timerId);
  input.disabled = true;
  started = false;
  const minutes = timeLimit / 60;
  const wpm = Math.round(correct / minutes);
  const accuracy = totalTypedChars ? Math.round(((totalTypedChars - incorrect) / totalTypedChars) * 100) : 100;
  const record = { date: new Date().toISOString(), wpm, accuracy, correct, incorrect, time: timeLimit };
  saveHistory(record);
  updateStats();
  setTimeout(() => alert(`Time's up!\nWPM: ${wpm}\nAccuracy: ${accuracy}%\nCorrect: ${correct} • Incorrect: ${incorrect}`), 100);
}

// --- Input Event ---
input.addEventListener('input', () => {
  if (!started) start();
  const val = input.value;
  const curWord = words[currentIndex] || '';
  totalTypedChars += val.length ? 1 : 0;

  if (val.endsWith(' ') || val.endsWith('\n')) {
    const trimmed = val.trim();
    const span = wordsEl.querySelector(`span[data-idx="${currentIndex}"]`);
    if (trimmed === curWord) {
      span.classList.add('correct');
      correct++;
    } else {
      span.classList.add('incorrect');
      incorrect += curWord.length;
    }
    span.classList.remove('current');
    currentIndex++;
    const next = wordsEl.querySelector(`span[data-idx="${currentIndex}"]`);
    if (next) next.classList.add('current');
    input.value = '';
    if (words.length - currentIndex < 20) { words = words.concat(pickWords(30)); renderWords(); }
    updateStats();
  } else {
    const span = wordsEl.querySelector(`span[data-idx="${currentIndex}"]`);
    if (!span) return;
    const expected = curWord.substr(0, val.length);
    if (val === expected) span.classList.remove('incorrect');
    else span.classList.add('incorrect');
  }
});

// --- Button Events ---
startBtn.addEventListener('click', () => { reset(); start(); });
restartBtn.addEventListener('click', reset);
clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('lj_history'); renderHistory(); });

// --- Init ---
reset();
renderHistory();

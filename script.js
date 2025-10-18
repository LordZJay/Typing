// Simple typing test logic
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
  })
});

let words = [];
let currentIndex = 0;
let correct = 0;
let incorrect = 0;
let started = false;
let remaining = timeLimit;
let timerId = null;
let totalTypedChars = 0;

function pickWords(count = 50) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  return arr;
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

function reset() {
  clearInterval(timerId);
  currentIndex = 0;
  correct = 0;
  incorrect = 0;
  totalTypedChars = 0;
  started = false;
  remaining = timeLimit;
  timerEl.textContent = remaining + 's';
  input.value = '';
  input.disabled = true;
  words = pickWords(70);
  renderWords();
  updateStats();
}

function start() {
  if (started) return;
  started = true;
  input.disabled = false;
  input.focus();
  remaining = timeLimit;
  timerEl.textContent = remaining + 's';
  const t0 = Date.now();
  timerId = setInterval(() => {
    remaining = Math.max(0, timeLimit - Math.floor((Date.now() - t0) / 1000));
    timerEl.textContent = remaining + 's';
    if (remaining <= 0) { endTest(); }
  }, 200);
}

function endTest() {
  clearInterval(timerId);
  input.disabled = true;
  started = false;
  const minutes = timeLimit / 60;
  const wpm = Math.round(correct / minutes);
  const accuracy = totalTypedChars ? Math.round((Math.max(0, totalTypedChars - incorrectChars()) / totalTypedChars) * 100) : 100;
  const rec = { date: new Date().toISOString(), wpm, accuracy, correct, incorrect, time: timeLimit };
  saveHistory(rec);
  updateStats();
  showModalResult(rec);
}

function incorrectChars() {
  return incorrect * 5;
}

function updateStats() {
  const minutes = timeLimit / 60;
  const wpm = started ? Math.round((correct) / minutes * ((timeLimit - remaining) / timeLimit)) : Math.round(correct / minutes);
  wpmEl.textContent = isFinite(wpm) ? wpm : 0;
  const accuracy = totalTypedChars ? Math.round((Math.max(0, totalTypedChars - incorrectChars()) / totalTypedChars) * 100) : 100;
  accEl.textContent = accuracy + '%';
  countsEl.textContent = `${correct} / ${incorrect}`;
  renderHistory();
}

function renderHistory() {
  const arr = JSON.parse(localStorage.getItem('lj_history') || '[]');
  historyEl.innerHTML = '';
  if (arr.length === 0) historyEl.innerHTML = '<div class="small">No results yet</div>';
  arr.slice(0, 8).forEach(r => {
    const d = document.createElement('div');
    d.className = 'row';
    d.innerHTML = `<div style="font-weight:700">${r.wpm} WPM</div><div class="small">${r.accuracy}% • ${r.time}s</div>`;
    historyEl.appendChild(d);
  });
}

function saveHistory(rec) {
  const arr = JSON.parse(localStorage.getItem('lj_history') || '[]');
  arr.unshift(rec);
  localStorage.setItem('lj_history', JSON.stringify(arr.slice(0, 50)));
  renderHistory();
}

function showModalResult(rec) {
  setTimeout(() => {
    alert(`Time's up!\nWPM: ${rec.wpm}\nAccuracy: ${rec.accuracy}%\nCorrect: ${rec.correct} • Incorrect: ${rec.incorrect}`);
  }, 100);
}

input.addEventListener('input', (e) => {
  if (!started) start();
  const val = input.value;
  const curWord = words[currentIndex] || '';
  totalTypedChars = totalTypedChars + (val.length ? 1 : 0);
  if (val.endsWith(' ') || val.endsWith('\n')) {
    const trimmed = val.trim();
    const span = wordsEl.querySelector(`span[data-idx="${currentIndex}"]`);
    if (trimmed === curWord) { span.classList.add('correct'); correct++; }
    else { span.classList.add('incorrect'); incorrect++; }
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
    if (val === expected) { span.classList.remove('incorrect'); span.classList.add('current'); }
    else { span.classList.add('incorrect'); }
  }
});

startBtn.addEventListener('click', () => { reset(); start(); });
restartBtn.addEventListener('click', () => { reset(); });
clearHistoryBtn.addEventListener('click', () => { localStorage.removeItem('lj_history'); renderHistory(); });

reset();
renderHistory();

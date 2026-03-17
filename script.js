// ========================================
// PERSONAL OS v2
// Front-end only, beginner-friendly
// Saves everything in localStorage
// ========================================

// ------------------------------
// Default habits
// ------------------------------
const DEFAULT_HABITS = [
  "Wake before 7:00 AM",
  "Breath work",
  "Gratitude",
  "Walk outside",
  "Stretch",
  "Study",
  "Journal",
  "Eating goals"
];

// ------------------------------
// Storage keys
// ------------------------------
const STORAGE_KEYS = {
  dailyData: "personal_os_v2_daily_data",
  reflection: "personal_os_v2_reflection",
  streaks: "personal_os_v2_streaks"
};

// ------------------------------
// Helpers
// ------------------------------
function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getPrettyDate() {
  const today = new Date();
  return today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0
  const diff = day === 0 ? -6 : 1 - day; // make Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekKey(dateString) {
  const date = new Date(dateString + "T12:00:00");
  const start = getStartOfWeek(date);
  return start.toISOString().slice(0, 10);
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7); // YYYY-MM
}

function average(numbers) {
  if (!numbers.length) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round(sum / numbers.length);
}

function differenceLabel(current, previous) {
  const diff = current - previous;
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "0%";
}

function getScoreLabel(score) {
  if (score === 0) return "Cold Start";
  if (score < 40) return "In Motion";
  if (score < 70) return "Momentum";
  if (score < 100) return "Strong Day";
  return "Locked In";
}

function getWeeklyWrap(thisWeekAvg, lastWeekAvg, streak) {
  if (thisWeekAvg === 0 && lastWeekAvg === 0) {
    return "No real signal yet. Start stacking clean days and the pattern will emerge.";
  }

  if (thisWeekAvg > lastWeekAvg + 10) {
    return `You are clearly trending up. This week is stronger than last week, and your current streak is ${streak}. Keep pressing the advantage.`;
  }

  if (thisWeekAvg < lastWeekAvg - 10) {
    return "This week slipped versus last week. No drama — tighten the foundations and restore momentum tomorrow.";
  }

  if (thisWeekAvg >= 80) {
    return "You are operating at a high level right now. The goal is not intensity. It is repeatability.";
  }

  if (thisWeekAvg >= 60) {
    return "Solid week. You have something real to build on. A few cleaner days and this starts compounding fast.";
  }

  return "The base is still being built. Focus less on perfection and more on proving you can show up daily.";
}

// ------------------------------
// App state
// ------------------------------
const todayKey = getTodayKey();

let dailyData = loadJSON(STORAGE_KEYS.dailyData, {});
let streakData = loadJSON(STORAGE_KEYS.streaks, {
  currentStreak: 0,
  bestStreak: 0,
  daysTracked: 0,
  lastCompletedDate: null
});

// Ensure today exists
if (!dailyData[todayKey]) {
  dailyData[todayKey] = {
    habits: DEFAULT_HABITS.map((habit) => ({
      name: habit,
      completed: false
    })),
    reflection: ""
  };
  saveJSON(STORAGE_KEYS.dailyData, dailyData);
}

// ------------------------------
// DOM elements
// ------------------------------
const todayDateEl = document.getElementById("today-date");
const resetDayBtn = document.getElementById("reset-day-btn");

const habitListEl = document.getElementById("habit-list");
const completedPillEl = document.getElementById("completed-pill");

const dailyScoreEl = document.getElementById("daily-score");
const scoreLabelEl = document.getElementById("score-label");
const progressFillEl = document.getElementById("progress-fill");

const completedCountEl = document.getElementById("completed-count");
const remainingCountEl = document.getElementById("remaining-count");
const totalCountEl = document.getElementById("total-count");

const currentStreakEl = document.getElementById("current-streak");
const bestStreakEl = document.getElementById("best-streak");
const daysTrackedEl = document.getElementById("days-tracked");

const thisWeekScoreEl = document.getElementById("this-week-score");
const lastWeekScoreEl = document.getElementById("last-week-score");
const wowChangeEl = document.getElementById("wow-change");

const thisMonthScoreEl = document.getElementById("this-month-score");
const lastMonthScoreEl = document.getElementById("last-month-score");
const momChangeEl = document.getElementById("mom-change");

const reflectionEl = document.getElementById("daily-reflection");
const weeklyWrapEl = document.getElementById("weekly-wrap");

// ------------------------------
// Core calculations
// ------------------------------
function getTodayHabits() {
  return dailyData[todayKey].habits;
}

function getTodayCompletedCount() {
  return getTodayHabits().filter((habit) => habit.completed).length;
}

function getTodayTotalCount() {
  return getTodayHabits().length;
}

function getTodayScore() {
  const total = getTodayTotalCount();
  if (total === 0) return 0;
  return Math.round((getTodayCompletedCount() / total) * 100);
}

function getAllDailyScores() {
  const scores = {};

  Object.keys(dailyData).forEach((dateKey) => {
    const habits = dailyData[dateKey].habits || [];
    const total = habits.length;
    const completed = habits.filter((habit) => habit.completed).length;
    const score = total === 0 ? 0 : Math.round((completed / total) * 100);
    scores[dateKey] = score;
  });

  return scores;
}

function getWeekAverages() {
  const scoresByDay = getAllDailyScores();
  const weeklyBuckets = {};

  Object.keys(scoresByDay).forEach((dateKey) => {
    const weekKey = getWeekKey(dateKey);
    if (!weeklyBuckets[weekKey]) {
      weeklyBuckets[weekKey] = [];
    }
    weeklyBuckets[weekKey].push(scoresByDay[dateKey]);
  });

  const weeklyAverages = {};
  Object.keys(weeklyBuckets).forEach((weekKey) => {
    weeklyAverages[weekKey] = average(weeklyBuckets[weekKey]);
  });

  return weeklyAverages;
}

function getMonthAverages() {
  const scoresByDay = getAllDailyScores();
  const monthlyBuckets = {};

  Object.keys(scoresByDay).forEach((dateKey) => {
    const monthKey = getMonthKey(dateKey);
    if (!monthlyBuckets[monthKey]) {
      monthlyBuckets[monthKey] = [];
    }
    monthlyBuckets[monthKey].push(scoresByDay[dateKey]);
  });

  const monthlyAverages = {};
  Object.keys(monthlyBuckets).forEach((monthKey) => {
    monthlyAverages[monthKey] = average(monthlyBuckets[monthKey]);
  });

  return monthlyAverages;
}

function getThisAndLastWeekScores() {
  const weeklyAverages = getWeekAverages();
  const thisWeekKey = getWeekKey(todayKey);

  const thisWeekDate = new Date(thisWeekKey + "T12:00:00");
  const lastWeekDate = new Date(thisWeekDate);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekKey = lastWeekDate.toISOString().slice(0, 10);

  return {
    thisWeek: weeklyAverages[thisWeekKey] || 0,
    lastWeek: weeklyAverages[lastWeekKey] || 0
  };
}

function getThisAndLastMonthScores() {
  const monthlyAverages = getMonthAverages();
  const [year, month] = todayKey.slice(0, 7).split("-").map(Number);

  const thisMonthKey = `${year}-${String(month).padStart(2, "0")}`;

  let lastMonthYear = year;
  let lastMonth = month - 1;

  if (lastMonth === 0) {
    lastMonth = 12;
    lastMonthYear -= 1;
  }

  const lastMonthKey = `${lastMonthYear}-${String(lastMonth).padStart(2, "0")}`;

  return {
    thisMonth: monthlyAverages[thisMonthKey] || 0,
    lastMonth: monthlyAverages[lastMonthKey] || 0
  };
}

// ------------------------------
// Streak logic
// Rule: a day counts if score >= 75%
// ------------------------------
function recalculateStreaks() {
  const dateKeys = Object.keys(dailyData).sort();
  let currentStreak = 0;
  let bestStreak = 0;
  let daysTracked = dateKeys.length;

  for (let i = 0; i < dateKeys.length; i++) {
    const dateKey = dateKeys[i];
    const habits = dailyData[dateKey].habits || [];
    const total = habits.length;
    const completed = habits.filter((habit) => habit.completed).length;
    const score = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (score >= 75) {
      currentStreak += 1;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  streakData = {
    currentStreak,
    bestStreak,
    daysTracked,
    lastCompletedDate: dateKeys.length ? dateKeys[dateKeys.length - 1] : null
  };

  saveJSON(STORAGE_KEYS.streaks, streakData);
}

// ------------------------------
// Render functions
// ------------------------------
function renderDate() {
  todayDateEl.textContent = getPrettyDate();
}

function renderHabits() {
  habitListEl.innerHTML = "";

  getTodayHabits().forEach((habit, index) => {
    const row = document.createElement("label");
    row.className = "habit-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.completed;

    checkbox.addEventListener("change", () => {
      dailyData[todayKey].habits[index].completed = checkbox.checked;
      saveJSON(STORAGE_KEYS.dailyData, dailyData);
      recalculateStreaks();
      renderAll();
    });

    const text = document.createElement("span");
    text.className = "habit-name";
    text.textContent = habit.name;

    row.appendChild(checkbox);
    row.appendChild(text);
    habitListEl.appendChild(row);
  });
}

function renderDailyScore() {
  const completed = getTodayCompletedCount();
  const total = getTodayTotalCount();
  const remaining = total - completed;
  const score = getTodayScore();

  completedPillEl.textContent = `${completed} complete`;
  dailyScoreEl.textContent = `${score}%`;
  scoreLabelEl.textContent = getScoreLabel(score);
  progressFillEl.style.width = `${score}%`;

  completedCountEl.textContent = `${completed} complete`;
  remainingCountEl.textContent = `${remaining} remaining`;
  totalCountEl.textContent = `${total} total`;
}

function renderStreaks() {
  currentStreakEl.textContent = streakData.currentStreak;
  bestStreakEl.textContent = streakData.bestStreak;
  daysTrackedEl.textContent = streakData.daysTracked;
}

function renderWeeklyStats() {
  const { thisWeek, lastWeek } = getThisAndLastWeekScores();

  thisWeekScoreEl.textContent = `${thisWeek}%`;
  lastWeekScoreEl.textContent = `${lastWeek}%`;
  wowChangeEl.textContent = differenceLabel(thisWeek, lastWeek);
}

function renderMonthlyStats() {
  const { thisMonth, lastMonth } = getThisAndLastMonthScores();

  thisMonthScoreEl.textContent = `${thisMonth}%`;
  lastMonthScoreEl.textContent = `${lastMonth}%`;
  momChangeEl.textContent = differenceLabel(thisMonth, lastMonth);
}

function renderReflection() {
  reflectionEl.value = dailyData[todayKey].reflection || "";
}

function renderWeeklyWrap() {
  const { thisWeek, lastWeek } = getThisAndLastWeekScores();
  weeklyWrapEl.textContent = getWeeklyWrap(
    thisWeek,
    lastWeek,
    streakData.currentStreak
  );
}

function renderAll() {
  renderDate();
  renderHabits();
  renderDailyScore();
  renderStreaks();
  renderWeeklyStats();
  renderMonthlyStats();
  renderReflection();
  renderWeeklyWrap();
}

// ------------------------------
// Events
// ------------------------------
reflectionEl.addEventListener("input", () => {
  dailyData[todayKey].reflection = reflectionEl.value;
  saveJSON(STORAGE_KEYS.dailyData, dailyData);
});

resetDayBtn.addEventListener("click", () => {
  dailyData[todayKey] = {
    habits: DEFAULT_HABITS.map((habit) => ({
      name: habit,
      completed: false
    })),
    reflection: ""
  };

  saveJSON(STORAGE_KEYS.dailyData, dailyData);
  recalculateStreaks();
  renderAll();
});

// ------------------------------
// Init
// ------------------------------
recalculateStreaks();
renderAll();
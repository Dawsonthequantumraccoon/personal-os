/* ============================================
   PERSONAL OS - FRONT-END ONLY DASHBOARD
   ============================================
   HOW TO OPEN THE APP LOCALLY
   - Keep these three files together: index.html, styles.css, script.js
   - Open index.html in your browser (double-click it or drag into a tab)

   WHERE TO CHANGE THE DEFAULT HABITS
   - Scroll down to the section:
       // ==============================
       // DEFAULT SETTINGS YOU CAN EDIT
       // ==============================
     and edit defaultHabits and defaultTitle/subtitle there.

   HOW THE DAILY RESET WORKS
   - The app stores today's date in localStorage.
   - When you open the app, it compares the saved date with today's date.
   - If they differ, yesterday's completion is saved into history,
     streaks are updated, then habits/priorities/reflection are cleared
     and the stored date is set to today.

   HOW TO DEPLOY FOR FREE
   - GitHub Pages: Create a repo, push these files, enable Pages in settings.
   - Vercel / Netlify: Sign up, import or upload this folder, get a URL.
*/

// ==============================
// DEFAULT SETTINGS YOU CAN EDIT
// ==============================

const DEFAULT_TITLE = "Personal OS";
const DEFAULT_SUBTITLE = "Clarity. Momentum. Foundations.";

const DEFAULT_HABITS = [
  "Workout",
  "Read",
  "Meditate",
  "Write",
  "Walk Outside",
  "Stretch",
  "Study",
  "Journal",
  "Sleep on Time",
];

const MOTIVATION_LINES = {
  low: [
    "Start with one win.",
    "Build the base.",
    "Tiny steps, repeated.",
  ],
  mid: [
    "Momentum comes from repetition.",
    "You're stacking proof.",
    "This is how identity changes.",
  ],
  high: [
    "Strong work. Stay steady.",
    "Quiet consistency wins.",
    "Excellent. Keep pressing.",
  ],
  perfect: [
    "Win the day.",
    "Locked in. Rest well.",
    "A calm mind compounds.",
  ],
};

/* ==============================
   STORAGE & DATA HELPERS
   ============================== */

const STORAGE_KEY = "personalOSData";

function createDefaultData() {
  const todayStr = getTodayString();
  const habits = DEFAULT_HABITS.map((name, index) => ({
    id: index + 1,
    name,
    completed: false,
  }));

  return {
    settings: {
      title: DEFAULT_TITLE,
      subtitle: DEFAULT_SUBTITLE,
      theme: "light",
    },
    habits,
    today: {
      date: todayStr,
      priorities: ["", "", ""],
      reflection: "",
    },
    stats: {
      currentStreak: 0,
      bestStreak: 0,
      history: [],
    },
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultData();
    }
    const parsed = JSON.parse(raw);
    return ensureDataShape(parsed);
  } catch (e) {
    console.warn("Problem reading data, starting fresh.", e);
    return createDefaultData();
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Unable to save data to localStorage.", e);
  }
}

function ensureDataShape(maybe) {
  const safe = { ...maybe };

  if (!safe.settings || typeof safe.settings !== "object") {
    safe.settings = {};
  }
  if (typeof safe.settings.title !== "string") {
    safe.settings.title = DEFAULT_TITLE;
  }
  if (typeof safe.settings.subtitle !== "string") {
    safe.settings.subtitle = DEFAULT_SUBTITLE;
  }
  if (typeof safe.settings.theme !== "string") {
    safe.settings.theme = "light";
  }

  if (!Array.isArray(safe.habits)) {
    safe.habits = DEFAULT_HABITS.map((name, index) => ({
      id: index + 1,
      name,
      completed: false,
    }));
  } else {
    safe.habits = safe.habits.map((h, index) => ({
      id: typeof h.id === "number" ? h.id : index + 1,
      name: typeof h.name === "string" ? h.name : `Habit ${index + 1}`,
      completed: Boolean(h.completed),
    }));
  }

  if (!safe.today || typeof safe.today !== "object") {
    safe.today = {};
  }
  if (typeof safe.today.date !== "string") {
    safe.today.date = getTodayString();
  }
  if (!Array.isArray(safe.today.priorities)) {
    safe.today.priorities = ["", "", ""];
  } else {
    const arr = safe.today.priorities.slice(0, 3);
    while (arr.length < 3) arr.push("");
    safe.today.priorities = arr.map((p) => (typeof p === "string" ? p : ""));
  }
  if (typeof safe.today.reflection !== "string") {
    safe.today.reflection = "";
  }

  if (!safe.stats || typeof safe.stats !== "object") {
    safe.stats = {};
  }
  if (typeof safe.stats.currentStreak !== "number") {
    safe.stats.currentStreak = 0;
  }
  if (typeof safe.stats.bestStreak !== "number") {
    safe.stats.bestStreak = 0;
  }
  if (!Array.isArray(safe.stats.history)) {
    safe.stats.history = [];
  } else {
    safe.stats.history = safe.stats.history
      .filter((h) => h && typeof h.date === "string")
      .map((h) => ({
        date: h.date,
        completionPercent: typeof h.completionPercent === "number" ? h.completionPercent : 0,
        completedAll: Boolean(h.completedAll),
      }));
  }

  return safe;
}

/* ==============================
   DATE HELPERS
   ============================== */

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(dateA, dateB) {
  try {
    const a = new Date(dateA + "T00:00:00");
    const b = new Date(dateB + "T00:00:00");
    const diffMs = b.getTime() - a.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/* ==============================
   DAILY RESET & STREAK LOGIC
   ============================== */

function archivePreviousDay(prevDate) {
  if (!prevDate) return;

  const already = data.stats.history.find((h) => h.date === prevDate);
  if (already) return;

  const total = data.habits.length || 1;
  const completedCount = data.habits.filter((h) => h.completed).length;
  const percent = Math.round((completedCount / total) * 100);
  const completedAll = completedCount === total && total > 0;

  data.stats.history.push({
    date: prevDate,
    completionPercent: percent,
    completedAll,
  });

  if (data.stats.history.length > 21) {
    data.stats.history = data.stats.history.slice(-21);
  }

  updateStreak(prevDate, completedAll);
}

function updateStreak(prevDate, completedAll) {
  if (!completedAll) {
    data.stats.currentStreak = 0;
    return;
  }

  const history = data.stats.history;
  const sorted = [...history].sort((a, b) => (a.date < b.date ? -1 : 1));
  const index = sorted.findIndex((h) => h.date === prevDate);

  const yesterdayWasConsecutive =
    index > 0 && diffDays(sorted[index - 1].date, prevDate) === 1;

  if (yesterdayWasConsecutive) {
    data.stats.currentStreak += 1;
  } else {
    data.stats.currentStreak = 1;
  }

  if (data.stats.currentStreak > data.stats.bestStreak) {
    data.stats.bestStreak = data.stats.currentStreak;
  }
}

function checkForNewDay() {
  const todayStr = getTodayString();
  const storedDate = data.today.date;

  if (storedDate === todayStr) {
    return;
  }

  if (storedDate) {
    archivePreviousDay(storedDate);
  }

  data.habits = data.habits.map((h) => ({ ...h, completed: false }));
  data.today.date = todayStr;
  data.today.priorities = ["", "", ""];
  data.today.reflection = "";

  saveData();
}

/* ==============================
   RENDER HELPERS
   ============================== */

function renderHeader() {
  const titleEl = document.getElementById("dashboard-title");
  const subtitleEl = document.getElementById("dashboard-subtitle");
  const dateEl = document.getElementById("current-date");
  const motivationEl = document.getElementById("motivation-line");
  const streakPill = document.getElementById("streak-pill");

  titleEl.textContent = data.settings.title || DEFAULT_TITLE;
  subtitleEl.textContent = data.settings.subtitle || DEFAULT_SUBTITLE;

  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  dateEl.textContent = formatted;

  const { percent } = calculateProgress();
  motivationEl.textContent = pickMotivationLine(percent);

  const current = data.stats.currentStreak || 0;
  if (current > 0) {
    streakPill.textContent = `${current} day${current === 1 ? "" : "s"} in a row`;
  } else {
    streakPill.textContent = "Start a new streak";
  }
}

function pickMotivationLine(percent) {
  let bucket = MOTIVATION_LINES.low;
  if (percent >= 90) {
    bucket = MOTIVATION_LINES.perfect;
  } else if (percent >= 60) {
    bucket = MOTIVATION_LINES.high;
  } else if (percent >= 30) {
    bucket = MOTIVATION_LINES.mid;
  }
  const index = Math.floor(Math.random() * bucket.length);
  return bucket[index] || "Build the base.";
}

function renderHabits() {
  const listEl = document.getElementById("habits-list");
  listEl.innerHTML = "";

  data.habits.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";
    if (habit.completed) {
      row.classList.add("completed");
    }

    const main = document.createElement("div");
    main.className = "habit-main";

    const checkboxVisual = document.createElement("button");
    checkboxVisual.type = "button";
    checkboxVisual.className = "habit-checkbox";
    checkboxVisual.setAttribute("data-checked", habit.completed ? "true" : "false");
    checkboxVisual.setAttribute("aria-pressed", habit.completed ? "true" : "false");
    checkboxVisual.setAttribute("aria-label", habit.name);

    const inner = document.createElement("div");
    inner.className = "habit-checkbox-inner";
    checkboxVisual.appendChild(inner);

    checkboxVisual.addEventListener("click", () => {
      toggleHabit(habit.id);
    });

    const label = document.createElement("span");
    label.className = "habit-label";
    label.textContent = habit.name;

    main.appendChild(checkboxVisual);
    main.appendChild(label);

    row.appendChild(main);
    listEl.appendChild(row);
  });
}

function calculateProgress() {
  const total = data.habits.length || 1;
  const completedCount = data.habits.filter((h) => h.completed).length;
  const remaining = total - completedCount;
  const percent = Math.round((completedCount / total) * 100);

  return { total, completedCount, remaining, percent };
}

function renderProgress() {
  const { total, completedCount, remaining, percent } = calculateProgress();

  document.getElementById("daily-percent").textContent = `${percent}%`;
  document.getElementById("daily-label").textContent = getScoreLabel(percent);
  document.getElementById("completed-count").textContent = `${completedCount} completed`;
  document.getElementById("remaining-count").textContent = `${remaining} remaining`;
  document.getElementById("total-count").textContent = `${total} total`;

  document.getElementById("progress-bar-fill").style.width = `${percent}%`;

  document.getElementById("motivation-line").textContent = pickMotivationLine(percent);
}

function getScoreLabel(percent) {
  if (percent >= 90) return "Locked In";
  if (percent >= 60) return "Strong Day";
  if (percent >= 30) return "In Motion";
  return "Cold Start";
}

function renderPriorities() {
  data.today.priorities.forEach((value, index) => {
    const input = document.getElementById(`priority-${index}`);
    if (input) {
      input.value = value;
    }
  });
}

function renderReflection() {
  const textarea = document.getElementById("reflection");
  textarea.value = data.today.reflection || "";
}

function renderStreak() {
  document.getElementById("current-streak").textContent = data.stats.currentStreak || 0;
  document.getElementById("best-streak").textContent = data.stats.bestStreak || 0;

  const streakPill = document.getElementById("streak-pill");
  const current = data.stats.currentStreak || 0;
  if (current > 0) {
    streakPill.textContent = `${current} day${current === 1 ? "" : "s"} in a row`;
  } else {
    streakPill.textContent = "Start a new streak";
  }
}

function renderWeeklyView() {
  const grid = document.getElementById("weekly-grid");
  grid.innerHTML = "";

  const todayStr = getTodayString();
  const sorted = [...data.stats.history].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
  const lastSeven = sorted.slice(-7);
  const map = {};
  lastSeven.forEach((item) => {
    map[item.date] = item;
  });

  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayStr + "T00:00:00");
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const entry = map[dateStr];
    const dayLabel = date.toLocaleDateString(undefined, { weekday: "short" });
    const percent = entry ? entry.completionPercent : 0;
    const completedAll = entry ? Boolean(entry.completedAll) : false;

    const item = document.createElement("div");
    item.className = "weekly-item";

    const dayEl = document.createElement("div");
    dayEl.className = "weekly-day";
    dayEl.textContent = dayLabel;

    const percentEl = document.createElement("div");
    percentEl.className = "weekly-percent";
    percentEl.textContent = `${percent}%`;

    const pill = document.createElement("span");
    pill.className = "weekly-status-pill";

    if (!entry) {
      pill.classList.add("weekly-status-missed");
      pill.textContent = "No data";
    } else if (completedAll) {
      pill.classList.add("weekly-status-all");
      pill.textContent = "All";
    } else if (percent > 0) {
      pill.classList.add("weekly-status-partial");
      pill.textContent = "Some";
    } else {
      pill.classList.add("weekly-status-missed");
      pill.textContent = "Missed";
    }

    item.appendChild(dayEl);
    item.appendChild(percentEl);
    item.appendChild(pill);

    grid.appendChild(item);
  }
}

function renderCustomization() {
  document.getElementById("custom-title").value = data.settings.title || DEFAULT_TITLE;
  document.getElementById("custom-subtitle").value = data.settings.subtitle || DEFAULT_SUBTITLE;

  const habitList = document.getElementById("habit-settings-list");
  habitList.innerHTML = "";

  data.habits.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-settings-row";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "habit-name-input";
    input.value = habit.name;

    input.addEventListener("change", () => {
      updateHabitName(habit.id, input.value);
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "habit-delete-btn";
    delBtn.textContent = "Remove";

    delBtn.addEventListener("click", () => {
      deleteHabit(habit.id);
    });

    row.appendChild(input);
    row.appendChild(delBtn);

    habitList.appendChild(row);
  });
}

/* ==============================
   MUTATION FUNCTIONS
   ============================== */

function toggleHabit(id) {
  data.habits = data.habits.map((h) =>
    h.id === id ? { ...h, completed: !h.completed } : h
  );
  saveData();
  renderHabits();
  renderProgress();
}

function resetToday() {
  data.habits = data.habits.map((h) => ({ ...h, completed: false }));
  data.today.priorities = ["", "", ""];
  data.today.reflection = "";
  saveData();
  renderHabits();
  renderProgress();
  renderPriorities();
  renderReflection();
}

function updatePriority(index, value) {
  if (!Array.isArray(data.today.priorities)) {
    data.today.priorities = ["", "", ""];
  }
  data.today.priorities[index] = value;
  saveData();
}

function updateReflection(value) {
  data.today.reflection = value;
  saveData();
}

function updateSettingsTitle(title) {
  data.settings.title = title || DEFAULT_TITLE;
  saveData();
  renderHeader();
}

function updateSettingsSubtitle(subtitle) {
  data.settings.subtitle = subtitle || DEFAULT_SUBTITLE;
  saveData();
  renderHeader();
}

function updateHabitName(id, newName) {
  const trimmed = newName.trim();
  data.habits = data.habits.map((h) =>
    h.id === id ? { ...h, name: trimmed || h.name } : h
  );
  saveData();
  renderHabits();
  renderCustomization();
}

function deleteHabit(id) {
  data.habits = data.habits.filter((h) => h.id !== id);
  saveData();
  renderHabits();
  renderProgress();
  renderCustomization();
}

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const maxId = data.habits.reduce((acc, h) => Math.max(acc, h.id), 0);
  data.habits.push({
    id: maxId + 1,
    name: trimmed,
    completed: false,
  });
  saveData();
  renderHabits();
  renderProgress();
  renderCustomization();
}

/* ==============================
   EVENT BINDING
   ============================== */

function bindEvents() {
  document.getElementById("reset-today-btn").addEventListener("click", resetToday);

  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`priority-${i}`);
    input.addEventListener("input", (e) => {
      updatePriority(i, e.target.value);
    });
  }

  document.getElementById("reflection").addEventListener("input", (e) => {
    updateReflection(e.target.value);
  });

  const toggleBtn = document.getElementById("customization-toggle");
  const panel = document.getElementById("customization-panel");
  toggleBtn.addEventListener("click", () => {
    const isHidden = panel.hasAttribute("hidden");
    if (isHidden) {
      panel.removeAttribute("hidden");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.querySelector(".toggle-icon").textContent = "▴";
    } else {
      panel.setAttribute("hidden", "");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.querySelector(".toggle-icon").textContent = "▾";
    }
  });

  document.getElementById("custom-title").addEventListener("input", (e) => {
    updateSettingsTitle(e.target.value);
  });

  document.getElementById("custom-subtitle").addEventListener("input", (e) => {
    updateSettingsSubtitle(e.target.value);
  });

  const newHabitInput = document.getElementById("new-habit-name");
  document.getElementById("add-habit-btn").addEventListener("click", () => {
    addHabit(newHabitInput.value);
    newHabitInput.value = "";
  });

  newHabitInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHabit(newHabitInput.value);
      newHabitInput.value = "";
    }
  });
}

/* ==============================
   INIT
   ============================== */

let data;

function init() {
  data = loadData();
  checkForNewDay();

  renderHeader();
  renderHabits();
  renderProgress();
  renderPriorities();
  renderReflection();
  renderStreak();
  renderWeeklyView();
  renderCustomization();
  bindEvents();

  window.setTimeout(() => {
    document.body.classList.add("ready");
  }, 40);
}

document.addEventListener("DOMContentLoaded", init);

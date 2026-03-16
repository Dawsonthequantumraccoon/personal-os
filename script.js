/*
====================================================
PERSONAL OS — FRONT-END ONLY DASHBOARD
Beginner-friendly version
All data is saved in localStorage
====================================================
*/

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
  "Sleep on Time"
];

const MOTIVATION_LINES = {
  low: [
    "Start with one win.",
    "Build the base.",
    "Tiny steps, repeated.",
    "Calm effort still counts."
  ],
  medium: [
    "Momentum is building.",
    "Stay steady.",
    "You are in motion now.",
    "Keep stacking clean reps."
  ],
  high: [
    "Strong day.",
    "This is how identity changes.",
    "Momentum compounds.",
    "You are becoming reliable to yourself."
  ]
};

const STORAGE_KEYS = {
  settings: "personalOS_settings",
  habitsState: "personalOS_habitsState",
  reflection: "personalOS_reflection",
  focus: "personalOS_focus",
  stats: "personalOS_stats",
  lastDate: "personalOS_lastDate"
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getDefaultSettings() {
  return {
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    habits: [...DEFAULT_HABITS]
  };
}

function getDefaultStats() {
  return {
    currentStreak: 0,
    bestStreak: 0,
    daysTracked: 0,
    history: {}
  };
}

function createHabitsState(habits) {
  const state = {};
  habits.forEach((habit) => {
    state[habit] = false;
  });
  return state;
}

let settings = loadFromStorage(STORAGE_KEYS.settings, getDefaultSettings());
let stats = loadFromStorage(STORAGE_KEYS.stats, getDefaultStats());
let habitsState = loadFromStorage(
  STORAGE_KEYS.habitsState,
  createHabitsState(settings.habits)
);
let reflectionText = loadFromStorage(STORAGE_KEYS.reflection, "");
let focusText = loadFromStorage(STORAGE_KEYS.focus, "");
const today = getTodayString();

const dashboardTitle = document.getElementById("dashboard-title");
const dashboardSubtitle = document.getElementById("dashboard-subtitle");

const habitList = document.getElementById("habit-list");
const completedPill = document.getElementById("completed-pill");

const dailyPercent = document.getElementById("daily-percent");
const dailyLabel = document.getElementById("daily-label");
const progressBarFill = document.getElementById("progress-bar-fill");

const completedCount = document.getElementById("completed-count");
const remainingCount = document.getElementById("remaining-count");
const totalCount = document.getElementById("total-count");

const reflectionInput = document.getElementById("reflection-input");
const reflectionStatus = document.getElementById("reflection-status");

const focusInput = document.getElementById("focus-input");

const currentStreak = document.getElementById("current-streak");
const bestStreak = document.getElementById("best-streak");
const daysTracked = document.getElementById("days-tracked");

const motivationLine = document.getElementById("motivation-line");

const settingsModal = document.getElementById("settings-modal");
const modalBackdrop = document.getElementById("modal-backdrop");
const openSettingsButton = document.getElementById("open-settings");
const closeSettingsButton = document.getElementById("close-settings");

const titleInput = document.getElementById("title-input");
const subtitleInput = document.getElementById("subtitle-input");
const habitsInput = document.getElementById("habits-input");

const saveSettingsButton = document.getElementById("save-settings");
const resetSettingsButton = document.getElementById("reset-settings");

function runDailyResetIfNeeded() {
  const lastDate = localStorage.getItem(STORAGE_KEYS.lastDate);

  if (!lastDate) {
    localStorage.setItem(STORAGE_KEYS.lastDate, today);
    return;
  }

  if (lastDate === today) {
    return;
  }

  const completed = settings.habits.filter((habit) => habitsState[habit]).length;
  const total = settings.habits.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  stats.history[lastDate] = { completed, total, percent };
  stats.daysTracked += 1;

  if (percent >= 70) {
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveToStorage(STORAGE_KEYS.stats, stats);

  habitsState = createHabitsState(settings.habits);
  reflectionText = "";
  focusText = "";

  saveToStorage(STORAGE_KEYS.habitsState, habitsState);
  saveToStorage(STORAGE_KEYS.reflection, reflectionText);
  saveToStorage(STORAGE_KEYS.focus, focusText);

  localStorage.setItem(STORAGE_KEYS.lastDate, today);
}

function renderHeader() {
  dashboardTitle.textContent = settings.title || DEFAULT_TITLE;
  dashboardSubtitle.textContent = settings.subtitle || DEFAULT_SUBTITLE;
}

function renderHabits() {
  habitList.innerHTML = "";

  settings.habits.forEach((habitName) => {
    const row = document.createElement("label");
    row.className = "habit-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(habitsState[habitName]);
    checkbox.className = "habit-checkbox";

    checkbox.addEventListener("change", () => {
      habitsState[habitName] = checkbox.checked;
      saveToStorage(STORAGE_KEYS.habitsState, habitsState);
      renderProgress();
      renderMotivation();
    });

    const customBox = document.createElement("span");
    customBox.className = "habit-checkmark";

    const text = document.createElement("span");
    text.className = "habit-name";
    text.textContent = habitName;

    row.appendChild(checkbox);
    row.appendChild(customBox);
    row.appendChild(text);

    habitList.appendChild(row);
  });
}

function renderProgress() {
  const total = settings.habits.length;
  const completed = settings.habits.filter((habit) => habitsState[habit]).length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  dailyPercent.textContent = `${percent}%`;
  completedPill.textContent = `${completed} completed`;
  completedCount.textContent = `${completed} completed`;
  remainingCount.textContent = `${remaining} remaining`;
  totalCount.textContent = `${total} total`;
  progressBarFill.style.width = `${percent}%`;

  if (percent === 0) {
    dailyLabel.textContent = "Cold Start";
  } else if (percent < 40) {
    dailyLabel.textContent = "In Motion";
  } else if (percent < 80) {
    dailyLabel.textContent = "Momentum";
  } else if (percent < 100) {
    dailyLabel.textContent = "Strong Day";
  } else {
    dailyLabel.textContent = "Locked In";
  }
}

function renderReflection() {
  reflectionInput.value = reflectionText;
}

function renderFocus() {
  focusInput.value = focusText;
}

function renderStats() {
  currentStreak.textContent = stats.currentStreak;
  bestStreak.textContent = stats.bestStreak;
  daysTracked.textContent = stats.daysTracked;
}

function renderMotivation() {
  const total = settings.habits.length;
  const completed = settings.habits.filter((habit) => habitsState[habit]).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  let bucket = "low";
  if (percent >= 75) bucket = "high";
  else if (percent >= 35) bucket = "medium";

  motivationLine.textContent = getRandomItem(MOTIVATION_LINES[bucket]);
}

function renderSettingsForm() {
  titleInput.value = settings.title;
  subtitleInput.value = settings.subtitle;
  habitsInput.value = settings.habits.join("\n");
}

function renderAll() {
  renderHeader();
  renderHabits();
  renderProgress();
  renderReflection();
  renderFocus();
  renderStats();
  renderMotivation();
  renderSettingsForm();
}

function openSettingsModal() {
  settingsModal.classList.remove("hidden");
  settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettingsModal() {
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
}

function saveSettings() {
  const newTitle = titleInput.value.trim() || DEFAULT_TITLE;
  const newSubtitle = subtitleInput.value.trim() || DEFAULT_SUBTITLE;

  const newHabits = habitsInput.value
    .split("\n")
    .map((habit) => habit.trim())
    .filter((habit) => habit.length > 0);

  settings = {
    title: newTitle,
    subtitle: newSubtitle,
    habits: newHabits.length > 0 ? newHabits : [...DEFAULT_HABITS]
  };

  saveToStorage(STORAGE_KEYS.settings, settings);

  const nextHabitState = {};
  settings.habits.forEach((habit) => {
    nextHabitState[habit] = habitsState[habit] || false;
  });
  habitsState = nextHabitState;

  saveToStorage(STORAGE_KEYS.habitsState, habitsState);

  renderAll();
  closeSettingsModal();
}

function resetSettings() {
  settings = getDefaultSettings();
  habitsState = createHabitsState(settings.habits);

  saveToStorage(STORAGE_KEYS.settings, settings);
  saveToStorage(STORAGE_KEYS.habitsState, habitsState);

  renderAll();
  closeSettingsModal();
}

reflectionInput.addEventListener("input", () => {
  reflectionText = reflectionInput.value;
  saveToStorage(STORAGE_KEYS.reflection, reflectionText);
  reflectionStatus.textContent = "Saved locally on this device.";
});

focusInput.addEventListener("input", () => {
  focusText = focusInput.value;
  saveToStorage(STORAGE_KEYS.focus, focusText);
});

openSettingsButton.addEventListener("click", openSettingsModal);
closeSettingsButton.addEventListener("click", closeSettingsModal);
modalBackdrop.addEventListener("click", closeSettingsModal);

saveSettingsButton.addEventListener("click", saveSettings);
resetSettingsButton.addEventListener("click", resetSettings);

runDailyResetIfNeeded();
renderAll();
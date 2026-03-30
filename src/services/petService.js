/**
 * PetService - Frontend-only версія (замість Spring Boot)
 * Використовує localStorage для збереження даних
 */

const STORAGE_KEY = 'focus_pet_state';

// Початковий стан
const DEFAULT_STATE = {
  username: 'Username',
  animalName: 'Animal',
  animalImagePath: 'bear_img.png',
  focusGoal: 300,
  todayFocused: 0,
  totalTime: 0,
  totalMoney: 1000,
  activeTimesAte: 0,
  totalTimesAte: 1,
  lastFeedTime: new Date().toISOString(),
  lastActiveUpdate: new Date().toISOString(),
  focusedTimeDate: new Date().toISOString().split('T')[0],
};

class PetService {
  // Отримати стан з localStorage
  static getPetState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Якщо немає збережених даних - створити початковий стан
        this.savePetState(DEFAULT_STATE);
        return DEFAULT_STATE;
      }

      const state = JSON.parse(saved);

      // Оновити активні годування
      this.updateActiveTimesAte(state);

      // Перевірити чи новий день
      this.checkAndResetDailyFocus(state);

      return state;
    } catch (error) {
      console.error('Error loading pet state:', error);
      return DEFAULT_STATE;
    }
  }

  // Зберегти стан в localStorage
  static savePetState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (error) {
      console.error('Error saving pet state:', error);
      throw error;
    }
  }

  // Оновити активні годування (кожні 6 годин -1)
  static updateActiveTimesAte(state) {
    const now = new Date();
    const lastUpdate = new Date(state.lastActiveUpdate);
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
    const periodsPassed = Math.floor(hoursPassed / 6);

    if (periodsPassed > 0 && state.activeTimesAte > 0) {
      state.activeTimesAte = Math.max(0, state.activeTimesAte - periodsPassed);
      state.lastActiveUpdate = now.toISOString();
      this.savePetState(state);
    }
  }

  // Скинути щоденний фокус якщо новий день
  static checkAndResetDailyFocus(state) {
    const today = new Date().toISOString().split('T')[0];
    if (state.focusedTimeDate !== today) {
      state.todayFocused = 0;
      state.focusedTimeDate = today;
      this.savePetState(state);
    }
  }

  // Отримати час до голоду
  static getHungerTime(state) {
    const now = new Date();
    const lastFeed = new Date(state.lastFeedTime);
    const hoursSinceLastFeed = (now - lastFeed) / (1000 * 60 * 60);

    let hungerTimeHours = 6 * state.activeTimesAte - hoursSinceLastFeed;
    if (hungerTimeHours < 0) {
      hungerTimeHours = 0;
    }

    const hours = Math.floor(hungerTimeHours);
    const minutes = Math.floor((hungerTimeHours - hours) * 60);

    return { hours, minutes };
  }

  // Нагодувати тварину
  static feedPet() {
    const state = this.getPetState();

    if (state.totalMoney < 50) {
      throw new Error("You don't have enough money to feed your pet!");
    }

    state.totalTimesAte += 1;
    state.activeTimesAte += 1;
    state.lastFeedTime = new Date().toISOString();
    state.totalMoney -= 50;

    return this.savePetState(state);
  }

  // Завершити сесію фокусування
  static completeFocusSession(minutes) {
    const state = this.getPetState();

    state.totalTime += minutes;
    state.totalMoney += minutes;
    state.todayFocused += minutes;
    state.focusedTimeDate = new Date().toISOString().split('T')[0];

    return this.savePetState(state);
  }

  // Отримати залишок до мети
  static getRemainingFocusTime(state) {
    return Math.max(0, state.focusGoal - state.todayFocused);
  }

  // Оновити налаштування
  static updateSettings({ username, animalName, focusGoal, animalImagePath }) {
    const state = this.getPetState();

    if (username && username.trim()) {
      state.username = username.trim();
    }
    if (animalName && animalName.trim()) {
      state.animalName = animalName.trim();
    }
    if (focusGoal && focusGoal > 0) {
      state.focusGoal = focusGoal;
    }
    if (animalImagePath && animalImagePath.trim()) {
      state.animalImagePath = animalImagePath.trim();
    }

    return this.savePetState(state);
  }

  // Скинути всі дані (для тестування)
  static resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_STATE;
  }
}

export default PetService;

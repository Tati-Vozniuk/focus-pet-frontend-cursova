/**
 * PetService - Supabase версія
 * Зберігає дані в PostgreSQL через Supabase REST API
 *
 * Таблиці: pet_state, feeding_history, focus_sessions
 */

import supabase from './supabaseClient';

// -----------------------------------------------------------------------
// Внутрішній кеш — щоб не дергати БД при кожному рендері
// -----------------------------------------------------------------------
let _cachedState = null;

// -----------------------------------------------------------------------
// Маппінг: колонки БД  →  поля React-стану і назад
// -----------------------------------------------------------------------
function dbToState(row) {
  return {
    id: row.id,
    username: row.username,
    animalName: row.animal_name,
    animalImagePath: row.animal_type, // bear_img.png / cat_img.png / bunny_img.png
    focusGoal: row.focus_goal,
    todayFocused: row.today_focused,
    totalTime: row.total_time,
    totalMoney: row.total_money,
    activeTimesAte: row.active_times_ate,
    totalTimesAte: row.total_times_ate,
    lastFeedTime: row.last_feed_time,
    lastActiveUpdate: row.last_active_update,
    focusedTimeDate: row.focused_time_date,
  };
}

function stateToDb(state) {
  return {
    username: state.username,
    animal_name: state.animalName,
    animal_type: state.animalImagePath,
    focus_goal: state.focusGoal,
    today_focused: state.todayFocused,
    total_time: state.totalTime,
    total_money: state.totalMoney,
    active_times_ate: state.activeTimesAte,
    total_times_ate: state.totalTimesAte,
    last_feed_time: state.lastFeedTime,
    last_active_update: state.lastActiveUpdate,
    focused_time_date: state.focusedTimeDate,
  };
}

// -----------------------------------------------------------------------
// Початковий стан (якщо рядка ще нема в БД)
// -----------------------------------------------------------------------
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

// -----------------------------------------------------------------------
// PetService
// -----------------------------------------------------------------------
class PetService {
  // ---- Отримати стан (з БД або з кешу) --------------------------------
  static async getPetState() {
    try {
      const { data, error } = await supabase
        .from('pet_state')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        // Рядка ще нема — створюємо новий
        if (error.code === 'PGRST116') {
          return await this._createInitialState();
        }
        throw error;
      }

      let state = dbToState(data);

      // Логіка яка раніше була в localStorage-версії
      state = await this._updateActiveTimesAte(state);
      state = await this._checkAndResetDailyFocus(state);

      _cachedState = state;
      return state;
    } catch (err) {
      console.error('getPetState error:', err);
      // Якщо немає з'єднання — повертаємо кеш або дефолт
      return _cachedState ?? DEFAULT_STATE;
    }
  }

  // ---- Зберегти стан в БД ---------------------------------------------
  static async savePetState(state) {
    const { data, error } = await supabase
      .from('pet_state')
      .update(stateToDb(state))
      .eq('id', state.id)
      .select()
      .single();

    if (error) throw error;

    const updated = dbToState(data);
    _cachedState = updated;
    return updated;
  }

  // ---- Нагодувати тварину ---------------------------------------------
  static async feedPet() {
    const state = await this.getPetState();

    if (state.totalMoney < 50) {
      throw new Error("You don't have enough money to feed your pet!");
    }

    const hungerLevel = state.activeTimesAte;
    const moneyBefore = state.totalMoney;

    const newState = {
      ...state,
      totalTimesAte: state.totalTimesAte + 1,
      activeTimesAte: state.activeTimesAte + 1,
      lastFeedTime: new Date().toISOString(),
      totalMoney: state.totalMoney - 50,
    };

    const saved = await this.savePetState(newState);

    // Записати в feeding_history
    await supabase.from('feeding_history').insert({
      pet_id: state.id,
      cost: 50,
      money_before: moneyBefore,
      money_after: newState.totalMoney,
      hunger_level: hungerLevel,
    });

    return saved;
  }

  // ---- Завершити сесію фокусування ------------------------------------
  static async completeFocusSession(minutes) {
    const state = await this.getPetState();
    const today = new Date().toISOString().split('T')[0];
    const goalCompleted =
      state.todayFocused + minutes >= state.focusGoal && state.todayFocused < state.focusGoal;

    const newState = {
      ...state,
      totalTime: state.totalTime + minutes,
      totalMoney: state.totalMoney + minutes,
      todayFocused: state.todayFocused + minutes,
      focusedTimeDate: today,
    };

    const saved = await this.savePetState(newState);

    // Записати в focus_sessions
    await supabase.from('focus_sessions').insert({
      pet_id: state.id,
      completed_at: new Date().toISOString(),
      duration_minutes: minutes,
      earned_money: minutes,
      goal_completed: goalCompleted,
      session_date: today,
    });

    return saved;
  }

  // ---- Оновити налаштування -------------------------------------------
  static async updateSettings({ username, animalName, focusGoal, animalImagePath }) {
    const state = await this.getPetState();

    const newState = {
      ...state,
      username: username?.trim() || state.username,
      animalName: animalName?.trim() || state.animalName,
      focusGoal: focusGoal > 0 ? focusGoal : state.focusGoal,
      animalImagePath: animalImagePath?.trim() || state.animalImagePath,
    };

    return await this.savePetState(newState);
  }

  // ---- Час до голоду (синхронний, рахується з кешу) -------------------
  static getHungerTime(state) {
    const now = new Date();
    const lastFeed = new Date(state.lastFeedTime);
    const hoursSinceLastFeed = (now - lastFeed) / (1000 * 60 * 60);

    let hungerTimeHours = 6 * state.activeTimesAte - hoursSinceLastFeed;
    if (hungerTimeHours < 0) hungerTimeHours = 0;

    const hours = Math.floor(hungerTimeHours);
    const minutes = Math.floor((hungerTimeHours - hours) * 60);
    return { hours, minutes };
  }

  // ---- Залишок до денної мети (синхронний) ----------------------------
  static getRemainingFocusTime(state) {
    return Math.max(0, state.focusGoal - state.todayFocused);
  }

  // ---- Скинути всі дані (dev/debug) -----------------------------------
  static async resetAllData() {
    const state = await this.getPetState();
    if (!state.id) return DEFAULT_STATE;

    // Видалити пов'язані записи (каскад у БД це робить автоматично)
    await supabase.from('pet_state').delete().eq('id', state.id);
    _cachedState = null;
    return await this._createInitialState();
  }

  // ---- Приватні хелпери ------------------------------------------------

  static async _createInitialState() {
    const { data, error } = await supabase
      .from('pet_state')
      .insert({
        username: DEFAULT_STATE.username,
        animal_name: DEFAULT_STATE.animalName,
        animal_type: DEFAULT_STATE.animalImagePath,
        focus_goal: DEFAULT_STATE.focusGoal,
        total_money: DEFAULT_STATE.totalMoney,
      })
      .select()
      .single();

    if (error) throw error;
    const state = dbToState(data);
    _cachedState = state;
    return state;
  }

  static async _updateActiveTimesAte(state) {
    const now = new Date();
    const lastUpdate = new Date(state.lastActiveUpdate);
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
    const periodsPassed = Math.floor(hoursPassed / 6);

    if (periodsPassed > 0 && state.activeTimesAte > 0) {
      const newState = {
        ...state,
        activeTimesAte: Math.max(0, state.activeTimesAte - periodsPassed),
        lastActiveUpdate: now.toISOString(),
      };
      return await this.savePetState(newState);
    }
    return state;
  }

  static async _checkAndResetDailyFocus(state) {
    const today = new Date().toISOString().split('T')[0];
    if (state.focusedTimeDate !== today) {
      const newState = {
        ...state,
        todayFocused: 0,
        focusedTimeDate: today,
      };
      return await this.savePetState(newState);
    }
    return state;
  }
}

export default PetService;

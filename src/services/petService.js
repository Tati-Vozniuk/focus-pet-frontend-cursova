/**
 * PetService - Supabase версія з авторизацією
 * Кожен користувач має власний рядок у pet_state, прив'язаний до user_id
 */

import supabase from './supabaseClient';

let _cachedState = null;

// -----------------------------------------------------------------------
// Маппінг: колонки БД → поля React-стану і назад
// -----------------------------------------------------------------------
function dbToState(row) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    animalName: row.animal_name,
    animalImagePath: row.animal_type,
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
// Helper: get current authenticated user (throws if not logged in)
// -----------------------------------------------------------------------
async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');
  return user.id;
}

// -----------------------------------------------------------------------
// PetService
// -----------------------------------------------------------------------
class PetService {
  // ---- Отримати стан --------------------------------------------------
  static async getPetState() {
    try {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from('pet_state')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row yet — create one for this user
          return await this._createInitialState(userId);
        }
        throw error;
      }

      let state = dbToState(data);
      state = await this._updateActiveTimesAte(state);
      state = await this._checkAndResetDailyFocus(state);

      _cachedState = state;
      return state;
    } catch (err) {
      console.error('getPetState error:', err);
      return _cachedState ?? DEFAULT_STATE;
    }
  }

  // ---- Зберегти стан --------------------------------------------------
  static async savePetState(state) {
    if (!state.id) throw new Error('Cannot save state: missing id');

    const { data, error } = await supabase
      .from('pet_state')
      .update(stateToDb(state))
      .eq('id', state.id)
      .eq('user_id', state.userId) // extra safety — RLS also enforces this
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

    await supabase.from('feeding_history').insert({
      pet_id: state.id,
      user_id: state.userId,
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
      state.todayFocused + minutes >= state.focusGoal &&
      state.todayFocused < state.focusGoal;

    const newState = {
      ...state,
      totalTime: state.totalTime + minutes,
      totalMoney: state.totalMoney + minutes,
      todayFocused: state.todayFocused + minutes,
      focusedTimeDate: today,
    };

    const saved = await this.savePetState(newState);

    await supabase.from('focus_sessions').insert({
      pet_id: state.id,
      user_id: state.userId,
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

  // ---- Час до голоду (синхронний) -------------------------------------
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

    await supabase.from('pet_state').delete().eq('id', state.id);
    _cachedState = null;
    const userId = await getCurrentUserId();
    return await this._createInitialState(userId);
  }

  // ---- Приватні хелпери -----------------------------------------------

  static async _createInitialState(userId) {
    const { data, error } = await supabase
      .from('pet_state')
      .insert({
        user_id: userId,
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
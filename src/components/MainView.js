import { useState, useEffect, useCallback } from 'react';
import PetService from '../services/petService';

function MainView({ petState, onOpenFeed, onOpenFocus, onOpenSettings, onLogout }) {
  const [hungerTime, setHungerTime] = useState({ hours: 0, minutes: 0 });
  const [remainingFocus, setRemainingFocus] = useState(0);

  const updateHungerTime = useCallback(() => {
    if (petState) {
      const time = PetService.getHungerTime(petState);
      setHungerTime(time);
    }
  }, [petState]);

  const updateRemainingFocus = useCallback(() => {
    if (petState) {
      const remaining = PetService.getRemainingFocusTime(petState);
      setRemainingFocus(remaining);
    }
  }, [petState]);

  useEffect(() => {
    if (petState) {
      updateHungerTime();
      updateRemainingFocus();

      const interval = setInterval(() => {
        updateHungerTime();
        updateRemainingFocus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [petState, updateHungerTime, updateRemainingFocus]);

  const getAnimalImage = (imagePath) => {
    const imageMap = {
      'bear_img.png': '/images/bear.png',
      'cat_img.png': '/images/cat.png',
      'bunny_img.png': '/images/bunny.png',
    };
    return imageMap[imagePath] || '/images/bear.png';
  };

  if (!petState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="main-view">
      <h1 className="greeting-text">Hi, {petState.username}</h1>
      <p className="subtitle-text">{petState.animalName} missed you</p>

      <img src={getAnimalImage(petState.animalImagePath)} alt="Pet" className="pet-image" />

      <button className="button feed-button" onClick={onOpenFeed}>
        Feed
      </button>

      <p className="goal-text">Your daily goal is {petState.focusGoal} min</p>
      <p className="goal-text">Time left {remainingFocus} min</p>

      <div className="info-container">
        <div className="info-box">
          <div className="info-number">{petState.totalTime}</div>
          <div className="info-label">total min</div>
        </div>
        <div className="info-box">
          <div className="info-number">{petState.totalTimesAte}</div>
          <div className="info-label">times ate</div>
        </div>
      </div>

      <div className="hunger-box">
        <div className="info-number">
          {hungerTime.hours}h {hungerTime.minutes}m
        </div>
        <div className="info-label">will be hungry in</div>
      </div>

      <div className="button-container">
        <button className="button focus-button" onClick={onOpenFocus}>
          Focus now
        </button>
        <button className="button settings-button" onClick={onOpenSettings}>
          <span className="settings-icon">⚙️</span>
        </button>
      </div>

      <button
        onClick={onLogout}
        style={{
          marginTop: '16px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text, #888)',
          fontSize: '13px',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Log out
      </button>
    </div>
  );
}

export default MainView;
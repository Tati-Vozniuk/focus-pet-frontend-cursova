import { useState, useEffect, useCallback } from 'react';
import PetService from '../services/petService';

function MainView({ petState, onOpenFeed, onOpenFocus, onLogout }) {
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
    return `${process.env.PUBLIC_URL}${imageMap[imagePath] || '/images/bear.png'}`;
  };

  if (!petState) {
    return (
      <div
        className="app-container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="background-circle-left circle-one"></div>
      <div className="background-circle-right circle-two"></div>

      {/* Top card */}
      <div className="top-card-section">
        <div className="coin-display-badge">
          <span>{petState.totalMoney}</span>
          <img className="coin-icon" src={`${process.env.PUBLIC_URL}/images/coin.png`} alt="Coin" />
        </div>
        <h1 className="pet-name-title">{petState.animalName}</h1>
        <img src={getAnimalImage(petState.animalImagePath)} alt="Pet" className="pet-main-image" />
      </div>

      {/* Focus button (overlapping) */}
      <div className="focus-button-wrapper">
        <button className="main-focus button" onClick={onOpenFocus}>
          Focus
          <br />
          now
        </button>
      </div>

      {/* Bottom section */}
      <div className="bottom-content-section">
        <p className="status-text">Hi, {petState.username}!</p>
        <p className="status-text">
          Daily goal: <span className="status-text-bold">{petState.focusGoal} min</span>
        </p>
        <p className="status-text">
          Time left: <span className="status-text-bold">{remainingFocus} min</span>
        </p>
        <p className="status-text">
          Hungry in:{' '}
          <span className="status-text-bold">
            {hungerTime.hours}h {hungerTime.minutes}m
          </span>
        </p>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-number">{petState.totalTime}</div>
            <div className="stat-label">total min</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{petState.totalTimesAte}</div>
            <div className="stat-label">times ate</div>
          </div>
        </div>

        <button className="feed-action button" onClick={onOpenFeed}>
          Feed {petState.animalName}
        </button>

        <button onClick={onLogout} className="logout-button">
          Log out
        </button>
      </div>
    </div>
  );
}

export default MainView;

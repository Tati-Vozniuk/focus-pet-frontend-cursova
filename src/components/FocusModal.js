import { useState, useEffect, useCallback, useRef } from 'react';
import PetService from '../services/petService';
import analytics from '../services/analytics';

function FocusModal({ petState, onClose, refreshPetState, onComplete }) {
  const [sliderValue, setSliderValue] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Precise end-time ref — stays accurate even when tab is throttled
  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    analytics.capture('focus_modal_opened', {
      currentFocusTime: petState.todayFocused,
      focusGoal: petState.focusGoal,
      remainingToGoal: petState.focusGoal - petState.todayFocused,
    });
  }, [petState]);

  const handleComplete = useCallback(async () => {
    if (completed) return;

    clearInterval(intervalRef.current);
    setTimerRunning(false);
    setCompleted(true);

    try {
      const sessionDuration = sliderValue;
      const actualDuration = startTime ? Math.floor((Date.now() - startTime) / 60000) : sliderValue;

      await PetService.completeFocusSession(sliderValue);

      analytics.capture('focus_session_completed', {
        plannedMinutes: sessionDuration,
        actualMinutes: actualDuration,
        earnedMoney: sliderValue,
        totalFocusTime: petState.totalTime + sliderValue,
        goalCompleted: petState.todayFocused + sliderValue >= petState.focusGoal,
      });

      await refreshPetState();
      onComplete(sliderValue);
    } catch (error) {
      console.error('Error completing focus session:', error);
      analytics.capture('focus_session_failed', {
        error: error.message,
        plannedMinutes: sliderValue,
      });
      onComplete(sliderValue);
    }
  }, [sliderValue, refreshPetState, onComplete, completed, startTime, petState]);

  // Separate interval effect so handleComplete doesn't cause re-subscriptions
  useEffect(() => {
    if (!timerRunning) return;

    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;

      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setRemainingTime(left);

      if (left === 0) {
        clearInterval(intervalRef.current);
        handleComplete();
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [timerRunning, handleComplete]);

  const handleStart = () => {
    if (!timerRunning) {
      const durationMs = sliderValue * 60 * 1000;
      endTimeRef.current = Date.now() + durationMs;

      setRemainingTime(sliderValue * 60);
      setTimerRunning(true);
      setCompleted(false);
      setStartTime(Date.now());

      analytics.capture('focus_session_started', {
        plannedMinutes: sliderValue,
        currentTime: new Date().toISOString(),
      });
    }
  };

  const handleReset = () => {
    const wasRunning = timerRunning;
    const timeElapsed = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;

    clearInterval(intervalRef.current);
    endTimeRef.current = null;

    setTimerRunning(false);
    setRemainingTime(0);
    setCompleted(false);
    setStartTime(null);

    if (wasRunning) {
      analytics.capture('focus_session_cancelled', {
        plannedMinutes: sliderValue,
        timeElapsedMinutes: timeElapsed,
        percentageCompleted: Math.floor((timeElapsed / sliderValue) * 100),
      });
    }
  };

  const handleClose = () => {
    if (timerRunning) {
      const timeElapsed = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;
      analytics.capture('focus_modal_closed_during_session', {
        plannedMinutes: sliderValue,
        timeElapsedMinutes: timeElapsed,
      });
    } else {
      analytics.capture('focus_modal_closed', { startedSession: false });
    }
    onClose();
  };

  const formatTime = () => {
    if (timerRunning) {
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${sliderValue} min`;
  };

  const getAnimalImage = (imagePath) => {
    const imageMap = {
      'bear_img.png': '/images/bear.png',
      'cat_img.png': '/images/cat.png',
      'bunny_img.png': '/images/bunny.png',
    };
    return `${process.env.PUBLIC_URL}${imageMap[imagePath] || '/images/bear.png'}`;
  };

  return (
    <div
      className="app-container"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 10,
      }}
    >
      <div className="background-circle-left circle-one"></div>
      <div className="background-circle-right circle-two"></div>
      <div className="background-circle-right circle-three"></div>

      <div className="top-card-section focus-card">
        <button className="back button" onClick={handleClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 12H5"
              stroke="#F06C78"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 19L5 12L12 5"
              stroke="#F06C78"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h1 className="focus-screen-title">Time to focus</h1>

        <img src={getAnimalImage(petState.animalImagePath)} alt="Pet" className="focus-pet-image" />

        <div className="big-timer-display">{formatTime()}</div>

        <div className="focus-slider-container">
          <input
            type="range"
            min="1"
            max="120"
            step="1"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="focus-slider-input"
            disabled={timerRunning}
          />
        </div>
      </div>

      <div className="focus-controls-footer">
        <button
          className="main-focus button"
          style={{ width: 160, height: 160 }}
          onClick={handleStart}
          disabled={timerRunning}
        >
          {timerRunning ? 'Running' : 'Focus'}
        </button>

        <button className="reset-text-button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default FocusModal;

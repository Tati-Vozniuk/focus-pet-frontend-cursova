import { useState, useEffect, useCallback } from 'react';
import PetService from '../services/petService';
import analytics from '../services/analytics';

function FocusModal({ petState, onClose, refreshPetState, onComplete }) {
  const [sliderValue, setSliderValue] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    // Відстежити відкриття модалки фокусування
    analytics.capture('focus_modal_opened', {
      currentFocusTime: petState.todayFocused,
      focusGoal: petState.focusGoal,
      remainingToGoal: petState.focusGoal - petState.todayFocused,
    });
  }, [petState]);

  const handleComplete = useCallback(() => {
    if (completed) {
      return;
    }

    setTimerRunning(false);
    setCompleted(true);

    try {
      const sessionDuration = sliderValue;
      const actualDuration = startTime ? Math.floor((Date.now() - startTime) / 60000) : sliderValue;

      PetService.completeFocusSession(sliderValue);

      // Відстежити успішне завершення фокусування
      analytics.capture('focus_session_completed', {
        plannedMinutes: sessionDuration,
        actualMinutes: actualDuration,
        earnedMoney: sliderValue,
        totalFocusTime: petState.totalTime + sliderValue,
        goalCompleted: petState.todayFocused + sliderValue >= petState.focusGoal,
      });

      refreshPetState();
      onComplete(sliderValue);
    } catch (error) {
      console.error('Error completing focus session:', error);

      analytics.capture('focus_session_failed', {
        error: error.message,
        plannedMinutes: sliderValue,
      });
    }
  }, [sliderValue, refreshPetState, onComplete, completed, startTime, petState]);

  useEffect(() => {
    let interval;
    if (timerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRunning && remainingTime === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [timerRunning, remainingTime, handleComplete]);

  const handleStart = () => {
    if (!timerRunning) {
      setRemainingTime(sliderValue * 60);
      setTimerRunning(true);
      setCompleted(false);
      setStartTime(Date.now());

      // Відстежити початок фокусування
      analytics.capture('focus_session_started', {
        plannedMinutes: sliderValue,
        currentTime: new Date().toISOString(),
      });
    }
  };

  const handleReset = () => {
    const wasRunning = timerRunning;
    const timeElapsed = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;

    setTimerRunning(false);
    setRemainingTime(sliderValue * 60);
    setCompleted(false);
    setStartTime(null);

    // Відстежити скидання (переривання)
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

      // Відстежити закриття під час фокусування
      analytics.capture('focus_modal_closed_during_session', {
        plannedMinutes: sliderValue,
        timeElapsedMinutes: timeElapsed,
      });
    } else {
      // Відстежити закриття без старту
      analytics.capture('focus_modal_closed', {
        startedSession: false,
      });
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
    return imageMap[imagePath] || '/images/bear.png';
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal focus-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-header">Time To Focus</h2>

        <img src={getAnimalImage(petState.animalImagePath)} alt="Pet" className="pet-image" />

        <div className="timer-display">{formatTime()}</div>

        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="120"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="slider"
            disabled={timerRunning}
          />
        </div>

        <button className="button focus-modal-button" onClick={handleStart} disabled={timerRunning}>
          Focus
        </button>

        <button className="button focus-modal-button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default FocusModal;

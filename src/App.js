import { useState, useEffect, useCallback } from 'react';
import './App.css';
import MainView from './components/MainView';
import FeedModal from './components/FeedModal';
import FocusModal from './components/FocusModal';
import SettingsModal from './components/SettingsModal';
import PopupModal from './components/PopupModal';
import PetService from './services/petService';
import analytics from './services/analytics';

function App() {
  const [petState, setPetState] = useState(null);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const fetchPetState = useCallback(() => {
    try {
      const data = PetService.getPetState();
      setPetState(data);

      // Ідентифікувати користувача в PostHog
      if (data.username && data.username !== 'Username') {
        analytics.identify(data.username, {
          animalName: data.animalName,
          animalType: data.animalImagePath,
          focusGoal: data.focusGoal,
        });
      }
    } catch (error) {
      console.error('Error fetching pet state:', error);
      showError('Failed to load pet data. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    // Ініціалізувати PostHog
    analytics.init();

    // Відстежити завантаження додатку
    analytics.capture('app_loaded', {
      env: process.env.REACT_APP_ENV,
      version: process.env.REACT_APP_VERSION,
    });

    // Завантажити стан
    fetchPetState();

    if (process.env.REACT_APP_DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.log(' Environment Info:', {
        mode: process.env.REACT_APP_ENV,
        status: process.env.REACT_APP_STATUS,
        version: process.env.REACT_APP_VERSION,
        storage: 'localStorage (frontend-only)',
        analytics: 'PostHog enabled',
      });
    }
  }, [fetchPetState]);

  const showError = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  const showSuccess = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  const handleFocusComplete = (minutes) => {
    setShowFocusModal(false);
    showSuccess(`You've earned ${minutes} ⍟`);
  };

  return (
    <div className="app-container" style={{ paddingBottom: '40px' }}>
      <MainView
        petState={petState}
        onOpenFeed={() => setShowFeedModal(true)}
        onOpenFocus={() => setShowFocusModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        refreshPetState={fetchPetState}
      />

      {showFeedModal && petState && (
        <FeedModal
          petState={petState}
          onClose={() => setShowFeedModal(false)}
          refreshPetState={fetchPetState}
          onError={showError}
        />
      )}

      {showFocusModal && petState && (
        <FocusModal
          petState={petState}
          onClose={() => setShowFocusModal(false)}
          refreshPetState={fetchPetState}
          onComplete={handleFocusComplete}
        />
      )}

      {showSettingsModal && petState && (
        <SettingsModal
          petState={petState}
          onClose={() => setShowSettingsModal(false)}
          refreshPetState={fetchPetState}
          onError={showError}
        />
      )}

      {showPopup && <PopupModal message={popupMessage} onClose={() => setShowPopup(false)} />}
    </div>
  );
}

export default App;

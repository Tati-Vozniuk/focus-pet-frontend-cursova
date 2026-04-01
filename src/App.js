import { useState, useEffect, useCallback } from 'react';
import './App.css';
import AuthPage from './components/AuthPage';
import MainView from './components/MainView';
import FeedModal from './components/FeedModal';
import FocusModal from './components/FocusModal';
import SettingsModal from './components/SettingsModal';
import PopupModal from './components/PopupModal';
import PetService from './services/petService';
import supabase from './services/supabaseClient';
import analytics from './services/analytics';

function App() {
  const [session, setSession] = useState(undefined); // undefined = ще перевіряємо
  const [petState, setPetState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const showError = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  const showSuccess = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  // Слухаємо зміни сесії (логін / логаут)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPetState = useCallback(async () => {
    try {
      const data = await PetService.getPetState();
      setPetState(data);

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
    } finally {
      setLoading(false);
    }
  }, []);

  // Завантажуємо дані тільки якщо є сесія
  useEffect(() => {
    if (session === undefined) return; // ще чекаємо

    analytics.init();
    analytics.capture('app_loaded', {
      env: process.env.REACT_APP_ENV,
      version: process.env.REACT_APP_VERSION,
    });

    if (session) {
      fetchPetState();
    } else {
      setLoading(false);
    }
  }, [session, fetchPetState]);

  const handleFocusComplete = (minutes) => {
    setShowFocusModal(false);
    showSuccess(`You've earned ${minutes} ⍟`);
  };

  // Ще перевіряємо сесію
  if (session === undefined) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Не авторизований — показуємо екран входу
  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Авторизований, але дані ще вантажяться
  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

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
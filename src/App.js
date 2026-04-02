import { useState, useEffect, useCallback } from 'react';
import './App.css';
import MainView from './components/MainView';
import FeedModal from './components/FeedModal';
import FocusModal from './components/FocusModal';
import SettingsModal from './components/SettingsModal';
import PopupModal from './components/PopupModal';
import AuthModal from './components/AuthModal';
import PetService from './services/petService';
import analytics from './services/analytics';
import supabase from './services/supabaseClient';

function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
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

  // ---- Auth state listener -------------------------------------------
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login / logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // User logged out — clear pet data
        setPetState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---- Fetch pet state once session is ready -------------------------
  const fetchPetState = useCallback(async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    analytics.init();
    analytics.capture('app_loaded', {
      env: process.env.REACT_APP_ENV,
      version: process.env.REACT_APP_VERSION,
    });
  }, []);

  // Fetch pet data when session becomes available
  useEffect(() => {
    if (session) {
      fetchPetState();
    }
  }, [session, fetchPetState]);

  const handleFocusComplete = (minutes) => {
    setShowFocusModal(false);
    showSuccess(`You've earned ${minutes} ⍟`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    analytics.reset();
  };

  // Still determining auth state
  if (session === undefined) {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in — show auth screen
  if (!session) {
    return <AuthModal />;
  }

  // Logged in but pet data still loading
  if (loading) {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
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
        onLogout={handleLogout}
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

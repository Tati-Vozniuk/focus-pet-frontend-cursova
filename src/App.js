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
  const [session, setSession] = useState(undefined);
  const [petState, setPetState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('main'); // 'main' | 'focus'
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const showError = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  const showSuccess = (minutes) => {
    setRewardAmount(minutes);
    setShowReward(true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSession((prev) => {
          if (prev?.user?.id === session?.user?.id) return prev;
          return session;
        });
      }
      if (event === 'SIGNED_OUT') {
        PetService.clearCache();
        setSession(null);
        setPetState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPetState = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
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
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    analytics.init();
    analytics.capture('app_loaded', {
      env: process.env.REACT_APP_ENV,
      version: process.env.REACT_APP_VERSION,
    });
  }, []);

  useEffect(() => {
    if (session) {
      fetchPetState(true);
    }
  }, [session, fetchPetState]);

  const handleFocusComplete = (minutes) => {
    setCurrentPage('main');
    showSuccess(minutes);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    analytics.reset();
  };

  if (session === undefined) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthModal />;
  }

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // ── Focus page — повноекранна, без navbar ──
  if (currentPage === 'focus' && petState) {
    return (
      <div className="app-container">
        <FocusModal
          petState={petState}
          onClose={() => setCurrentPage('main')}
          refreshPetState={fetchPetState}
          onComplete={handleFocusComplete}
        />

        {showReward && (
          <PopupModal
            isReward
            rewardAmount={rewardAmount}
            onClose={() => setShowReward(false)}
          />
        )}
      </div>
    );
  }

  // ── Main page ──
  return (
    <div className="app-container">
      <MainView
        petState={petState}
        onOpenFeed={() => setShowFeedModal(true)}
        onOpenFocus={() => setCurrentPage('focus')}
        onOpenSettings={() => setShowSettingsModal(true)}
        refreshPetState={fetchPetState}
        onLogout={handleLogout}
      />

      <nav className="bottom-navbar">
        <div className="navbar-icon button" onClick={() => window.location.reload()}>
          <img src={`${process.env.PUBLIC_URL}/images/home.svg`} alt="Home" />
        </div>
        <div className="navbar-icon button" onClick={() => setShowSettingsModal(true)}>
          <img src={`${process.env.PUBLIC_URL}/images/settings.svg`} alt="Settings" />
        </div>
      </nav>

      {showFeedModal && petState && (
        <FeedModal
          petState={petState}
          onClose={() => setShowFeedModal(false)}
          refreshPetState={fetchPetState}
          onError={showError}
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

      {showPopup && (
        <PopupModal message={popupMessage} onClose={() => setShowPopup(false)} />
      )}

      {showReward && (
        <PopupModal
          isReward
          rewardAmount={rewardAmount}
          onClose={() => setShowReward(false)}
        />
      )}
    </div>
  );
}

export default App;
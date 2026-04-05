import { useState, useEffect } from 'react';
import PetService from '../services/petService';
import analytics from '../services/analytics';

function SettingsModal({ petState, onClose, refreshPetState, onError }) {
  const [username, setUsername] = useState('');
  const [animalName, setAnimalName] = useState('');
  const [focusGoal, setFocusGoal] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('bear_img.png');
  const [saving, setSaving] = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [animalNameError, setAnimalNameError] = useState('');
  const [goalError, setGoalError] = useState('');

  const animals = [
    { id: 'bear_img.png', name: 'Bear' },
    { id: 'cat_img.png', name: 'Cat' },
    { id: 'bunny_img.png', name: 'Bunny' },
  ];

  useEffect(() => {
    analytics.capture('settings_opened');
    if (petState) {
      setUsername(petState.username);
      setAnimalName(petState.animalName);
      setFocusGoal(String(petState.focusGoal));
      setSelectedAnimal(petState.animalImagePath);
    }
  }, [petState]);

  const validateUsername = (value) => {
    if (value && value.includes(' ')) {
      setUsernameError('Must be a single word');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateAnimalName = (value) => {
    if (value && value.includes(' ')) {
      setAnimalNameError('Must be a single word');
      return false;
    }
    setAnimalNameError('');
    return true;
  };

  const validateGoal = (value) => {
    if (value && !/^\d+$/.test(value)) {
      setGoalError('Numbers only');
      return false;
    }
    if (value && parseInt(value) <= 0) {
      setGoalError('Must be positive');
      return false;
    }
    setGoalError('');
    return true;
  };

  const changeAnimal = (direction) => {
    const currentIndex = animals.findIndex((a) => a.id === selectedAnimal);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = animals.length - 1;
    if (nextIndex >= animals.length) nextIndex = 0;
    const next = animals[nextIndex];
    setSelectedAnimal(next.id);
    if (next.id !== petState.animalImagePath) {
      analytics.capture('animal_changed', {
        from: petState.animalImagePath,
        to: next.id,
      });
    }
  };

  const handleSave = async () => {
    const isUsernameValid = validateUsername(username);
    const isAnimalNameValid = validateAnimalName(animalName);
    const isGoalValid = validateGoal(focusGoal);

    if (!isUsernameValid || !isAnimalNameValid || !isGoalValid) {
      analytics.capture('settings_validation_failed', {
        usernameError: !isUsernameValid,
        animalNameError: !isAnimalNameValid,
        goalError: !isGoalValid,
      });
      onError('Please fix the validation errors before saving');
      return;
    }

    if (!username.trim() || !animalName.trim() || !focusGoal.trim()) {
      onError('All fields are required');
      return;
    }

    setSaving(true);
    try {
      const changes = {};
      if (username !== petState.username)
        changes.username = { from: petState.username, to: username };
      if (animalName !== petState.animalName)
        changes.animalName = { from: petState.animalName, to: animalName };
      if (parseInt(focusGoal) !== petState.focusGoal)
        changes.focusGoal = { from: petState.focusGoal, to: parseInt(focusGoal) };
      if (selectedAnimal !== petState.animalImagePath)
        changes.animalType = { from: petState.animalImagePath, to: selectedAnimal };

      await PetService.updateSettings({
        username: username.trim(),
        animalName: animalName.trim(),
        focusGoal: parseInt(focusGoal),
        animalImagePath: selectedAnimal,
      });

      analytics.capture('settings_saved', {
        changes,
        changesCount: Object.keys(changes).length,
      });

      analytics.identify(username.trim(), {
        animalName: animalName.trim(),
        animalType: selectedAnimal,
        focusGoal: parseInt(focusGoal),
      });

      await refreshPetState();
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      analytics.capture('settings_save_failed', { error: error.message });
      onError('Failed to save settings');
    } finally {
      setSaving(false);
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="background-circle-left circle-one"></div>
      <div className="background-circle-right circle-two"></div>

      <div className="top-card-section">
        <button className="back button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

        <h1 className="settings-title">Settings</h1>

        <div className="animal-selection-container">
          <button className="arrow-btn" onClick={() => changeAnimal(-1)}>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
              <path
                d="M20 36L4 20L20 4"
                stroke="#F06C78"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <img src={getAnimalImage(selectedAnimal)} alt="Pet" className="settings-pet-image" />
          <button className="arrow-btn" onClick={() => changeAnimal(1)}>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
              <path
                d="M4 4L20 20L4 36"
                stroke="#F06C78"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="animal-type-badge">
          {animals.find((a) => a.id === selectedAnimal)?.name}
        </div>
      </div>

      <div className="settings-form">
        <div className="input-block">
          <div className="input-group">
            <label>Your name</label>
            <input
              type="text"
              value={username}
              placeholder="single word only"
              onChange={(e) => {
                setUsername(e.target.value);
                validateUsername(e.target.value);
              }}
            />
            {usernameError && <div className="validation-error">{usernameError}</div>}
          </div>

          <div className="input-group">
            <label>Animal name</label>
            <input
              type="text"
              value={animalName}
              placeholder="single word only"
              onChange={(e) => {
                setAnimalName(e.target.value);
                validateAnimalName(e.target.value);
              }}
            />
            {animalNameError && <div className="validation-error">{animalNameError}</div>}
          </div>

          <div className="input-group">
            <label>Daily focus goal (min)</label>
            <input
              type="text"
              value={focusGoal}
              placeholder="numbers only"
              onChange={(e) => {
                setFocusGoal(e.target.value);
                validateGoal(e.target.value);
              }}
            />
            {goalError && <div className="validation-error">{goalError}</div>}
          </div>
        </div>

        <button className="save-action button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;

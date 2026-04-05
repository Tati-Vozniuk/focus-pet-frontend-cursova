import { useState, useEffect, useCallback } from 'react';
import PetService from '../services/petService';
import analytics from '../services/analytics';

const FOOD_ITEMS = [
  { id: 1, name: 'Cake Splice', price: 50, imagePath: '/images/food/food-1.png' },
  { id: 2, name: 'Cake S', price: 50, imagePath: '/images/food/food-2.png' },
  { id: 3, name: 'Cake Coffee', price: 50, imagePath: '/images/food/food-3.png' },
  { id: 4, name: 'Donut', price: 50, imagePath: '/images/food/food-4.png' },
  { id: 5, name: 'Cake Small', price: 50, imagePath: '/images/food/food-5.png' },
  { id: 6, name: 'Cake Splice 2', price: 50, imagePath: '/images/food/food-6.png' },
];

function FeedModal({ petState, onClose, refreshPetState, onError }) {
  const [selectedFood, setSelectedFood] = useState(null);
  const [feeding, setFeeding] = useState(false);
  const [hungerTime, setHungerTime] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    analytics.capture('feed_modal_opened', {
      currentMoney: petState.totalMoney,
      hungerLevel: petState.activeTimesAte,
    });
  }, [petState]);

  const updateHungerTime = useCallback(() => {
    const time = PetService.getHungerTime(petState);
    setHungerTime(time);
  }, [petState]);

  useEffect(() => {
    updateHungerTime();
    const interval = setInterval(updateHungerTime, 2500);
    return () => clearInterval(interval);
  }, [updateHungerTime]);

  const handleFeed = async () => {
    if (feeding || !selectedFood) return;
    setFeeding(true);

    try {
      const moneyBefore = petState.totalMoney;
      const cost = selectedFood.price;

      if (moneyBefore < cost) {
        onError(
          <span>
            Not enough{' '}
            <img
              className="popup-icon"
              src={`${process.env.PUBLIC_URL}/images/coin.png`}
              alt="Coin"
            />{' '}
            to buy this treat!
          </span>
        );
        setFeeding(false);
        return;
      }

      await PetService.feedPet(cost);

      analytics.capture('pet_fed', {
        moneyBefore,
        moneyAfter: moneyBefore - cost,
        foodName: selectedFood.name,
        cost,
        totalTimesAte: petState.totalTimesAte + 1,
        animalType: petState.animalImagePath,
      });

      await refreshPetState();
      onClose();
    } catch (error) {
      analytics.capture('feed_failed', {
        reason: error.message,
        currentMoney: petState.totalMoney,
      });
      onError(error.message);
    } finally {
      setFeeding(false);
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

      <div className="top-card-section feed-top-card">
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

        <h1 className="pet-name-title">{petState.animalName}</h1>
        <img src={getAnimalImage(petState.animalImagePath)} alt="Pet" className="pet-main-image" />

        <div className="coin-display-badge feed-coin-badge">
          <span>{petState.totalMoney}</span>
          <img className="coin-icon" src={`${process.env.PUBLIC_URL}/images/coin.png`} alt="Coin" />
        </div>

        <p className="status-text">
          Hungry in:{' '}
          <span className="status-text-bold">
            {hungerTime.hours}h {hungerTime.minutes}m
          </span>
        </p>
      </div>

      <div className="bottom-content-section" style={{ paddingTop: '20px' }}>
        <div className="food-grid">
          {FOOD_ITEMS.map((food) => (
            <div className="food-block" key={food.id}>
              <div
                className={`food-item ${selectedFood?.id === food.id ? 'selected' : ''}`}
                onClick={() => setSelectedFood(food)}
              >
                <div className="food-image-wrapper">
                  <img src={`${process.env.PUBLIC_URL}${food.imagePath}`} alt={food.name} />
                </div>
              </div>
              <div className="food-price-badge">
                <span>{food.price}</span>
                <img
                  className="coin-icon"
                  src={`${process.env.PUBLIC_URL}/images/coin.png`}
                  alt="Coin"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className="feed-action button"
          onClick={handleFeed}
          disabled={feeding || !selectedFood}
        >
          {feeding ? (
            'Feeding...'
          ) : selectedFood ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Feed {petState.animalName} {selectedFood.price}
              <img
                className="coin-icon"
                src={`${process.env.PUBLIC_URL}/images/coin.png`}
                alt="Coin"
              />
            </span>
          ) : (
            'Select a treat'
          )}
        </button>
      </div>
    </div>
  );
}

export default FeedModal;

import { useEffect, useState } from 'react';
import analytics from '../services/analytics';

function PremiumButton() {
  const [showButton, setShowButton] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.onFeatureFlags(() => {
      const isEnabled = analytics.isFeatureEnabled('show-premium-button');
      setShowButton(isEnabled);
      setLoading(false);

      // eslint-disable-next-line no-console
      console.log('Premium button feature flag:', isEnabled);
    });
  }, []);

  if (loading) {
    return null;
  }

  if (!showButton) {
    return null;
  }

  const handleClick = () => {
    analytics.capture('premium_button_clicked');

    alert(
      "🌟 Premium Feature!\n\nЦе демонстрація Feature Flag.\nКнопка з'являється тільки коли прапорець увімкнений в PostHog!"
    );
  };

  return (
    <button
      className="button premium-button"
      onClick={handleClick}
      style={{
        backgroundColor: '#FFD700',
        color: '#000',
        border: '3px solid #FFA500',
        fontWeight: 'bold',
        marginTop: '15px',
        fontSize: '18px',
        padding: '15px 30px',
        boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)',
      }}
    >
      ⭐ Premium Mode
    </button>
  );
}

export default PremiumButton;

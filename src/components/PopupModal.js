function PopupModal({ message, onClose, isReward, rewardAmount }) {
  if (isReward) {
    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup" onClick={(e) => e.stopPropagation()}>
          <div className="background-circle-left circle-one"></div>
          <div className="background-circle-right circle-two"></div>
          <div className="background-circle-right circle-three"></div>
          <div className="background-circle-left circle-four"></div>
          <h2 className="popup-title">You've earned</h2>
          <div className="reward-display">
            <div className="popup-reward-amount">
              <span className="popup-title">{rewardAmount}</span>
              <img className="popup-icon" src="/images/coin.png" alt="Coin" />
            </div>
            <button className="popup-btn button" onClick={onClose}>
              Claim
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <div className="background-circle-left circle-one"></div>
        <div className="background-circle-right circle-two"></div>
        <div className="background-circle-right circle-three"></div>
        <div className="background-circle-left circle-four"></div>
        <p className="popup-message">{message}</p>
        <button className="popup-btn button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default PopupModal;

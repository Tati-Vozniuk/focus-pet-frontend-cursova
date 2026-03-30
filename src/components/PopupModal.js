function PopupModal({ message, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal popup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="popup-message">{message}</div>

        <button className="button close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default PopupModal;

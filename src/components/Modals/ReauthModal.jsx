// components/ReauthModal.js
import React, { useState } from "react";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import Modal from './Modal';
import '../../styles/ForModals/reauthModal.css'

const ReauthModal = ({ email, onSuccess, onClose }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleReauth = async () => {
    try {
      if (password.trim() === "") {
        setError("יש להזין סיסמה."); // Display an error message for empty input
        return;
      }
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setError("");
      onSuccess(password); // This will trigger editing
      // onClose(); // This will hide the modal
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("סיסמה שגויה."); // Specific error for wrong password
      } else if (err.code === "auth/too-many-requests") {
        setError("יותר מדי ניסיונות כושלים. נסה שוב מאוחר יותר."); // Handle rate-limiting
      } else {
        setError("תקלה באימות. נסה שוב."); // Generic error message
      }
    }
  };
  
  return (
    <Modal onClose={onClose}>
      <div className="reauth">
        <h2>אימות מחדש נדרש</h2>
        <input
          type="password"
          placeholder="הזן סיסמה נוכחית"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        {!error && <p className="placeholder">  </p>}
        <div className="reauth-actions">
          <button onClick={handleReauth} className="reauth-button">אמת</button>
          <button onClick={onClose} className="reauth-button">ביטול</button>
        </div>
      </div>
    </Modal>
  );
};

export default ReauthModal;

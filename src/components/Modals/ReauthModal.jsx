// components/ReauthModal.js
import React, { useState } from "react";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import Modal from './Modal';
import '../../styles/ForModals/reauthModal.css'
import { toast } from 'react-toastify';

const ReauthModal = ({ email, onSuccess, onClose }) => {
  const [password, setPassword] = useState("");

  const handleReauth = async () => {
    try {
      if (password.trim() === "") {
        toast.error("יש להזין סיסמה.");
        return;
      }
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      toast.success("אימות בוצע בהצלחה!");
      onSuccess(password);
      onClose();
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        toast.error("סיסמה שגויה.");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("יותר מדי ניסיונות כושלים. נסה שוב מאוחר יותר.");
      } else {
        toast.error("תקלה באימות. נסה שוב.");
      }
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="Product-modal">
        <h2>אימות מחדש נדרש</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleReauth();
          }}
          className="Product-form"
        >
          <div className="Product-form-group">
            <label>סיסמה נוכחית:</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autocomplete="new-password"
            />
          </div>
          <div className="Product-button-group">
            <button type="submit" className="NewProduct-button">אמת</button>
            <button type="button" onClick={onClose} className="NewProduct-button">ביטול</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReauthModal;

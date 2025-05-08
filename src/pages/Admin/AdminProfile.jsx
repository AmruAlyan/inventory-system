import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faBan, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../../styles/Profile.css";
import ReauthModal from "../../components/ReauthModal";

const labelMap = {
  name: "שם",
  email: "דוא\"ל",
  password: "סיסמא"
};

const AdminProfile = () => {
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [originalData, setOriginalData] = useState(formData);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFormData({
            name: userData.name || "",
            email: user.email || "",
            password: ""
          });
          setOriginalData({
            name: userData.name || "",
            email: user.email || "",
            password: ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchData();
  }, [user]);

  const handleEdit = (passwordFromModal) => {
    setCurrentPassword(passwordFromModal); // Save for use during confirmEdit
    setIsEditing(true);                    // Enter edit mode
  };
  

  const cancelEdit = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

const confirmEdit = async () => {
    const allFilled = Object.values(formData).every((value) => value.trim() !== "");
    if (!allFilled) {
      alert("אנא מלא את כל השדות");
      return;
    }
  
    // Reference to the current authenticated user
    const user = auth.currentUser;
  
    if (user) {
      // Reauthenticate only if there are changes to email or password
      if (formData.email !== originalData.email || formData.password !== originalData.password) {
        console.log("step 1")
        try {
          console.log(originalData)
          const credentials = EmailAuthProvider.credential(user.email, currentPassword);
          console.log(credentials)
          await reauthenticateWithCredential(user, credentials); // Reauthentication step
        } catch (error) {
          alert("נכשל בהתחברות מחדש: " + error.message);
          return; // Stop if reauthentication fails
        }
      }
  
      // Check if the email has been changed
      if (formData.email !== originalData.email) {
        try {
          await updateEmail(user, formData.email); // Update email
        } catch (error) {
          alert("נכשל בעדכון כתובת הדוא\"ל: " + error.message);
          return; // Stop if email update fails
        }
      }
  
      // Check if the password has been changed
      if (formData.password !== originalData.password) {
        try {
          await updatePassword(user, formData.password); // Update password
        } catch (error) {
          alert("נכשל בעדכון הסיסמה: " + error.message);
          return; // Stop if password update fails
        }
      }
  
      // Now update the Firestore document with the new user data
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,  // Firestore should have the updated email
          password: formData.password, // You could skip storing the password if it's sensitive
        }, { merge: true }); // Merges the new data with the existing document
        alert("העדכון בוצע בהצלחה!");
      } catch (error) {
        console.error("Firestore update failed:", error.message);
        alert("נכשל בעדכון בפרופיל.");
      }
  
      setIsEditing(false); // Close the edit mode
    } else {
      alert("לא ניתן לזהות את המשתמש. אנא התחבר מחדש.");
    }
  };

  const getUserInfo = () => {
    return Object.keys(formData).map((key, index) => {
      const value = key === "password" && !isEditing ? "********" : formData[key];
      return (
        <tr key={index}>
          <td>{labelMap[key]}:</td>
          <td>{value}</td>
        </tr>
      );
    });
  };

  const renderFormGroup = (label, key, type = "text") => {
    if (key === "password") {
      return (
        <div className="form-group input-with-icon" key={key}>
          <label htmlFor={key}>{label}</label>
          <div className="input-wrapper">
            <input
              id={key}
              type={showPassword ? "text" : "password"}
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              placeholder="סיסמה חדשה (לא חובה)"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="eye-button"
              aria-label="Toggle password visibility"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="pass-eye-icon" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="form-group input-no-icon" key={key}>
        <label htmlFor={key}>{label}</label>
        <input
          id={key}
          type={type}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          required
        />
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-title">
        <h1><u>פרופיל</u></h1>
      </div>
      <div className="profile-content">
        <p>ברוכים הבאים לפרופיל שלך!</p>
        <p>כאן אתה יכול לראות ולערוך את המאפיינים שלך.</p>
      </div>

      {!isEditing && (
        <div className="profile-info">
          <h2><u>מאפייני המשתמש</u></h2>
          <table>
            <tbody>{getUserInfo()}</tbody>
          </table>
          <button onClick={() => setShowReauthModal(true)} className="edit-button">
            <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
            <span className="edit-text">עריכת מאפיינים שלי</span>
          </button>
        </div>
      )}

      {showReauthModal && (
        <ReauthModal
          email={originalData.email}
          onSuccess={(password) => handleEdit(password)} // Pass password to handler
          onClose={() => setShowReauthModal(false)}
        />
      )}




      {isEditing && (
        <div className="edit-info">
          <h2>עריכת מאפייני המשתמש</h2>
          {renderFormGroup("שם:", "name")}
          {renderFormGroup("דוא\"ל:", "email", "email")}
          {renderFormGroup("סיסמא:", "password", "password")}

          <div className="profile-actions">
            <button onClick={confirmEdit} className="edit-button">
              <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
              <span className="edit-text">עדכון</span>
            </button>
            <button onClick={cancelEdit} className="edit-button">
              <FontAwesomeIcon icon={faBan} className="profile-icon" />
              <span className="edit-text">ביטול</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;

import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faBan, faEye, faEyeSlash, faUser, faAt, faLock, faBriefcase } from "@fortawesome/free-solid-svg-icons";
import "../../styles/Profile.css";
import ReauthModal from "../../components/Modals/ReauthModal";
import { ROLES } from "../../constants/roles";
import { showAlert } from "../../utils/iosDialogs";

const labelMap = {
  name: "שם",
  email: "דוא\"ל",
  password: "סיסמא",
  role: "תפקיד"
};

const ManagerProfile = () => {
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "מנהל מלאי"
  });
  const [originalData, setOriginalData] = useState(formData);
  const [avatarUrl, setAvatarUrl] = useState("");

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
            password: "",
            role: "מנהל מלאי" // Static role for Manager
          });
          
          setOriginalData({
            name: userData.name || "",
            email: user.email || "",
            password: "",
            role: "מנהל מלאי"
          });
          
          // Set avatar URL if exists
          if (userData.avatarUrl) {
            setAvatarUrl(userData.avatarUrl);
          }
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
      showAlert("אנא מלא את כל השדות");
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
          showAlert("נכשל בהתחברות מחדש: " + error.message);
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
        // Create an update object
        const updateData = {
          name: formData.name,
          email: formData.email,  // Firestore should have the updated email
        };

        // Only include password if it's been changed
        if (formData.password !== originalData.password && formData.password.trim() !== "") {
          updateData.password = formData.password;
        }

        // Update Firestore with the new data
        await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
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
    // Filter out any fields we don't want to show
    return Object.keys(formData)
      .filter(key => key !== "password" || !isEditing) // Only show password during edit
      .map((key, index) => {
        // Special handling for password field
        let value = formData[key];
        if (key === "password" && !isEditing) {
          value = "********";
        }
        // For fields that shouldn't be editable
        const isReadOnly = key === "role";
        let icon = null;
        switch(key) {
          case "role":
            icon = <FontAwesomeIcon icon={faBriefcase} className="details-icon" />;
            break;
          case "name":
            icon = <FontAwesomeIcon icon={faUser} className="details-icon" />;
            break;
          case "email":
            icon = <FontAwesomeIcon icon={faAt} className="details-icon" />;
            break;
          case "password":
            icon = <FontAwesomeIcon icon={faLock} className="details-icon" />;
            break;
          default:
            icon = null;
        }
        return (
          <tr key={index} className={isReadOnly ? "readonly-field" : ""}>
            <td>{icon} {labelMap[key]}:</td>
            <td>{value}</td>
          </tr>
        );
      });
  };

  const renderFormGroup = (label, key, type = "text", readOnly = false) => {
    if (key === "password") {
      return (
        <div className="form-group input-with-icon" key={key}>
          <label htmlFor={key}>{label}</label>
          <div className="input-wrapper">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="eye-button"
              aria-label="Toggle password visibility"
              disabled={readOnly}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="pass-eye-icon" />
            </button>
            <input
              id={key}
              type={showPassword ? "text" : "password"}
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              placeholder="סיסמה חדשה (לא חובה)"
              disabled={readOnly}
              readOnly={readOnly}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`form-group input-no-icon${readOnly ? ' read-only' : ''}`} key={key}>
        <label htmlFor={key}>{label}</label>
        <input
          id={key}
          type={type}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          required
          disabled={readOnly}
          readOnly={readOnly}
        />
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-title">
        <h1>פרופיל</h1>
      </div>
      
      {/* Profile Avatar */}
      <div className="profile-avatar-container">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="profile-avatar-placeholder" />
          )}
        </div>
      </div>
      
      

      {!isEditing && (
        <div className="profile-info">
          <h2>מאפייני המשתמש</h2>
          <table className="profile-details-table">
            <tbody>{getUserInfo()}</tbody>
          </table>
          <button onClick={() => setShowReauthModal(true)} className="edit-button">
            <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
            <span className="edit-text">עריכה</span>
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
          {renderFormGroup("תפקיד:", "role", "text", true)}
          {renderFormGroup("שם:", "name")}
          {renderFormGroup("דוא\"ל:", "email", "email")}
          {renderFormGroup("סיסמא:", "password", "password")}
          
          <div className="profile-actions">
            <button onClick={confirmEdit} className="edit-button">
              <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
              <span className="edit-text">עדכון</span>
            </button>
            <button onClick={cancelEdit} className="edit-button cancel-button">
              <FontAwesomeIcon icon={faBan} className="profile-icon" />
              <span className="edit-text">ביטול</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerProfile;

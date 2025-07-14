import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faBan, faUser, faUserShield, faKey } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ModernProfile.css";
import ReauthModal from "../../components/Modals/ReauthModal";
import ImageUpload from "../../components/ImageUpload";
import { ROLES } from "../../constants/roles";
import { showAlert } from "../../utils/dialogs";

// Phone number formatting utility
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's an Israeli phone number (starts with 05 and has 10 digits)
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // For other formats, just return as is with dashes for readability
  if (cleaned.length >= 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  return cleaned;
};

const ManagerProfile = () => {
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "מנהל"
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
            phone: userData.phone || "",
            role: "מנהל" // Static role for Manager
          });
          
          setOriginalData({
            name: userData.name || "",
            email: user.email || "",
            phone: userData.phone || "",
            role: "מנהל"
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
    setCurrentPassword(passwordFromModal);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, formData.email);
      showAlert("נשלח אימייל לאיפוס סיסמה לכתובת המייל שלך");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      showAlert("שגיאה בשליחת אימייל לאיפוס סיסמה");
    }
  };

  const handleAvatarChange = (newAvatarUrl) => {
    setAvatarUrl(newAvatarUrl);
  };

  const handleAvatarDelete = () => {
    setAvatarUrl("");
  };

  const confirmEdit = async () => {
    const allFilled = formData.name.trim() !== "" && formData.email.trim() !== "";
    if (!allFilled) {
      showAlert("אנא מלא את כל השדות החובה");
      return;
    }

    const user = auth.currentUser;

    if (user) {
      try {
        // Update Firestore with the new data
        const updateData = {
          name: formData.name,
          phone: formData.phone || "",
          avatarUrl: avatarUrl || ""
        };

        await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
        
        // Update originalData to reflect the changes
        setOriginalData({ ...formData });
        
        showAlert("העדכון בוצע בהצלחה!");
        setIsEditing(false);
      } catch (error) {
        console.error("Firestore update failed:", error.message);
        showAlert("נכשל בעדכון הפרופיל.");
      }
    } else {
      showAlert("לא ניתן לזהות את המשתמש. אנא התחבר מחדש.");
    }
  };

  const renderFormGroup = (label, key, type = "text", readOnly = false) => {
    return (
      <div className={`modern-form-group ${readOnly ? 'readonly' : ''}`} key={key}>
        <label className="form-label">{label}</label>
        <input
          id={key}
          type={type}
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          required={key === 'name' || key === 'email'}
          disabled={readOnly}
          readOnly={readOnly}
          className={`form-input ${readOnly ? 'readonly-input' : ''}`}
        />
      </div>
    );
  };

  return (
    <div className="modern-profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-circle">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="avatar-image" />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="avatar-placeholder" />
                )}
              </div>
            </div>
          </div>
          
          <div className="profile-header-info">
            <h1 className="profile-name">{formData.name || 'Manager'}</h1>
            <p className="profile-role">
              <FontAwesomeIcon icon={faUserShield} className="role-icon" />
              {formData.role}
            </p>
            <p className="profile-email">{formData.email}</p>
          </div>
          
          {!isEditing && (
            <div className="profile-header-actions">
              <button 
                onClick={() => setShowReauthModal(true)} 
                className="modern-edit-btn"
              >
                <FontAwesomeIcon icon={faUserPen} />
                <span>ערוך פרופיל</span>
              </button>
              <button 
                onClick={handlePasswordReset} 
                className="modern-edit-btn password-reset-btn"
              >
                <FontAwesomeIcon icon={faKey} />
                <span>איפוס סיסמה</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-details-card">
            <div className="card-header">
              <h2>פרטי חשבון</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">שם מלא</div>
                <div className="detail-value">{formData.name || 'לא הוגדר'}</div>
              </div>
              
              <div className="detail-item">
                <div className="detail-label">מספר טלפון</div>
                <div className="detail-value">{formatPhoneNumber(formData.phone) || 'לא הוגדר'}</div>
              </div>
              
              <div className="detail-item">
                <div className="detail-label">כתובת אימייל</div>
                <div className="detail-value">{formData.email}</div>
              </div>
              
              <div className="detail-item">
                <div className="detail-label">תפקיד במערכת</div>
                <div className="detail-value">
                  <span className="role-badge manager-role">{formData.role}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="edit-form-card">
            <div className="card-header">
              <h2>עריכת פרטי חשבון</h2>
            </div>
            
            <div className="edit-form">
              <div className="edit-form-grid">
                {/* Left Column - Profile Picture Upload Section */}
                <div className="form-column profile-picture-column">
                  <div className="profile-picture-upload">
                      <ImageUpload
                        currentImageUrl={avatarUrl}
                        onImageChange={handleAvatarChange}
                        onImageDelete={handleAvatarDelete}
                        productId={user?.uid} // Use user UID as identifier
                        mode="edit"
                        uploadPath="users/avatars" // Specify the upload path for user avatars
                      />
                  </div>
                </div>
                
                {/* Right Column - Form Fields */}
                <div className="form-column form-fields-column">
                  {/* Personal Information Section */}
                  <div className="form-row">
                    {renderFormGroup("שם מלא", "name")}
                  </div>
                  
                  <div className="form-row">
                    {renderFormGroup("מספר טלפון", "phone", "tel")}
                  </div>
                  
                  {/* System Information Section */}
                  <div className="form-row">
                    {renderFormGroup("כתובת אימייל", "email", "email", true)}
                  </div>
                  
                  <div className="form-row">
                    {renderFormGroup("תפקיד במערכת", "role", "text", true)}
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button onClick={confirmEdit} className="profile-action-btn save-btn">
                  <FontAwesomeIcon icon={faUserPen} />
                  <span>שמור שינויים</span>
                </button>
                <button onClick={cancelEdit} className="profile-action-btn cancel-btn">
                  <FontAwesomeIcon icon={faBan} />
                  <span>בטל</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReauthModal && (
        <ReauthModal
          email={originalData.email}
          onSuccess={(password) => handleEdit(password)}
          onClose={() => setShowReauthModal(false)}
        />
      )}
    </div>
  );
};

export default ManagerProfile;

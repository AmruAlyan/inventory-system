import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../../firebase/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faBan, faUser, faUsers, faPlus, faTrash, faEdit, faUserTie, faUserShield, faCamera, faUserSlash, faUserCheck, faKey } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ModernProfile.css";
import "../../styles/imageUpload.css";
import ReauthModal from "../../components/Modals/ReauthModal";
import ImageUpload from "../../components/ImageUpload";
import { ROLES } from "../../constants/roles";
import { showAlert, showConfirm } from "../../utils/dialogs";
import { toast } from 'react-toastify';

const labelMap = {
  name: "שם",
  email: "דוא\"ל",
  phone: "טלפון",
  role: "תפקיד"
};

const AdminProfile = () => {
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'users'
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.MANAGER,
    tempPassword: ''
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "מנכ\"ל"
  });
  const [originalData, setOriginalData] = useState(formData);
  const [avatarUrl, setAvatarUrl] = useState("");

  const user = auth.currentUser;

  // Handle avatar image change
  const handleAvatarChange = (imageUrl) => {
    setAvatarUrl(imageUrl);
  };

  // Handle avatar image delete
  const handleAvatarDelete = async () => {
    if (!user?.uid) {
      setAvatarUrl("");
      return;
    }
    try {
      // Delete all files in the user's avatar folder in Firebase Storage
      const folderRef = storage.ref().child(`users/avatars/${user.uid}`);
      const listResult = await folderRef.listAll();
      const deletePromises = listResult.items.map((itemRef) => itemRef.delete());
      await Promise.all(deletePromises);
      setAvatarUrl("");
    } catch (error) {
      console.error("Failed to delete avatar from storage:", error);
      setAvatarUrl("");
    }
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's an Israeli phone number format
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      // Format as 05X-XXX-XXXX
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
      // Format as 05X-XXX-XXXX (add leading 0)
      return `0${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length >= 10) {
      // Generic format for longer numbers
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if doesn't match expected format
    return phoneNumber;
  };

  // Validate phone number format
  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return { isValid: true, message: '' }; // Empty is allowed
    }
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it has exactly 10 digits and starts with 05
    if (cleaned.length !== 10) {
      return { isValid: false, message: 'מספר הטלפון חייב להכיל בדיוק 10 ספרות' };
    }
    
    if (!cleaned.startsWith('05')) {
      return { isValid: false, message: 'מספר הטלפון חייב להתחיל ב-05' };
    }
    
    // Check if the third digit is valid (Israeli mobile numbers)
    const validThirdDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (!validThirdDigits.includes(cleaned[2])) {
      return { isValid: false, message: 'מספר הטלפון אינו תקין' };
    }
    
    return { isValid: true, message: '' };
  };

  // Handle phone number input with real-time formatting
  const handlePhoneInput = (value, setState, fieldName) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    // Format as user types
    let formatted = limited;
    if (limited.length >= 3) {
      formatted = `${limited.slice(0, 3)}${limited.length > 3 ? '-' : ''}${limited.slice(3)}`;
    }
    if (limited.length >= 6) {
      formatted = `${limited.slice(0, 3)}-${limited.slice(3, 6)}${limited.length > 6 ? '-' : ''}${limited.slice(6)}`;
    }
    
    setState(prev => ({ ...prev, [fieldName]: formatted }));
  };

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
            role: "מנכ\"ל" // Static role for Admin
          });
          
          setOriginalData({
            name: userData.name || "",
            email: user.email || "",
            phone: userData.phone || "",
            role: "מנכ\"ל"
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

  // Helper function to get role priority for sorting
  const getRolePriority = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 1;
      case ROLES.MANAGER:
        return 2;
      case ROLES.BLOCKED:
        return 3;
      default:
        return 4; // For any unknown roles
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user?.uid) // Exclude current admin user
        .sort((a, b) => {
          // Sort by role priority (admins first, then managers, then blocked)
          const priorityA = getRolePriority(a.role);
          const priorityB = getRolePriority(b.role);
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same role, sort by name alphabetically
          return (a.name || '').localeCompare(b.name || '');
        });
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('שגיאה בטעינת המשתמשים');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load users when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab]); // Removed fetchAllUsers from dependencies to prevent infinite loop

  // Add new user (with temporary password)
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.tempPassword) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }

    if (newUser.tempPassword.length < 6) {
      toast.error('הסיסמה הזמנית חייבת להכיל לפחות 6 תווים');
      return;
    }

    // Validate phone number if provided
    if (newUser.phone) {
      const phoneValidation = validatePhoneNumber(newUser.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.message);
        return;
      }
    }

    try {
      // Store current admin auth state
      const currentUser = auth.currentUser;
      
      // Create user account with temporary password
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.tempPassword);
      const createdUser = userCredential.user;
      
      // Store user info in Firestore while the new user is authenticated
      await setDoc(doc(db, 'users', createdUser.uid), {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        role: newUser.role,
        createdAt: new Date(),
        createdBy: currentUser.uid
      });

      // Sign out the created user
      await signOut(auth);

      toast.success(`משתמש נוצר בהצלחה עם סיסמה זמנית: ${newUser.tempPassword}`);
      toast.info(`הודע למשתמש להתחבר עם הסיסמה הזמנית`);
      
      setShowAddUser(false);
      setNewUser({ name: '', email: '', phone: '', role: ROLES.MANAGER, tempPassword: '' });
      
      // Note: Admin will need to re-authenticate
      window.location.reload(); // Simple solution - reload to restore admin session
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        toast.error('כתובת דוא"ל כבר בשימוש');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('כתובת דוא"ל לא תקינה');
      } else if (error.code === 'auth/weak-password') {
        toast.error('הסיסמה חלשה מדי');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('יותר מדי בקשות. נסה שוב מאוחר יותר.');
      } else {
        toast.error('שגיאה ביצירת המשתמש: ' + error.message);
      }
    }
  };

  // Show temp password for user
  const handleShowTempPassword = async (userEmail, userName) => {
    const confirmed = await showConfirm(
      `האם אתה בטוח שברצונך להציג את הסיסמה הזמנית של "${userName}"?`,
      'הצגת סיסמה זמנית'
    );

    if (confirmed) {
      // For now, we'll show a message since we no longer store temp passwords
      toast.info('הסיסמה הזמנית לא נשמרת במערכת מסיבות אבטחה');
      toast.info('צור סיסמה חדשה או בקש מהמשתמש לאפס את הסיסמה', { autoClose: false });
    }
  };

  // Block/Unblock user
  const handleBlockUser = async (userId, userName, isCurrentlyBlocked = false) => {
    const action = isCurrentlyBlocked ? 'לבטל את החסימה של' : 'לחסום את';
    const confirmed = await showConfirm(
      `האם אתה בטוח שברצונך ${action} המשתמש "${userName}"?`,
      isCurrentlyBlocked ? 'ביטול חסימה' : 'חסימת משתמש'
    );

    if (confirmed) {
      try {
        await setDoc(doc(db, 'users', userId), {
          role: isCurrentlyBlocked ? ROLES.MANAGER : 'blocked', // Restore to MANAGER or block
          updatedAt: new Date(),
          updatedBy: user.uid
        }, { merge: true });

        toast.success(isCurrentlyBlocked ? 'החסימה בוטלה בהצלחה' : 'המשתמש נחסם בהצלחה');
        fetchAllUsers();
      } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        toast.error('שגיאה בעדכון סטטוס המשתמש');
      }
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    if (user.role === ROLES.BLOCKED) {
      toast.error('לא ניתן לערוך משתמש חסום');
      return;
    }
    setEditingUser({ ...user });
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser.name) {
      toast.error('אנא מלא את כל השדות הנדרשים');
      return;
    }

    // Validate phone number if provided
    if (editingUser.phone) {
      const phoneValidation = validatePhoneNumber(editingUser.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.message);
        return;
      }
    }

    try {
      // Update user data in Firestore (NO PASSWORD - Firebase Auth handles passwords)
      await setDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role,
        updatedAt: new Date(),
        updatedBy: user.uid
        // ❌ REMOVED: password storage - Passwords managed by Firebase Auth only
        // ❌ REMOVED: email update - Email managed by Firebase Auth only
      }, { merge: true });

      toast.success('פרטי המשתמש עודכנו בהצלחה');
      setEditingUser(null);
      fetchAllUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('שגיאה בעדכון המשתמש');
    }
  };

  // Handle password reset for current admin user
  const handlePasswordReset = async () => {
    const confirmed = await showConfirm(
      'האם אתה בטוח שברצונך לשלוח קישור לאיפוס סיסמה לכתובת האימייל שלך?',
      'איפוס סיסמה'
    );

    if (confirmed) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast.success('נשלח קישור לאיפוס סיסמה לכתובת האימייל שלך');
        toast.info('אנא בדוק את תיבת הדואר שלך (כולל תיקיית הספאם)', { autoClose: 8000 });
      } catch (error) {
        console.error('Password reset error:', error);
        
        // Handle specific error cases
        if (error.code === 'auth/user-not-found') {
          toast.error('כתובת אימייל לא נמצאה במערכת');
        } else if (error.code === 'auth/invalid-email') {
          toast.error('כתובת אימייל לא תקינה');
        } else if (error.code === 'auth/too-many-requests') {
          toast.error('יותר מדי בקשות. אנא נסה שוב מאוחר יותר');
        } else {
          toast.error('שגיאה בשליחת קישור לאיפוס סיסמה. אנא נסה שוב');
        }
      }
    }
  };

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

    // Validate phone number if provided
    if (formData.phone) {
      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        showAlert(phoneValidation.message);
        return;
      }
    }
  
    // Reference to the current authenticated user
    const user = auth.currentUser;
  
    if (user) {
      // Now update the Firestore document with the new user data
      try {
        // Create an update object
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          updatedAt: new Date(),
        };

        // Include avatar URL if it exists, or remove it if it was deleted
        if (avatarUrl) {
          updateData.avatarUrl = avatarUrl;
        } else {
          // If avatar was removed, explicitly set it to null to remove from Firestore
          updateData.avatarUrl = null;
        }

        // Update Firestore with the new data (excluding email)
        await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
        toast.success("העדכון בוצע בהצלחה!");
        
        // Update local state to reflect changes
        setOriginalData({
          name: formData.name,
          email: formData.email, // Keep original email
          phone: formData.phone,
          role: formData.role
        });
        
      } catch (error) {
        console.error("Firestore update failed:", error.message);
        await showAlert("נכשל בעדכון בפרופיל.", "שגיאה");
      }
  
      setIsEditing(false); // Close the edit mode
    } else {
      showAlert("לא ניתן לזהות את המשתמש. אנא התחבר מחדש.");
    }
  };

  const getUserInfo = () => {
    // Filter out any fields we don't want to show
    return Object.keys(formData)
      .filter(key => key !== "phone" || !isEditing) // Only show phone during edit
      .map((key, index) => {
        // Special handling for phone field
        let value = formData[key];
        
        // For fields that shouldn't be editable
        const isReadOnly = key === "role";
        
        let icon = null;
        switch(key) {
          case "role":
            icon = <FontAwesomeIcon icon={faUser} className="details-icon" />;
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
    return (
      <div className={`modern-form-group ${readOnly ? 'readonly' : ''}`} key={key}>
        <label className="form-label">{label}</label>
        <input
          id={key}
          type={type}
          value={formData[key]}
          onChange={(e) => {
            if (key === 'phone') {
              handlePhoneInput(e.target.value, setFormData, key);
            } else {
              setFormData({ ...formData, [key]: e.target.value });
            }
          }}
          required
          disabled={readOnly}
          readOnly={readOnly}
          className={`form-input ${readOnly ? 'readonly-input' : ''}`}
          placeholder={key === 'phone' ? '050-000-0000' : ''}
          maxLength={key === 'phone' ? 12 : undefined} // 050-000-0000 = 12 characters
        />
        {/* {readOnly && (
          <div className="readonly-indicator">
            <FontAwesomeIcon icon={faUser} />
            <span>שדה לקריאה בלבד</span>
          </div>
        )} */}
      </div>
    );
  };

  return (
    <div className="modern-profile-container">
      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FontAwesomeIcon icon={faUser} />
          <span>הפרופיל שלי</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>ניהול משתמשים</span>
        </button>
      </div>

      {activeTab === 'profile' ? (
        <>
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
                <h1 className="profile-name">{formData.name || 'Administrator'}</h1>
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
                      <span className="role-badge admin-role">{formData.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="edit-form-card">
                <div className="card-header">
                  <h2>עריכת פרטי חשבון</h2>
                  {/* <div className="card-header-line"></div> */}
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
        </>
      ) : (
        /* Users Management Section */
        <div className="users-management">
          <div className="users-header">
            <h2>ניהול משתמשים</h2>
            <button 
              className="add-user-btn"
              onClick={() => setShowAddUser(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>הוסף משתמש</span>
            </button>
          </div>

          {/* Invite User Form */}
          {showAddUser && (
            <div className="add-user-card">
              <div className="card-header">
                <h3>הוספת משתמש חדש</h3>
                {/* <div className="card-header-line"></div> */}
              </div>
              <div className="add-user-form">
                <div className="invitation-notice">
                  <p>📧 צור סיסמה זמנית למשתמש שיוכל לשנות אותה בהתחברות הראשונה</p>
                </div>
                {/* Hidden inputs to prevent autofill */}
                <input type="text" style={{display: 'none'}} />
                <input type="password" style={{display: 'none'}} />
                <div className="form-grid">
                  <div className="modern-form-group">
                    <label className="form-label">תפקיד</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="form-input"
                      style={{ direction: 'rtl', textAlign: 'right' }}
                    >
                      <option value={ROLES.MANAGER}>מנהל מלאי</option>
                      <option value={ROLES.ADMIN}>מנכ"ל</option>
                    </select>
                  </div>

                  <div className="modern-form-group">
                    <label className="form-label">שם מלא</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="form-input"
                      placeholder="שם המשתמש"
                      autoComplete="off"
                      name="new-user-name-field"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="form-label">כתובת אימייל</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="form-input"
                      placeholder="example@email.com"
                      style={{ direction: 'ltr'}}
                      autoComplete="off"
                      autoFill="off"
                      data-lpignore="true"
                      spellCheck="false"
                      name="new-user-email-field"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="form-label">סיסמה זמנית</label>
                    <input
                      type="password"
                      value={newUser.tempPassword}
                      onChange={(e) => setNewUser({ ...newUser, tempPassword: e.target.value })}
                      className="form-input"
                      placeholder="לפחות 6 תווים"
                      minLength="6"
                      autoComplete="new-password"
                      autoFill="off"
                      data-lpignore="true"
                      spellCheck="false"
                      name="new-user-temp-password"
                    />
                  </div>

                  <div className="modern-form-group">
                    <label className="form-label">מספר טלפון</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => handlePhoneInput(e.target.value, setNewUser, 'phone')}
                      className="form-input"
                      placeholder="050-000-0000"
                      maxLength="12"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button onClick={handleAddUser} className="profile-action-btn save-btn">
                    <FontAwesomeIcon icon={faPlus} />
                    <span>הוסף משתמש</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowAddUser(false);
                      setNewUser({ name: '', email: '', phone: '', role: ROLES.MANAGER, tempPassword: '' });
                    }} 
                    className="profile-action-btn cancel-btn"
                  >
                    <FontAwesomeIcon icon={faBan} />
                    <span>בטל</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="users-list">
            {isLoadingUsers ? (
              <div className="loading-users">טוען משתמשים...</div>
            ) : allUsers.length === 0 ? (
              <div className="no-users">אין משתמשים נוספים במערכת</div>
            ) : (
              <div className="users-grid">
                {allUsers.map(user => (
                  <div key={user.id} className="user-card">
                    {editingUser?.id === user.id ? (
                      <div className="edit-user-form">
                        <div className="user-avatar">
                          {user.avatarUrl ? (
                            <div className="user-profile-image-container">
                              <img 
                                src={user.avatarUrl} 
                                alt={`${user.name} profile`} 
                                className="user-profile-image"
                              />
                              <div className="user-role-overlay">
                                <FontAwesomeIcon 
                                  icon={user.role === ROLES.ADMIN ? faUserShield : user.role === ROLES.BLOCKED ? faUserSlash : faUserTie} 
                                  className={`user-role-icon ${user.role === ROLES.BLOCKED ? 'blocked' : ''}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <FontAwesomeIcon 
                              icon={user.role === ROLES.ADMIN ? faUserShield : user.role === ROLES.BLOCKED ? faUserSlash : faUserTie} 
                              className={`user-avatar-icon ${user.role === ROLES.BLOCKED ? 'blocked' : ''}`}
                            />
                          )}
                        </div>
                        <div className="edit-fields">
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="edit-input"
                            placeholder="שם"
                          />
                          <input
                            type="email"
                            value={editingUser.email}
                            className="edit-input readonly-input"
                            placeholder="אימייל"
                            readOnly
                            disabled
                          />
                          <input
                            type="tel"
                            value={editingUser.phone || ''}
                            onChange={(e) => handlePhoneInput(e.target.value, setEditingUser, 'phone')}
                            className="edit-input"
                            placeholder="050-000-0000"
                            maxLength="12"
                          />
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="edit-input"
                          >
                            <option value={ROLES.MANAGER}>מנהל מלאי</option>
                            <option value={ROLES.ADMIN}>מנכ"ל</option>
                          </select>
                        </div>
                        <div className="user-actions">
                          <button onClick={handleSaveUser} className="save-user-btn">
                            <FontAwesomeIcon icon={faUserPen} />
                          </button>
                          <button onClick={() => setEditingUser(null)} className="cancel-user-btn">
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="user-avatar">
                          {user.avatarUrl ? (
                            <div className="user-profile-image-container">
                              <img 
                                src={user.avatarUrl} 
                                alt={`${user.name} profile`} 
                                className="user-profile-image"
                              />
                              <div className="user-role-overlay">
                                <FontAwesomeIcon 
                                  icon={user.role === ROLES.ADMIN ? faUserShield : user.role === ROLES.BLOCKED ? faUserSlash : faUserTie} 
                                  className={`user-role-icon ${user.role === ROLES.BLOCKED ? 'blocked' : ''}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <FontAwesomeIcon 
                              icon={user.role === ROLES.ADMIN ? faUserShield : user.role === ROLES.BLOCKED ? faUserSlash : faUserTie} 
                              className={`user-avatar-icon ${user.role === ROLES.BLOCKED ? 'blocked' : ''}`}
                            />
                          )}
                        </div>
                        <div className="user-info">
                          <h3 className="user-name">{user.name}</h3>
                          <p className="user-email">{user.email}</p>
                          {user.phone && <p className="user-email">{formatPhoneNumber(user.phone)}</p>}
                          <div className="user-status-role">
                            <span className={`user-role-badge ${user.role === ROLES.ADMIN ? 'admin' : user.role === ROLES.BLOCKED ? 'blocked' : 'manager'}`}>
                              {user.role === ROLES.ADMIN ? 'מנכ"ל' : user.role === ROLES.BLOCKED ? 'חסום' : 'מנהל מלאי'}
                            </span>
                          </div>
                        </div>
                        <div className="user-actions">
                          <button onClick={() => handleEditUser(user)} className="edit-user-btn" disabled={user.role === ROLES.BLOCKED}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            onClick={() => handleBlockUser(user.id, user.name, user.role === ROLES.BLOCKED)} 
                            className={user.role === ROLES.BLOCKED ? "unblock-user-btn" : "block-user-btn"}
                            title={user.role === ROLES.BLOCKED ? "בטל חסימה" : "חסום משתמש"}
                          >
                            <FontAwesomeIcon icon={user.role === ROLES.BLOCKED ? faUserCheck : faUserSlash} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

export default AdminProfile;

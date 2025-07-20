import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Using firebase from firebase folder
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase/firebase"; // Firebase Firestore instance
import "../styles/login.css";
import image from "../assets/pics/login-2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faExclamationTriangle, faEye, faEyeSlash, faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from "react-router-dom";
import { ROLES } from "../constants/roles.js";
import Logo from "../assets/pics/Home1.png";
import Spinner from "../components/Spinner";

function Login() {
  // Input values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states - initialize as empty (no errors shown initially)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  
  // Loading state for authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetStatusMessage, setResetStatusMessage] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for blocked user message from navigation state
  useEffect(() => {
    if (location.state?.error) {
      setStatusMessage(location.state.error);
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Force light mode for login page
  useEffect(() => {
    // Store the current theme
    const originalTheme = document.documentElement.getAttribute('data-theme');
    
    // Set light mode for login page
    document.documentElement.setAttribute('data-theme', 'light');
    
    // Cleanup function to restore original theme when component unmounts
    return () => {
      if (originalTheme) {
        document.documentElement.setAttribute('data-theme', originalTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };
  }, []);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "דוא״ל נדרש";
    } else if (!emailRegex.test(email)) {
      return "פורמט דוא״ל לא תקין";
    }
    return "";
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password) {
      return "סיסמה נדרשת";
    } else if (password.length < 6) {
      return "הסיסמה חייבת להכיל לפחות 6 תווים";
    }
    return "";
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(resetEmail);
    setResetEmailError(emailValidation);
    
    if (emailValidation) {
      return;
    }
    
    setIsResettingPassword(true);
    setResetStatusMessage("");
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatusMessage("נשלח אימייל לאיפוס סיסמה. אנא בדוק את תיבת הדואר שלך.");
      setResetEmailError("");
      
      // Clear form after successful send
      setTimeout(() => {
        setResetEmail("");
        setResetStatusMessage("");
        setShowForgotPassword(false);
        setIsResettingPassword(false);
      }, 4000);
      
    } catch (error) {
      console.error("Password reset error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/user-not-found') {
        setResetEmailError("כתובת אימייל לא נמצאה במערכת");
      } else if (error.code === 'auth/invalid-email') {
        setResetEmailError("כתובת אימייל לא תקינה");
      } else if (error.code === 'auth/too-many-requests') {
        setResetStatusMessage("יותר מדי בקשות. אנא נסה שוב מאוחר יותר.");
      } else {
        setResetStatusMessage("שגיאה בשליחת אימייל לאיפוס סיסמה. אנא נסה שוב.");
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Form submission handler
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate all inputs before submission
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    // Update error states
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    
    // If there are validation errors, don't proceed
    if (emailValidation || passwordValidation) {
      // Clear fields with incorrect format
      if (emailValidation) setEmail("");
      if (passwordValidation) setPassword("");
      return;
    }
    
    // Clear status message and validation errors
    setStatusMessage("");
    setEmailError("");
    setPasswordError("");
    setIsAuthenticating(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user's role from Firestore
      const userRef = doc(db, "users", user.uid); // Assuming "users" collection
      let docSnap = await getDoc(userRef);
      
      // Check if user exists in Firestore with invited status
      if (!docSnap.exists()) {
        // Check if there's an invited user with this email
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const invitedUser = usersSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.email === user.email && data.status === 'invited';
        });
        
        if (invitedUser) {
          // Move invited user data to the actual user UID and activate account
          const invitedData = invitedUser.data();
          await setDoc(userRef, {
            ...invitedData,
            status: 'active',
            isActive: true,
            activatedAt: new Date(),
            firstLogin: new Date()
          });
          
          // Delete the invitation record
          await deleteDoc(doc(db, 'users', invitedUser.id));
          
          // Refresh the document snapshot
          docSnap = await getDoc(userRef);
        }
      }
      
      // Update the last login timestamp
      try {
        await setDoc(userRef, {
          lastLogin: new Date()
        }, { merge: true }); // Use merge to only update the lastLogin field
      } catch (e) {
        console.error("Error updating last login time:", e);
      }

      if (docSnap.exists()) {
        const userRole = docSnap.data().role; // Assuming role is stored in the 'role' field

        // Check if user is blocked
        if (userRole.toLowerCase() === ROLES.BLOCKED) {
          setStatusMessage("חשבונך נחסם. אנא פנה למנהל המערכת.");
          return;
        }

        // Navigate based on the role
        if (userRole.toLowerCase() === ROLES.ADMIN) {
          navigate("/admin-dashboard", { replace: true });
        } else if (userRole.toLowerCase() === ROLES.MANAGER) {
          navigate("/manager-dashboard", { replace: true });
        } else {
          console.error("Login error: User role is not admin or manager");
          setStatusMessage("דוא״ל או סיסמה שגויים. אנא נסה שוב."); // Unauthorized
        }
      } else {
        console.error("Login error: User document not found in Firestore");
        setStatusMessage("דוא״ל או סיסמה שגויים. אנא נסה שוב."); // User not found in Firestore
      }
    } catch (error) {
      setStatusMessage("דוא״ל או סיסמה שגויים. אנא נסה שוב."); // Incorrect username or password
      console.error("Login authentication error:", error.code, error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="container" data-theme="light">
      {/* Authentication Loading Overlay */}
      {isAuthenticating && (
        <div className="auth-loading-overlay">
          <Spinner text="מתחבר למערכת..." />
        </div>
      )}
      
      {/* Login Form */}
      <div className="second">
        {/* Left Panel - Branding */}
        <div className="left-panel">
          <div className="title-box">
            <div className="title-box-text">
              <h1>מערכת ניהול מלאי</h1>
              <h3>עמותת ותיקי מטה יהודה</h3>
            </div>
          </div>
          <div className="illustration">
            <img src={image} alt="מחסן" />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="right-panel">
          {/* Logo */}
          <div className="logo-container">
            <img src={Logo} alt="Logo" className="logo" />
          </div>
          
          <div className="top-panel">
            <div className="login-box">
              {!showForgotPassword ? (
                <>
                  <h2>כניסה למערכת</h2>
                  <form onSubmit={handleLogin} noValidate>
                    <div className="input-group">
                      <FontAwesomeIcon icon={faUser} className="icon" />
                      <input 
                        type="email" 
                        placeholder="דואר אלקטרוני" 
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          // Clear email error when user starts typing again
                          if (emailError) setEmailError("");
                        }}
                        className={emailError ? 'input-error' : ''}
                      />
                    </div>
                    {emailError && (
                      <div className="validation-error">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {emailError}
                      </div>
                    )}
                    <div className="input-group">
                      <FontAwesomeIcon icon={faKey} className="icon" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="סיסמה" 
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          // Clear password error when user starts typing again
                          if (passwordError) setPasswordError("");
                        }}
                        className={`password-input ${passwordError ? 'input-error' : ''}`}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    {passwordError && (
                      <div className="validation-error">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {passwordError}
                      </div>
                    )}
                    {statusMessage && (
                      <div className="status">
                        <span>{statusMessage}</span>
                      </div>
                    )}
                    <button className="submit-button" type="submit" disabled={isAuthenticating}>
                      {isAuthenticating ? "מתחבר..." : "כניסה"}
                    </button>
                  </form>
                  
                  {/* Forgot Password Link */}
                  <div className="forgot-password-link">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(email); // Pre-fill with current email if any
                        setStatusMessage("");
                        setEmailError("");
                        setPasswordError("");
                      }}
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>איפוס סיסמה</h2>
                  <p className="forgot-password-description">
                    הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
                  </p>
                  <form onSubmit={handleForgotPassword} noValidate>
                    <div className="input-group">
                      <FontAwesomeIcon icon={faEnvelope} className="icon" />
                      <input 
                        type="email" 
                        placeholder="דואר אלקטרוני" 
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          // Clear email error when user starts typing again
                          if (resetEmailError) setResetEmailError("");
                        }}
                        className={resetEmailError ? 'input-error' : ''}
                      />
                    </div>
                    {resetEmailError && (
                      <div className="validation-error">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {resetEmailError}
                      </div>
                    )}
                    {resetStatusMessage && (
                      <div className={`status ${resetStatusMessage.includes('נשלח') ? 'success' : resetStatusMessage ? 'error' : ''}`}>
                        <span>{resetStatusMessage}</span>
                      </div>
                    )}
                    <button className="submit-button" type="submit" disabled={isResettingPassword}>
                      {isResettingPassword ? (
                        <>שולח...</>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faEnvelope} /> שלח קישור לאיפוס
                        </>
                      )}
                    </button>
                  </form>
                  
                  {/* Back to Login Link */}
                  <div className="back-to-login-link">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmail("");
                        setResetEmailError("");
                        setResetStatusMessage("");
                      }}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} /> חזור לכניסה
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

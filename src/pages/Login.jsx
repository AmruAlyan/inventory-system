import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase"; // Using firebase from firebase folder
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase/firebase"; // Firebase Firestore instance
import "../styles/login.css";
import image from "../assets/pics/login-2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import ThemeSwitch from "../components/LayoutComponents/ThemeSwitch";
import { ROLES } from "../constants/roles.js";

function Login() {
  // Input values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Validation states - initialize as empty (no errors shown initially)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  
  const navigate = useNavigate();

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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user's role from Firestore
      const userRef = doc(db, "users", user.uid); // Assuming "users" collection
      const docSnap = await getDoc(userRef);
      
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

        // Navigate based on the role
        if (userRole.toLowerCase() === ROLES.ADMIN) {
          navigate("/admin-dashboard", { replace: true });
        } else if (userRole.toLowerCase() === ROLES.MANAGER) {
          navigate("/manager-dashboard", { replace: true });
        } else {
          console.error("Login error: User role is not admin or manager");
          setStatusMessage("שם משתמש או סיסמה שגויים. אנא נסה שוב."); // Unauthorized
        }
      } else {
        console.error("Login error: User document not found in Firestore");
        setStatusMessage("שם משתמש או סיסמה שגויים. אנא נסה שוב."); // User not found in Firestore
      }
    } catch (error) {
      setStatusMessage("שם משתמש או סיסמה שגויים. אנא נסה שוב."); // Incorrect username or password
      console.error("Login authentication error:", error.code, error.message);
    }
  };

  return (
    <div className="container">
      {/* Login Form */}
      <div className="right-panel">
        <div className="top-panel">
          <div className="login-box">
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
                  type="password" 
                  placeholder="סיסמה" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear password error when user starts typing again
                    if (passwordError) setPasswordError("");
                  }}
                  className={passwordError ? 'input-error' : ''}
                />
              </div>
              {passwordError && (
                <div className="validation-error">
                  <FontAwesomeIcon icon={faExclamationTriangle} /> {passwordError}
                </div>
              )}
              <div className="status">
                <span>{statusMessage}</span>
              </div>
              <button className="submit-button" type="submit">כניסה</button>
            </form>
          </div>
        </div>
        <div className="bottom-panel">
          <ThemeSwitch />
        </div>
      </div>

      {/* Title & Image */}
      <div className="left-panel">
        <div className="title-box">
          <h1>מערכת ניהול מלאי</h1>
          <h2>ותיקי מטה יהודה</h2>
        </div>
        <div className="illustration">
          <img src={image} alt="מחסן" />
        </div>
      </div>
    </div>
  );
}

export default Login;

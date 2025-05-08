// import React from "react";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../firebase"; // adjust path as necessary
// import "../styles/login.css";
// import image from "../assets/pics/login-2.png";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';
// import { useNavigate } from "react-router-dom";
// import ThemeSwitch from "../components/ThemeSwitch";


// function Login(){
 
//     const navigate = useNavigate();

//     const handleLogin = async (e) => {
//       e.preventDefault();
//       const email = e.target[0].value;
//       const password = e.target[1].value;
//       const status = document.querySelector(".status");
    
//       try {
//         const userCredential = await signInWithEmailAndPassword(auth, email, password);
//         const user = userCredential.user;
    
//         // Navigate based on user's email or role logic
//         if (user.email === "admin123@gmail.com") {
//           navigate("/admin", {replace: true});
//         } else if (user.email === "manager123@gmail.com") {
//           navigate("/manager", {replace: true});
//         } else {
//           status.innerHTML = "לא מורשה להיכנס למערכת זו";
//         }
//       } catch (error) {
//         status.innerHTML = "שם משתמש או סיסמה שגויים";
//         console.error("Login error:", error.message);
//       }
//     };
    


//     return (
//       <div className="container">
//         {/* Login Form */}
//         <div className="right-panel">
//           <div className="top-panel">
//             <div className="login-box">
//               <h2>כניסה למערכת</h2>
//               <form onSubmit={handleLogin}>
//                 <div className="input-group">
//                   <FontAwesomeIcon icon={faUser} className="icon" />
//                   <input type="email" placeholder="דואר אלקטרוני" required />
//                 </div>
//                 <div className="input-group">
//                   <FontAwesomeIcon icon={faKey} className="icon" />
//                   <input type="password" placeholder="סיסמה" required />
//                 </div>
//                 <div className="status"><span></span></div>
//                 <button className="submit-button" type="submit">כניסה</button>
//               </form>
//             </div>
//           </div>
//           <div className="bottom-panel">
//             <ThemeSwitch />
//           </div>
//         </div>

//         {/* Title & Image */}
//         <div className="left-panel">
//           <div className="title-box">
//             <h1>מערכת ניהול מלאי</h1>
//             <h2>ותיקי מטה יהודה</h2>
//           </div>
//           <div className="illustration">
//             <img src={image} alt="מחסן" />
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   export default Login;


import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // adjust path as necessary
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "../firebase"; // Firebase Firestore instance
import "../styles/login.css";
import image from "../assets/pics/login-2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import ThemeSwitch from "../components/ThemeSwitch";

function Login() {
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user's role from Firestore
      const userRef = doc(db, "users", user.uid); // Assuming "users" collection
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userRole = docSnap.data().role; // Assuming role is stored in the 'role' field

        // Navigate based on the role
        if (userRole === "ADMIN") {
          navigate("/admin-dashboard", { replace: true });
        } else if (userRole === "MANAGER") {
          navigate("/manager-dashboard", { replace: true });
        } else {
          setStatusMessage("לא מורשה להיכנס למערכת זו"); // Unauthorized
        }
      } else {
        setStatusMessage("משתמש לא נמצא"); // User not found in Firestore
      }
    } catch (error) {
      setStatusMessage("שם משתמש או סיסמה שגויים"); // Incorrect username or password
      console.error("Login error:", error.message);
    }
  };

  return (
    <div className="container">
      {/* Login Form */}
      <div className="right-panel">
        <div className="top-panel">
          <div className="login-box">
            <h2>כניסה למערכת</h2>
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <FontAwesomeIcon icon={faUser} className="icon" />
                <input type="email" placeholder="דואר אלקטרוני" required />
              </div>
              <div className="input-group">
                <FontAwesomeIcon icon={faKey} className="icon" />
                <input type="password" placeholder="סיסמה" required />
              </div>
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

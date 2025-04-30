import React from "react";
// import { useState, useEffect } from "react";
import "../styles/login.css";
import image from "../assets/pics/login-2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import ThemeSwitch from "../components/ThemeSwitch";


function Login(){
 
    const navigate = useNavigate();
    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target[0].value;
        const password = e.target[1].value;
        if (username === "admin" && password === "admin") {
            navigate("/admin");
        }
        else if (username === "manager" && password === "manager") {
          navigate("/manager");
        }
        else {
            const status = document.querySelector(".status");
            status.innerHTML = "שם משתמש או סיסמה שגויים";
        }
    }


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
                  <input type="text" placeholder="שם משתמש" required />
                </div>
                <div className="input-group">
                  <FontAwesomeIcon icon={faKey} className="icon" />
                  <input type="password" placeholder="סיסמה" required />
                </div>
                <div className="status"><span></span></div>
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
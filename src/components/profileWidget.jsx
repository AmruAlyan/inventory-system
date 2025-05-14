import React, { useEffect, useRef } from "react";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth"; // ← Add this line
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faXmark, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import "../styles/profileWidget.css";

const ProfileWidget = ({ isProfileOpen, toggleProfile, nav2profile, username, toggleButtonRef }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideWidget = widgetRef.current && !widgetRef.current.contains(event.target);
      const clickedOutsideToggleButton = toggleButtonRef?.current && !toggleButtonRef.current.contains(event.target);

      if (isProfileOpen && clickedOutsideWidget && clickedOutsideToggleButton) {
        toggleProfile(); // close the widget
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, toggleProfile, toggleButtonRef]);

  const navigate = useNavigate();
  const handleLogout = async () => {
      try {
        await signOut(auth);
        // localStorage.clear();
        // sessionStorage.clear();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    };

  return (
    <div ref={widgetRef} className={`profile-widget ${isProfileOpen ? 'open' : ''}`}>
      <div className='profile-hi-x'>
        <span>היי, {username}!</span>
        {/* <button onClick={toggleProfile} className="close-button">
          <FontAwesomeIcon icon={faXmark} className="icon" />
        </button> */}
      </div>
      {/* <NavLink to={"/profile"} className='profile-button'> */}
        <button className='profile-button' onClick={nav2profile}>
          <FontAwesomeIcon icon={faEye} className="widget-icon" />
          <span className="profile-text">הצג פרופיל</span>
        </button>
      {/* </NavLink> */}
      {/* <NavLink to={"/login"}> */}
        <button className='profile-button' onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} className="widget-icon" />
          <span className="profile-text">התנתק</span>
        </button>
      {/* </NavLink> */}
    </div>
  );
};

export default ProfileWidget;


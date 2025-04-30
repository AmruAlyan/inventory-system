import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faXmark, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import "../styles/profileWidget.css";

const ProfileWidget = ({ isProfileOpen, toggleProfile, nav2profile, handleLogout, username, toggleButtonRef }) => {
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

  return (
    <div ref={widgetRef} className={`profile-widget ${isProfileOpen ? 'open' : ''}`}>
      <div className='profile-hi-x'>
        <span>היי, {username}!</span>
        {/* <button onClick={toggleProfile} className="close-button">
          <FontAwesomeIcon icon={faXmark} className="icon" />
        </button> */}
      </div>

      <button onClick={nav2profile} className='profile-button'>
        <FontAwesomeIcon icon={faEye} className="widget-icon" />
        <span className="profile-text">הצג פרופיל</span>
      </button>
      <button className='profile-button' onClick={handleLogout}>
        <FontAwesomeIcon icon={faRightFromBracket} className="widget-icon" />
        <span className="profile-text">התנתק</span>
      </button>
    </div>
  );
};

export default ProfileWidget;


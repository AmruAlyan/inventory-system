import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faBars, 
  faWarehouse,
  faCartShopping,
  faCashRegister,
  faFileLines,
  faXmark,
  faEye,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import '../styles/dashboard.css';
import { useNavigate } from 'react-router-dom';

function Manager() {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleSidebar = () => {
    if (isProfileOpen) setIsProfileOpen(false);
    setIsExpanded(prev => !prev);
  };

  const toggleProfile = () => {
    if (isExpanded) setIsExpanded(false);
    setIsProfileOpen(prev => !prev);
  };

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div className="title-container">
            <button onClick={toggleSidebar} className="menu-button">
                <FontAwesomeIcon icon={faBars} className="icon" />
            </button>
            <h1 className="dashboard-title">מנהל מלאי</h1>
        </div>
        <button onClick={toggleProfile} className="user-button">
          <FontAwesomeIcon icon={faUser} className="icon" />
        </button>
      </header>

      <main className="dashboard-main">

        <div className={`profile-widget ${isProfileOpen ? 'open' : ''}`}>
          <div className='profile-hi-x'>
            <span>היי, עבדאלרחמן!</span>
            <button onClick={toggleProfile} className="close-button">
              <FontAwesomeIcon icon={faXmark} className="icon" />
            </button>
          </div>
          
          <button className='profile-button'>
            <FontAwesomeIcon icon={faEye} className="icon" />
            <span className="profile-text">הצג פרופיל</span>
          </button>
          <button className='profile-button' onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="icon" />
            <span className="profile-text">התנתק</span>
          </button>
        </div>


        <div className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
          <button className="sidebar-button">
            <FontAwesomeIcon icon={faWarehouse} className="icon" />
            <span className="sidebar-text">מוצרים</span>
          </button>
          <button className="sidebar-button">
            <FontAwesomeIcon icon={faCartShopping} className="icon" />
            <span className="sidebar-text">רשימת קניות</span>
          </button>
          <button className="sidebar-button">
            <FontAwesomeIcon icon={faCashRegister} className="icon" />
            <span className="sidebar-text">קנייה חדשה</span>
          </button>
          <button className="sidebar-button">
            <FontAwesomeIcon icon={faFileLines} className="icon" />
            <span className="sidebar-text">הצג הוצאה תקציבית</span>
          </button>
        </div>

        <div className="content-area">
          <h1>שלום מנהל מלאי</h1>
          <p>ברוך הבא למערכת ניהול המלאי.</p>
          <p>כאן תוכל לנהל את המוצרים שלך בקלות וביעילות.</p>
        </div>
      </main>
    </div>
  );
}

export default Manager;
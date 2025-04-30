import React, { useRef } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import Header from '../components/Header';
import ProfileWidget from '../components/profileWidget';
import Sidebar from '../components/Sidebar';
import { 
  faWarehouse,
  faCartShopping,
  faCashRegister,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';
import useIsMobile from '../hooks/useIsMobile';

const role = "מנהל מלאי";
const name = "עבדאלרחמן";
const sidebarIcons = [
  { icon: faWarehouse, text: 'מוצרים' },
  { icon: faCartShopping, text: 'רשימת קניות' },
  { icon: faCashRegister, text: 'קנייה חדשה' },
  { icon: faFileLines, text: 'הצג הוצאה תקציבית' },
];



function Manager() {

  const isMobile = useIsMobile();
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

    if (isMobile && isExpanded) setIsExpanded(false);
    setIsProfileOpen(prev => !prev);
  };

  const toggleButtonRef = useRef();
  const sidebarRef = useRef();

  return (
    <div className="dashboard">

      <Header
        toggleSidebar={toggleSidebar} 
        toggleProfile={toggleProfile} 
        title={role} 
        ref={toggleButtonRef}
        sidebarRef={sidebarRef}
      />

      <main className="dashboard-main">

        <ProfileWidget
          isProfileOpen={isProfileOpen} 
          toggleProfile={toggleProfile} 
          nav2profile={() => navigate("/profile")}
          handleLogout={handleLogout} 
          username={name}
          toggleButtonRef={toggleButtonRef}
        />

        <Sidebar
          isExpanded={isExpanded} 
          items={sidebarIcons}
          toggleSidebar={toggleSidebar}
          toggleSidebarRef={sidebarRef}
        />

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
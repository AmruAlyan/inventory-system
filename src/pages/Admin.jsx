import React from 'react';
import { useState, useRef } from 'react';
import '../styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProfileWidget from '../components/profileWidget';
import Sidebar from '../components/Sidebar';
import { faShekel, faFileLines } from '@fortawesome/free-solid-svg-icons';
import useIsMobile from '../hooks/useIsMobile';

const sidebarIcons = [
  { icon: faShekel, text: 'תקציב' },
  { icon: faFileLines, text: 'צפה בדוחות הוצאות' },
];



function Admin() {
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
        title={"ברוך הבא"} 
        ref={toggleButtonRef}
        sidebarRef={sidebarRef}
      />

      <main className="dashboard-main">

        <ProfileWidget
          isProfileOpen={isProfileOpen} 
          toggleProfile={toggleProfile} 
          nav2profile={() => navigate("/profile")}
          handleLogout={handleLogout} 
          username={"אדמן"}
          toggleButtonRef={toggleButtonRef} // Pass the ref to ProfileWidget
        />

        <Sidebar
          isExpanded={isExpanded} 
          items={sidebarIcons}
          toggleSidebar={toggleSidebar}
          toggleSidebarRef={sidebarRef}
        />

        <div className="content-area"><h1>שלום!</h1></div>
      </main>
    </div>
  );
}

export default Admin;
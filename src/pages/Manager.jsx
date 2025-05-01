import React, { useRef } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import Header from '../components/Header';
import ProfileWidget from '../components/profileWidget';
import Sidebar from '../components/Sidebar';
import ContentArea from '../components/ContentArea';
import Profile from './Profile';
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
  { icon: faWarehouse, text: 'מוצרים', id: 'products' },
  { icon: faCartShopping, text: 'רשימת קניות', id: 'shopping-list' },
  { icon: faCashRegister, text: 'קנייה חדשה', id: 'new-purchase' },
  { icon: faFileLines, text: 'הצג הוצאה תקציבית', id: 'budget-expense' }
];



function Manager() {
  const [currentPage, setCurrentPage] = useState();
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

  const nav2profile = () => {
    setCurrentPage('profile');
    setIsProfileOpen(false);
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
          nav2profile={nav2profile}
          handleLogout={handleLogout} 
          username={name}
          toggleButtonRef={toggleButtonRef}
          
        />

        <Sidebar
          isExpanded={isExpanded} 
          items={sidebarIcons}
          toggleSidebar={toggleSidebar}
          toggleSidebarRef={sidebarRef}
          // onSelect={setCurrentPage}
        />

        <ContentArea>
          {currentPage === 'profile' && <Profile />}
        </ContentArea>
      </main>
    </div>
  );
}

export default Manager;
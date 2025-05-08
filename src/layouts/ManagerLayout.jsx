import React, { useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ProfileWidget from '../components/ProfileWidget';
import useIsMobile from '../hooks/useIsMobile';

import {
  faHouse,
  faBoxOpen,
  faTableCellsLarge,
  faCartShopping,
  faCashRegister,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';

const role = "מנהל מלאי";
const name = "עבדאלרחמן";

const sidebarIcons = [
  { icon: faHouse, text: 'לוח ראשי', id: 'dashboard', path: "/manager-dashboard" },
  { icon: faBoxOpen, text: 'מוצרים', id: 'products', path: "/manager-dashboard/products" },
  { icon: faTableCellsLarge, text: 'קטיגוריות', id: 'categories', path: "/manager-dashboard/categories" },
  { icon: faCartShopping, text: 'רשימת קניות', id: 'shopping-list', path: "/manager-dashboard/shopping-list" },
  { icon: faCashRegister, text: 'קנייה חדשה', id: 'new-purchase', path: "/manager-dashboard/new-purchase" },
  { icon: faFileLines, text: 'הצג הוצאה תקציבית', id: 'budget-expense', path: "/manager-dashboard/budget-expense" }
];

const ManagerLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const toggleButtonRef = useRef();
  const sidebarRef = useRef();

  const toggleSidebar = () => {
    if (isProfileOpen) setIsProfileOpen(false);
    setIsExpanded(prev => !prev);
  };

  const toggleProfile = () => {
    if (isMobile && isExpanded) setIsExpanded(false);
    setIsProfileOpen(prev => !prev);
  };

  const handleProfile = () => {
    navigate("/manager-dashboard/profile");
  };

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
          nav2profile={handleProfile}
          username={name}
          toggleButtonRef={toggleButtonRef}
        />

        <Sidebar
          isExpanded={isExpanded}
          items={sidebarIcons}
          toggleSidebar={toggleSidebar}
          toggleSidebarRef={sidebarRef}
        />

        <section className="content-area">
          <Outlet /> {/* This renders the nested route page */}
        </section>
      </main>
    </div>
  );
};

export default ManagerLayout;

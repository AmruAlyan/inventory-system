import React, { useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import ProfileWidget from '../components/ProfileWidget';
import Sidebar from '../components/Sidebar';
import useIsMobile from '../hooks/useIsMobile';

import {
  faHouse,
  faShekel,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';

import '../styles/dashboard.css'
import '../styles/contentArea.css'

const sidebarIcons = [
  { icon: faHouse, text: 'לוח ראשי', id: 'dashboard', path: "/admin-dashboard"},
  { icon: faShekel, text: 'תקציב', id: 'budget', path: "/admin-dashboard/budget" },
  { icon: faFileLines, text: 'צפה בדוחות הוצאות', id: 'reports', path: "/admin-dashboard/reports" }
];

const role = "אדמן";
const name = "עבדאלרחמן";

const AdminLayout = () => {
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
    navigate("/admin-dashboard/profile");
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
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;

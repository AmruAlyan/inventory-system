import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/LayoutComponents/Header';
import Sidebar from '../components/LayoutComponents/Sidebar';
import Footer from '../components/LayoutComponents/Footer';
import ProfileWidget from '../components/Widgets/ProfileWidget';
import useIsMobile from '../hooks/useIsMobile';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

import '../styles/layout.css';

import {
  faHouse,
  faBoxOpen,
  faTableCellsLarge,
  faCartShopping,
  faCashRegister,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';
import ContentArea from '../components/LayoutComponents/ContentArea';

const role = "מנהל מלאי";

const sidebarIcons = [
  { icon: faHouse, text: 'לוח ראשי', id: 'dashboard', path: "/manager-dashboard" },
  { icon: faTableCellsLarge, text: 'קטיגוריות', id: 'categories', path: "/manager-dashboard/categories" },
  { icon: faBoxOpen, text: 'מוצרים', id: 'products', path: "/manager-dashboard/products" },
  { icon: faCartShopping, text: 'רשימת קניות', id: 'shopping-list', path: "/manager-dashboard/shopping-list" },
  { icon: faCashRegister, text: 'קנייה חדשה', id: 'new-purchase', path: "/manager-dashboard/new-purchase" }
  // { icon: faFileLines, text: 'הצג הוצאה תקציבית', id: 'budget-expense', path: "/manager-dashboard/budget-expense" }
];

const ManagerLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [realName, setRealName] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const toggleButtonRef = useRef();
  const sidebarRef = useRef();

  // Fetch real user name from Firestore
  const fetchUserName = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRealName(docSnap.data().name || "");
        } else {
          setRealName(user.displayName || "");
        }
      } catch (err) {
        setRealName(user.displayName || "");
      }
    }
  }, []);

  useEffect(() => {
    fetchUserName();
  }, [fetchUserName]);

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
    setIsProfileOpen(false);
  };

  return (
    <div className="layout">
      <Header
        toggleSidebar={toggleSidebar}
        toggleProfile={toggleProfile}
        title={role}
        ref={toggleButtonRef}
        sidebarRef={sidebarRef}
      />

      <main className="layout-main">
        <ProfileWidget
          isProfileOpen={isProfileOpen}
          toggleProfile={toggleProfile}
          nav2profile={handleProfile}
          username={realName}
          toggleButtonRef={toggleButtonRef}
        />

        <Sidebar
          isExpanded={isExpanded}
          items={sidebarIcons}
          toggleSidebar={toggleSidebar}
          toggleSidebarRef={sidebarRef}
        />

        <ContentArea />
      </main>
      <Footer />
    </div>
  );
};

export default ManagerLayout;

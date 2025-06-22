import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

import Header from '../components/LayoutComponents/Header';
import Sidebar from '../components/LayoutComponents/Sidebar';
import ContentArea from '../components/LayoutComponents/ContentArea';
import Footer from '../components/LayoutComponents/Footer';
import ProfileWidget from '../components/Widgets/ProfileWidget';
import useIsMobile from '../hooks/useIsMobile';

import {
  faHouse,
  faShekel,
  faFileLines,
  faBoxesStacked,
  faTableCellsLarge,
  faCartShopping,
  faCartPlus,
  faPenToSquare
} from '@fortawesome/free-solid-svg-icons';

import '../styles/layout.css'

const sidebarIcons = [
  { icon: faHouse, text: 'לוח ראשי', id: 'dashboard', path: "/admin-dashboard", exact: true },
  { icon: faShekel, text: 'תקציב', id: 'budget', path: "/admin-dashboard/budget" },
  { icon: faFileLines, text: 'דוחות', id: 'reports', path: "/admin-dashboard/reports" },
  { icon: faTableCellsLarge, text: 'קטיגוריות', id: 'categories', path: "/admin-dashboard/categories" },
  { icon: faBoxesStacked, text: 'מוצרים', id: 'products', path: "/admin-dashboard/products" },
  { icon: faCartShopping, text: 'רשימת קניות', id: 'shopping-list', path: "/admin-dashboard/shopping-list" },
  { icon: faCartPlus, text: 'קנייה חדשה', id: 'new-purchase', path: "/admin-dashboard/new-purchase" },
  { icon: faPenToSquare, text: 'עדכון מלאי', id: 'consumed-items', path: "/admin-dashboard/consumed-items" }
];

const AdminLayout = () => {
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
    navigate("/admin-dashboard/profile");
    setIsProfileOpen(false);
  };

  return (
    <div className="layout">
      <Header
        toggleSidebar={toggleSidebar}
        toggleProfile={toggleProfile}
        title={"אדמן"}
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
          isAdmin={true}
        />

        <ContentArea />
        
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;

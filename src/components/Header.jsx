import React, { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faBoxesStacked } from "@fortawesome/free-solid-svg-icons";
import "../styles/header.css";
import ThemeSwitch from "./ThemeSwitch";

// forwardRef wraps the entire component
const Header = forwardRef(({ toggleSidebar, toggleProfile, title, sidebarRef }, ref) => {
    return (
        <header className="dashboard-header">
            <div className="logo-container">
                <button onClick={toggleSidebar} className="menu-button" ref={sidebarRef}>
                    <FontAwesomeIcon icon={faBars} className="header-icon" />
                </button>
                <div className="app-logo">
                    <FontAwesomeIcon icon={faBoxesStacked} className="logo-icon" />
                    <span className="logo-text">ניהול מלאי</span>
                </div>
            </div>
            
            <h1 className="dashboard-title">{title}</h1>
            
            <div className="header-actions">
                <ThemeSwitch />
                {/* This is the button receiving the forwarded ref */}
                <button onClick={toggleProfile} className="user-button" ref={ref}>
                    <FontAwesomeIcon icon={faUser} className="header-icon" />
                </button>
            </div>
        </header>
    );
});

export default Header;

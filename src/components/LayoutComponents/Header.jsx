import React, { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ForLayout/header.css";
import Logo from "./Logo";
// forwardRef wraps the entire component
const Header = forwardRef(({ toggleSidebar, toggleProfile, sidebarRef }, ref) => {
    return (
        <header className="layout-header">
            <div className="logo-container">
                <button onClick={toggleSidebar} className="menu-button" ref={sidebarRef}>
                    <FontAwesomeIcon icon={faBars} className="header-icon" />
                </button>
            </div>
            <Logo size={55} />
            <div className="header-actions">
                <button onClick={toggleProfile} className="user-button" ref={ref}>
                    <FontAwesomeIcon icon={faUser} className="header-icon" />
                </button>
            </div>
        </header>
    );
});

export default Header;

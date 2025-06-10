import React, { forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faBoxesStacked } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ForLayout/header.css";
// import ThemeSwitch from "./ThemeSwitch";
// import logo from "../../assets/pics/logo-1.svg";
import Logo from "./Logo";
// forwardRef wraps the entire component
const Header = forwardRef(({ toggleSidebar, toggleProfile, title, sidebarRef }, ref) => {
    return (
        <header className="layout-header">
            <div className="logo-container">
                <button onClick={toggleSidebar} className="menu-button" ref={sidebarRef}>
                    <FontAwesomeIcon icon={faBars} className="header-icon" />
                </button>
            </div>
            {/* <div className="app-logo"> */}
                <Logo color="#FFC107" size={60} />
            {/* </div> */}
            <div className="header-actions">
                <button onClick={toggleProfile} className="user-button" ref={ref}>
                    <FontAwesomeIcon icon={faUser} className="header-icon" />
                </button>
            </div>
        </header>
    );
});

export default Header;

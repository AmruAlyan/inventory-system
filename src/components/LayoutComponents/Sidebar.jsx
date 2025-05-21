import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../../styles/ForLayout/sidebar.css";
import useIsMobile from "../../hooks/useIsMobile";
import { NavLink } from "react-router-dom";
import ThemeSwitch from "./ThemeSwitch";

const Sidebar = ({ isExpanded, items, toggleSidebar, toggleSidebarRef }) => {
    const sidebarRef = useRef(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedOutsideSidebar =
                sidebarRef.current && !sidebarRef.current.contains(event.target);
            const clickedOutsideToggle =
                toggleSidebarRef?.current && !toggleSidebarRef.current.contains(event.target);

            if (isExpanded && clickedOutsideSidebar && clickedOutsideToggle && isMobile) {
                toggleSidebar(); // close the Sidebar
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExpanded, toggleSidebar, toggleSidebarRef]);    return (
        <div ref={sidebarRef} className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
            <div className="sidebar-content">
                {items.map((item, index) => (
                    <NavLink key={index} to={item.path} className="sidebar-button">
                        <button key={index}>
                            <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
                            <span className="sidebar-text">{item.text}</span>
                        </button>
                    </NavLink>
                ))}
            </div>
            <div className="sidebar-footer">
                <ThemeSwitch />
            </div>
        </div>
    );
};

export default Sidebar;

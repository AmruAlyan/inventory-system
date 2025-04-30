import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/sidebar.css";
import useIsMobile from "../hooks/useIsMobile";

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
    }, [isExpanded, toggleSidebar, toggleSidebarRef]);

    return (
        <div ref={sidebarRef} className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
            {items.map((item, index) => (
                <button key={index} className="sidebar-button">
                    <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
                    <span className="sidebar-text">{item.text}</span>
                </button>
            ))}
        </div>
    );
};

export default Sidebar;

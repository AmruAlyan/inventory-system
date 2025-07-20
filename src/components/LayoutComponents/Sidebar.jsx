import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../../styles/ForLayout/sidebar.css";
import useIsMobile from "../../hooks/useIsMobile";
import { NavLink } from "react-router-dom";
import ThemeSwitch from "./ThemeSwitch";

const Sidebar = ({
  isExpanded,
  items,
  toggleSidebar,
  toggleSidebarRef,
  isAdmin,
}) => {
  const sidebarRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideSidebar =
        sidebarRef.current && !sidebarRef.current.contains(event.target);
      const clickedOutsideToggle =
        toggleSidebarRef?.current &&
        !toggleSidebarRef.current.contains(event.target);

      if (
        isExpanded &&
        clickedOutsideSidebar &&
        clickedOutsideToggle &&
        isMobile
      ) {
        toggleSidebar(); // close the Sidebar
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, toggleSidebar, toggleSidebarRef, isMobile]);

  return (
    <div ref={sidebarRef} className={`sidebar ${isExpanded ? "expanded" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-buttons-container">
          {items.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-button${isActive ? " sidebar-button-active" : ""}`
              }
            >
              <button
                key={index}
                className={isExpanded ? "sidebar-button-inner" : undefined}
              >
                <div className="sidebar-icon-container">
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="sidebar-icon"
                    data-testid={
                      item.id === "shopping-list"
                        ? "shopping-cart-icon"
                        : undefined
                    }
                  />
                  {item.count && item.count > 0 && (
                    <span className="sidebar-badge">{item.count}</span>
                  )}
                </div>
                <span className="sidebar-text">{item.text}</span>
              </button>
            </NavLink>
          ))}
        </div>
        <div className="sidebar-buttons-container">
          <ThemeSwitch sidebarOpen={isExpanded} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

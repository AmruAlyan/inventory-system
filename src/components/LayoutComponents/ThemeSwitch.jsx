import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faCircleHalfStroke } from "@fortawesome/free-solid-svg-icons";
import "../../styles/ForLayout/themeSwitch.css";
import { useState, useEffect } from "react";

const ThemeSwitch = ({ sidebarOpen = true }) => {
  const [themeMode, setThemeMode] = useState(() => {
    // Check localStorage or default to auto
    return localStorage.getItem("themeMode") || "auto";
  });

  const [actualTheme, setActualTheme] = useState("light");

  // Function to get system preference
  const getSystemTheme = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Function to determine actual theme based on mode
  const determineActualTheme = (mode) => {
    switch (mode) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'auto':
        return getSystemTheme();
      default:
        return 'light';
    }
  };

  // Apply theme to document and update actual theme
  useEffect(() => {
    const newActualTheme = determineActualTheme(themeMode);
    setActualTheme(newActualTheme);
    document.documentElement.setAttribute("data-theme", newActualTheme);
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        setActualTheme(newSystemTheme);
        document.documentElement.setAttribute("data-theme", newSystemTheme);
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      switch (prev) {
        case 'light':
          return 'auto';
        case 'auto':
          return 'dark';
        case 'dark':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return faSun;
      case 'dark':
        return faMoon;
      case 'auto':
        return faCircleHalfStroke;
      default:
        return faSun;
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'בהיר';
      case 'dark':
        return 'כהה';
      case 'auto':
        return 'אוטומטי';
      default:
        return 'Light';
    }
  };

  return (
    <div className="sidebar-button" onClick={cycleTheme} title={`נוכחי: ${getThemeLabel()} (לחץ לשינוי)`}>
      <button className={sidebarOpen ? "sidebar-button-inner" : undefined}>
        <FontAwesomeIcon icon={getThemeIcon()} className="sidebar-icon theme-icon" />
        {sidebarOpen && (
          <span className="sidebar-text">{getThemeLabel()}</span>
        )}
      </button>
    </div>
  );
}
export default ThemeSwitch;
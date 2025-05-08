import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import "../styles/themeSwitch.css";
import { useState, useEffect } from "react";

const ThemeSwitch = () => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to light
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <>
        <input 
            type="checkbox" 
            className="checkbox" 
            id="checkbox" 
            checked={theme === 'dark'}
            onChange={toggleTheme}
        />
        <label htmlFor="checkbox" className="checkbox-label">
            <FontAwesomeIcon icon={faSun} className="theme-icon" id="sun" />
            <FontAwesomeIcon icon={faMoon} className="theme-icon" id="moon" />
            <span className="ball"></span>
        </label>
    </>
  );
}
export default ThemeSwitch;
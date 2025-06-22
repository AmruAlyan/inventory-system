import React, { useState, useEffect } from 'react';
// import { ReactComponent as LogoSvg } from '../../assets/pics/logo-1.svg';
import LogoLight from '../../assets/pics/Logo-light.svg';
import LogoDark from '../../assets/pics/Logo-dark.svg';
import LogoColored from '../../assets/pics/Logo-colored.png';
import '../../styles/ForLayout/header.css';

const Logo = ({ size = 40 }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem("themeMode") || "auto";
        if (savedTheme === "auto") {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return savedTheme;
    });    useEffect(() => {
        const handleThemeChange = () => {
            const savedTheme = localStorage.getItem("themeMode") || "auto";
            if (savedTheme === "auto") {
                const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                setCurrentTheme(systemTheme);
            } else {
                setCurrentTheme(savedTheme);
            }
        };

        // Listen for localStorage changes
        window.addEventListener('storage', handleThemeChange);
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleThemeChange);

        // Listen for data-theme attribute changes on document
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const currentDataTheme = document.documentElement.getAttribute('data-theme');
                    setCurrentTheme(currentDataTheme || 'light');
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            mediaQuery.removeEventListener('change', handleThemeChange);
            observer.disconnect();
        };
    }, []);

    const textStyle = {
        fontSize: size / 3, 
        fontWeight: 'bold',
        margin: 0
    };
    
    return (        
        <div className="logo-container">
            <p className="logo-text-white" style={textStyle}>עמותת ותיקי</p>
            <img 
                src={currentTheme === 'dark' ? LogoDark : LogoLight} 
                // src={LogoColored}
                alt="Logo" 
                style={{ width: size, height: 'auto' }}
            />
            <p className="logo-text-white" style={textStyle}>מטה יהודה</p>
        </div>
    );
};

export default Logo;

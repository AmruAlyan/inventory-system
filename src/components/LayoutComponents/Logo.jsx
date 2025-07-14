import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../../assets/pics/Home1.png';
import { ROLES } from '../../constants/roles';
import '../../styles/ForLayout/header.css';

const Logo = ({ size = 40 }) => {
    const navigate = useNavigate();
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem("themeMode") || "auto";
        if (savedTheme === "auto") {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return savedTheme;
    });

    useEffect(() => {
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

    // Handle logo click navigation
    const handleLogoClick = async () => {
        const user = auth.currentUser;
        if (!user) {
            // If no user is logged in, redirect to login
            navigate('/');
            return;
        }

        try {
            // Get user role from Firestore
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const userRole = docSnap.data().role;
                
                // Navigate based on role
                if (userRole === ROLES.ADMIN) {
                    navigate('/admin-dashboard');
                } else if (userRole === ROLES.MANAGER) {
                    navigate('/manager-dashboard');
                } else {
                    // Fallback to login if role is not recognized
                    navigate('/');
                }
            } else {
                // User document doesn't exist, redirect to login
                navigate('/');
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            // Fallback to login on error
            navigate('/');
        }
    };

    const textStyle = {
        fontSize: size / 3, 
        fontWeight: 'bold',
        margin: 0
    };
    
    return (        
        <div className="logo-container">
            {/* <p className="logo-text-white" style={textStyle}>עמותת ותיקי</p> */}
            <p className="logo-text-white" style={textStyle}>עמותת ותיקי מטה יהודה</p>
            <img 
                src={logo}
                alt="Logo" 
                className='app-logo-img clickable-logo'
                onClick={handleLogoClick}
                title="חזור לדף הבית"
                style={{ cursor: 'pointer' }}
            />
            {/* <p className="logo-text-white" style={textStyle}>מטה יהודה</p> */}
            <p className="logo-text-white" style={textStyle}>מערכת ניהול המלאי</p>
        </div>
    );
};

export default Logo;

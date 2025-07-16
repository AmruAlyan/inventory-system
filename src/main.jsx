import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './index.css'
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import setupLocatorUI from "@locator/runtime";
import { UI_CONFIG } from './constants/config';

// Setup LocatorJS for development
if (import.meta.env.DEV) {
  setupLocatorUI();
}

// Main App Component
function MainApp() {
  return (
    <>
      <App />
      <ToastContainer
        position="top-center"
        autoClose={UI_CONFIG.TOAST_AUTO_CLOSE_DELAY}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Slide}
        style={{ top: 70 }}
      />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainApp />
  </StrictMode>,
)

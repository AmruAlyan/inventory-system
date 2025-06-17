import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './index.css'
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { installDialogOverrides } from './utils/iosDialogs.jsx';

// Wrap the app with a component that installs dialog overrides
function AppWithDialogOverrides() {
  useEffect(() => {
    // Install iOS-style dialog overrides when the app mounts
    const restoreDialogs = installDialogOverrides();
    
    // Clean up by restoring original dialogs when component unmounts
    return () => restoreDialogs();
  }, []);
  
  return (
    <>
      <App />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Slide}
        style={{ top: 70 }} // below header
      />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithDialogOverrides />
  </StrictMode>,
)


// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import { ThemeProvider } from './themeContext';
// import './index.css';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>
// );

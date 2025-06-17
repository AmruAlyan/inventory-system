import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './index.css'
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Main App Component
function MainApp() {
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
    <MainApp />
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

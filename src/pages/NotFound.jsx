import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/pics/Home1.png";
import image from "../assets/pics/login-2.png";
import "../styles/notFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  // Force light mode for 404 page (same as login)
  useEffect(() => {
    // Store the current theme
    const originalTheme = document.documentElement.getAttribute("data-theme");

    // Set light mode for 404 page
    document.documentElement.setAttribute("data-theme", "light");

    // Cleanup function to restore original theme when component unmounts
    return () => {
      if (originalTheme) {
        document.documentElement.setAttribute("data-theme", originalTheme);
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    };
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="notfound-container" data-theme="light">
      <div className="notfound-second">
        {/* Right Panel - 404 Content */}
        <div className="notfound-right-panel">
          {/* Logo */}
          <div className="notfound-main-logo-container">
            <img src={Logo} alt="Logo" className="notfound-logo" />
          </div>
          <h2>דף לא נמצא</h2>
          {/* Error Display */}
          <div className="notfound-error-display">
            <div className="notfound-error-code">ERROR 404</div>
            <p className="notfound-error-message">הדף שאתה מחפש לא קיים במערכת</p>
          </div>

          {/* Action Buttons */}
          <div className="notfound-action-buttons">
            <button className="notfound-back-button" onClick={handleGoBack}>
              <FontAwesomeIcon icon={faArrowLeft} />
              חזור
            </button>
          </div>
        </div>
        {/* Left Panel - Same as login */}
        <div className="notfound-left-panel">
          <div className="notfound-title-box">
            <div className="notfound-title-box-text">
              <h1>מערכת ניהול מלאי</h1>
              <h3>עמותת ותיקי מטה יהודה</h3>
            </div>
          </div>
          <div className="notfound-illustration">
            <img src={image} alt="מחסן" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxOpen, 
  faHome, 
  faArrowLeft, 
  faExclamationTriangle, 
  faSearch, 
  faBarcode,
  faCubes,
  faWarehouse,
  faClipboardList,
  faRobot,
  faWifi,
  faBatteryHalf
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../styles/notFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [robotMessage, setRobotMessage] = useState("מחפש במלאי...");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState("מערכת פעילה");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate scanning animation
  const handleScanAttempt = () => {
    setIsScanning(true);
    setScanProgress(0);
    setRobotMessage("סורק מלאי...");
    
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setIsScanning(false);
          setRobotMessage("פריט לא נמצא במלאי!");
          setTimeout(() => {
            setRobotMessage("מחפש במלאי...");
            setScanProgress(0);
          }, 2000);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 150);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-container">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-dot red"></div>
          <div className="terminal-dot yellow"></div>
          <div className="terminal-dot green"></div>
        </div>
        <div className="terminal-title">מערכת ניהול מלאי - סטטוס: 404</div>
        <div className="terminal-time">
          {currentTime.toLocaleTimeString('he-IL')}
        </div>
      </div>

      <div className="not-found-content">
        {/* System Status Panel */}
        <div className="system-status">
          <div className="status-item">
            <FontAwesomeIcon icon={faWifi} className="status-icon online" />
            <span>חיבור לרשת</span>
          </div>
          <div className="status-item">
            <FontAwesomeIcon icon={faBatteryHalf} className="status-icon warning" />
            <span>מאגר נתונים</span>
          </div>
          <div className="status-item">
            <FontAwesomeIcon icon={faWarehouse} className="status-icon online" />
            <span>מערכת מלאי</span>
          </div>
        </div>

        {/* Interactive Warehouse Scene */}
        <div className="warehouse-scene">
          {/* Warehouse Robot */}
          <div className="warehouse-robot">
            <div className={`robot-body ${isScanning ? 'scanning' : ''}`}>
              <FontAwesomeIcon icon={faRobot} className="robot-icon" />
              <div className="robot-scanner"></div>
            </div>
            <div className="robot-speech">
              {robotMessage}
            </div>
          </div>

          {/* 404 Error Display */}
          <div className="error-display">
            <div className="error-screen">
              <div className="error-header">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <span>שגיאת מלאי</span>
              </div>
              <div className="error-code">404</div>
              <div className="error-message">
                <div className="barcode">
                  <FontAwesomeIcon icon={faBarcode} />
                  <span>████ █ ██ █ ████</span>
                </div>
                <p>פריט לא נמצא במלאי</p>
                <p className="error-details">
                  הדף המבוקש לא קיים במערכת
                  <br />
                  נסה לחפש מוצר אחר או חזור לעמוד הראשי
                </p>
              </div>
              
              {/* Scan Progress Bar */}
              <div className="scan-progress">
                <div className="progress-label">סטטוס סריקה:</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{Math.round(scanProgress)}%</div>
              </div>
            </div>
          </div>

          {/* Interactive Shelves */}
          <div className="warehouse-shelves">
            {[...Array(6)].map((_, index) => (
              <div key={index} className={`shelf-unit shelf-${index + 1}`}>
                <div className="shelf-label">מדף {index + 1}</div>
                <div className="shelf-slots">
                  {[...Array(3)].map((_, slotIndex) => (
                    <div key={slotIndex} className="shelf-slot empty">
                      <FontAwesomeIcon icon={faBoxOpen} />
                      <span>ריק</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          <div className="control-section">
            <h3>
              <FontAwesomeIcon icon={faClipboardList} />
              פעולות זמינות
            </h3>
            <div className="control-buttons">
              <button 
                className="control-btn scan-btn"
                onClick={handleScanAttempt}
                disabled={isScanning}
              >
                <FontAwesomeIcon icon={faSearch} />
                {isScanning ? 'סורק...' : 'סרוק שוב'}
              </button>
              <button 
                className="control-btn home-btn"
                onClick={handleGoHome}
              >
                <FontAwesomeIcon icon={faHome} />
                עמוד ראשי
              </button>
              <button 
                className="control-btn back-btn"
                onClick={handleGoBack}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                חזור
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>
              <FontAwesomeIcon icon={faCubes} />
              מידע מערכת
            </h3>
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">סטטוס:</span>
                <span className="info-value error">404 - לא נמצא</span>
              </div>
              <div className="info-item">
                <span className="info-label">זמן:</span>
                <span className="info-value">{currentTime.toLocaleString('he-IL')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">מיקום:</span>
                <span className="info-value">לא זוהה</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix-style Background */}
      <div className="matrix-background">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="matrix-column" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}>
            {['0', '1', '█', '▓', '░', '▒'].map((char, j) => (
              <span key={j} style={{ animationDelay: `${j * 0.1}s` }}>
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotFound;

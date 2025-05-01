import React from "react";
import "../styles/contentArea.css";


const ContentArea = ({ children }) => {
  return (
    <div className="content-area">
      {children}
    </div>
  );
}
export default ContentArea;
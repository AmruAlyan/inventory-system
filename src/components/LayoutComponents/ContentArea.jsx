import React from "react";
import { Outlet } from "react-router-dom";
import "../../styles/ForLayout/contentArea.css";


const ContentArea = ({ children }) => {
  return (
    // <div className="content-area">
    //   {children}
    // </div>
    <section className="content-area">
      <Outlet />
    </section>
  );
}
export default ContentArea;
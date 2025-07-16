import React from "react";
import { Outlet } from "react-router-dom";
import "../../styles/ForLayout/contentArea.css";


const ContentArea = () => {
  return (
    <section className="content-area">
      <Outlet />
    </section>
  );
}
export default ContentArea;
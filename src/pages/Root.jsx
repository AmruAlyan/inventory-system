import React from "react";
import { Link } from "react-router-dom";

const Root = () => {
  return (
    <div>
      <header>
        <h1>Welcome to the Admin & Manager Dashboard</h1>
        <nav>
          <ul>
            <li>
              <Link to="/login">Login</Link>
            </li>
            {/* You can add more links to public pages here if needed */}
          </ul>
        </nav>
      </header>
      <main>
        <p>
          This is a sample app where admins and managers have their own dashboards.
        </p>
        <p>
          Please login to access the respective dashboards.
        </p>
      </main>
      <footer>
        <p>&copy; 2025 Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Root;

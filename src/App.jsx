import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout"; // assuming AdminLayout is here
import ManagerLayout from "./layouts/ManagerLayout"; // if you have a similar one
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import BudgetPage from "./pages/Admin/Budget"; // adjust path
import ReportsPage from "./pages/Admin/Reports"; // adjust path
import ProductsPage from "./pages/Manager/Products"; // example
import AdminProfile from "./pages/Admin/AdminProfile";
import ManagerProfile from "./pages/Manager/ManagerProfile";
import { ROLES } from "./constants/roles";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireRole={[ROLES.ADMIN]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<h1>DASH</h1>} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute requireRole={[ROLES.MANAGER]}>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<h1>DASH</h1>} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<h1>category</h1>} />
          <Route path="shopping-list" element={<h1>shopping list</h1>} />
          <Route path="new-purchase" element={<h1>new purchase</h1>} />
          <Route path="budget-expense" element={<h1>budget expense</h1>} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

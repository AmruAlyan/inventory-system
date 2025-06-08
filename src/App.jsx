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
import ShoppingList from "./pages/Manager/ShoppingList";
import { ROLES } from "./constants/roles";
import Categories from "./pages/Manager/Categories";
import Purchases from "./pages/Manager/Purchases";
import ManagerDash from "./pages/Manager/ManagerDash";
import ConsumedItems from "./pages/Manager/ConsumedItems";
import AdminDash from "./pages/Admin/AdminDash"; // assuming you have this

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
          <Route index element={<AdminDash />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="reports" element={<ReportsPage />} />

          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<Categories />} />
          <Route path="shopping-list" element={<ShoppingList />} />
          <Route path="new-purchase" element={<Purchases />} />
          <Route path="consumed-items" element={<ConsumedItems />} />
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
          <Route index element={<ManagerDash />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<Categories />} />
          <Route path="shopping-list" element={<ShoppingList />} />
          <Route path="new-purchase" element={<Purchases />} />
          <Route path="consumed-items" element={<ConsumedItems />} />
          {/* <Route path="budget-expense" element={<BudgetExpenses />} /> */}
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

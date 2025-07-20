import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import BudgetPage from "./pages/Admin/Budget";
import ReportsPage from "./pages/Admin/Reports";
import ProductsPage from "./pages/Manager/Products";
import AdminProfile from "./pages/Admin/AdminProfile";
import ManagerProfile from "./pages/Manager/ManagerProfile";
import ShoppingList from "./pages/Manager/ShoppingList";
import { ROLES } from "./constants/roles";
import Categories from "./pages/Manager/Categories";
import Purchases from "./pages/Manager/Purchases";
import ManagerDash from "./pages/Manager/ManagerDash";
import ConsumedItems from "./pages/Manager/ConsumedItems";
import AdminDash from "./pages/Admin/AdminDash";
import NotFound from "./pages/NotFound";
import { DataProvider } from './context/DataContext';

function App() {
  return (
    <DataProvider>
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
            <Route path="profile" element={<ManagerProfile />} />
          </Route>
          
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;

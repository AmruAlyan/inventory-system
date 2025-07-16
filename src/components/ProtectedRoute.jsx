import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { ROLES } from "../constants/roles.js";

const db = getFirestore();

const ProtectedRoute = ({ children, requireRole = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const userRole = userData?.role?.toLowerCase(); // <- normalize to lowercase

      // Check if user is blocked
      if (userRole === ROLES.BLOCKED) {
        // Sign out blocked user and redirect to login
        await auth.signOut();
        navigate("/login", { 
          replace: true,
          state: { error: "חשבונך נחסם. אנא פנה למנהל המערכת." }
        });
        return;
      }

      // Check if user has required role
      const hasRequiredRole = requireRole.length === 0 || requireRole.includes(userRole);

      if (!hasRequiredRole) {
        // Redirect based on their actual role
        if (userRole === ROLES.ADMIN) {
          navigate("/admin-dashboard", { replace: true });
        } else if (userRole === ROLES.MANAGER) {
          navigate("/manager-dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } else {
        setIsAuthorized(true);
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate, requireRole]);

  if (isAuthorized === null) return null; // loading spinner or blank
  return children;
};

export default ProtectedRoute;

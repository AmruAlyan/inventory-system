// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "../firebase";

// function ProtectedRoute({ children }) {
//   const navigate = useNavigate();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         navigate("/", { replace: true });
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   return children;
// }
// export default ProtectedRoute;

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const db = getFirestore();

const ProtectedRoute = ({ children }) => {
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
      const role = userData?.role?.toLowerCase(); // <- normalize to lowercase

      const path = location.pathname;

      if (path.startsWith("/admin") && role !== "admin") {
        navigate("/manager", { replace: true });
      } else if (path.startsWith("/manager") && role !== "manager") {
        navigate("/admin", { replace: true });
      } else {
        setIsAuthorized(true);
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  if (isAuthorized === null) return null; // loading spinner or blank
  return children;
};

export default ProtectedRoute;

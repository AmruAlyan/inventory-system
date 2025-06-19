import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Real-time listener for products
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        // Optionally handle error
      }
    );
    // One-time fetch for categories (or use onSnapshot if you want real-time)
    getDocs(collection(db, 'categories')).then(querySnapshot => {
      const categoriesMap = {};
      querySnapshot.docs.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name;
      });
      setCategories(categoriesMap);
    });
    return () => {
      unsubscribeProducts();
    };
  }, []);

  return (
    <DataContext.Provider value={{ products, setProducts, categories, loading }}>
      {children}
    </DataContext.Provider>
  );
};

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const usePurchasesCount = () => {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'purchases', 'current'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const itemsCount = data.items ? data.items.length : 0;
          setCount(itemsCount > 0 ? itemsCount : null);
        } else {
          setCount(null);
        }
      },
      (error) => {
        console.error('Error fetching purchases count:', error);
        setCount(null);
      }
    );

    return () => unsubscribe();
  }, []);

  return count;
};

export default usePurchasesCount;

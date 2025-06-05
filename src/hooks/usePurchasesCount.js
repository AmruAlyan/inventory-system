import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const usePurchasesCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'purchases', 'current'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const itemsCount = data.items ? data.items.length : 0;
          setCount(itemsCount);
        } else {
          setCount(0);
        }
      },
      (error) => {
        console.error('Error fetching purchases count:', error);
        setCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  return count;
};

export default usePurchasesCount;

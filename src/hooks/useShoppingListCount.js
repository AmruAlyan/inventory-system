import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const useShoppingListCount = () => {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(doc(db, 'sharedShoppingList', 'globalList'), 'items'),
      (snapshot) => {
        // Count only non-purchased items
        const unpurchasedCount = snapshot.docs.filter(doc => {
          const data = doc.data();
          return !data.purchased;
        }).length;
        setCount(unpurchasedCount > 0 ? unpurchasedCount : null);
      },
      (error) => {
        console.error('Error fetching shopping list count:', error);
        setCount(null);
      }
    );

    return () => unsubscribe();
  }, []);

  return count;
};

export default useShoppingListCount;

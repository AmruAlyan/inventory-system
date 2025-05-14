import React, { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

import '../styles/addProductWidget.css'; // Reuse same styling

function generateIdFromName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '_')      // replace spaces with underscores
    .replace(/[^\w_]+/g, '');     // remove non-word characters
}

async function addCategory(categoryName) {
  const categoryId = generateIdFromName(categoryName);
  const categoriesRef = collection(db, 'categories');
  const categoryDoc = doc(categoriesRef, categoryId);

  await setDoc(categoryDoc, {
    name: categoryName
  });

  return categoryId;
}

export default function AddCategoryWidget() {
  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setStatus('יש להזין שם קטגוריה.');
      return;
    }

    try {
      await addCategory(categoryName);
      setStatus('קטגוריה נוספה בהצלחה!');
      setCategoryName('');
    } catch (err) {
      console.error(err);
      setStatus('נכשל בהוספת הקטגוריה.');
    }
  };

  return (
    <div className='addProduct-widget'>
      <h2>הוספת קטגוריה חדשה</h2>
      <form onSubmit={handleSubmit} className='addProduct-form'>
        <div className='addProduct-form-group'>
          <label>שם קטגוריה:</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>
        <button type="submit" className='addNewProduct-button'>הוסף קטגוריה</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';

import '../styles/categoryWidget.css';

function generateIdFromName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '_')
    .replace(/[^\w_]+/g, '');
}

async function addCategory(categoryName, description) {
  const categoryId = generateIdFromName(categoryName);
  const categoriesRef = collection(db, 'categories');
  const categoryDoc = doc(categoriesRef, categoryId);

  await setDoc(categoryDoc, {
    name: categoryName,
    description: description || ''
  });

  return categoryId;
}

async function updateCategory(categoryId, categoryName, description) {
  const categoryDoc = doc(db, 'categories', categoryId);
  await updateDoc(categoryDoc, {
    name: categoryName,
    description: description || ''
  });
}

export default function CategoryWidget({
  onCategoryAdded,
  editingCategory,
  onUpdate,
  onCancel
}) {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  // Fill fields if editing
  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name || '');
      setDescription(editingCategory.description || '');
    } else {
      setCategoryName('');
      setDescription('');
    }
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setStatus('יש להזין שם קטגוריה.');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName, description);
        setStatus('הקטגוריה עודכנה בהצלחה!');
        if (onUpdate) onUpdate();
      } else {
        await addCategory(categoryName, description);
        setStatus('קטגוריה נוספה בהצלחה!');
        setCategoryName('');
        setDescription('');
        if (onCategoryAdded) onCategoryAdded();
      }
    } catch (err) {
      console.error(err);
      setStatus('שגיאה: לא ניתן לשמור את הקטגוריה.');
    }
  };

  return (
    <div className='category-widget'>
      <h2>{editingCategory ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}</h2>
      <form onSubmit={handleSubmit} className='category-form'>
        <div className='category-form-group'>
          <label>שם קטגוריה:</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>
        <div className='category-form-group'>
          <label>תיאור:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {editingCategory ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className='category-button-update'>עדכן</button>
            <button type="button" className='category-button-cancel' onClick={onCancel}>ביטול</button>
          </div>
        ) : (
          <button type="submit" className='category-button-add'>הוסף קטגוריה</button>
        )}
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
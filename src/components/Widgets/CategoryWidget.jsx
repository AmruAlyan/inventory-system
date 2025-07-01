import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, doc, addDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

import '../../styles/ForWidgets/categoryWidget.css';

function generateIdFromName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '_')
    .replace(/[^\w_]+/g, '');
}

async function addCategory(categoryName) {
  const categoriesRef = collection(db, 'categories');

  const docRef = await addDoc(categoriesRef, {
    name: categoryName
  });

  return docRef.id;
}

async function updateCategory(categoryId, categoryName) {
  const categoryDoc = doc(db, 'categories', categoryId);
  await updateDoc(categoryDoc, {
    name: categoryName
  });
}

export default function CategoryWidget({
  onCategoryAdded,
  editingCategory,
  onUpdate,
  onCancel,
  categoriesList = [] // <-- Add this prop
}) {
  const [categoryName, setCategoryName] = useState('');

  // Fill fields if editing
  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name || '');
    } else {
      setCategoryName('');
    }
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error('יש להזין שם קטגוריה.');
      return;
    }

    // Prevent duplicate category name
    const filteredList = editingCategory
      ? categoriesList.filter(cat => cat.id !== editingCategory.id)
      : categoriesList;
    if (filteredList.some(cat => cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase())) {
      toast.error('שם הקטגוריה כבר קיים.');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName);
        toast.success('הקטגוריה עודכנה בהצלחה!');
        if (onUpdate) onUpdate();
      } else {
        await addCategory(categoryName);
        toast.success('קטגוריה נוספה בהצלחה!');
        setCategoryName('');
        if (onCategoryAdded) onCategoryAdded();
      }
    } catch (err) {
      console.error(err);
      toast.error('שגיאה: לא ניתן לשמור את הקטגוריה.');
    }
  };

  return (
    <div className='category-widget'>
      <form onSubmit={handleSubmit} className='category-form'>
        <div className='category-form-group'>
          <label>שם קטגוריה:</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
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
    </div>
  );
}
import React, { useState } from 'react';
// AddProductPage.jsx
import { db } from '../firebase/firebase'; // Using firebase from firebase folder
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

import '../styles/addProductWidget.css'

export async function addProduct(productData) {
  try {
    const productsCollectionRef = collection(db, 'products');
    const docRef = await addDoc(productsCollectionRef, productData);
    console.log("Product successfully added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding product: ", e);
    throw e;
  }
}

export async function updateProduct(productId, productData) {
  try {
    const productDocRef = doc(db, 'products', productId);
    await updateDoc(productDocRef, productData);
    console.log('Product successfully updated:', productId);
  } catch (e) {
    console.error('Error updating product:', e);
    throw e;
  }
}

export default function AddProductWidget({ onClose, product = null, onSave, mode = 'add' }) {
  const [form, setForm] = useState({
    name: product ? product.name : '',
    category: product ? product.category : '',
    quantity: product ? product.quantity : '',
    price: product ? product.price : '',
  });

  const [status, setStatus] = useState('');

  const categories = [
    'פירות וירקות',
    'מוצרי חלב',
    'בשר ודגים',
    'מאפים ולחמים',
    'משקאות',
    'מוצרי ניקיון',
    'חטיפים ומתוקים',
    'מזון יבש',
    'קפואים',
    'מוצרי נייר'
  ];
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.quantity || !form.category) {
      setStatus('Please fill out all fields.');
      toast.error('שגיאה: נא למלא את כל השדות הדרושים');
      return;
    }

    const productData = {
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
    };

    try {
      if (mode === 'edit' && product && product.id) {
        await updateProduct(product.id, productData);
        setStatus('Product updated successfully!');
        toast.success('המוצר עודכן בהצלחה');
        if (onSave) onSave();
      } else {
        await addProduct(productData);
        setStatus('Product added successfully!');
        toast.success('המוצר נוסף בהצלחה');
        setForm({ name: '', category: '', quantity: '', price: '' });
        if (onSave) onSave();
      }
    } catch (error) {
      setStatus(mode === 'edit' ? 'Failed to update product.' : 'Failed to add product.');
      toast.error(mode === 'edit' ? 'שגיאה: עדכון המוצר נכשל' : 'שגיאה: הוספת המוצר נכשלה');
    }
  };

  return (
    <div className='addProduct-widget'>
      <h2>{mode === 'edit' ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</h2>
      <form onSubmit={handleSubmit} className='addProduct-form'>
        <div className='addProduct-form-group'>
          <label>שם מוצר:</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} />
        </div>
        <div className='addProduct-form-group'>
          <label>קטיגוריה:</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">.....בחר קטיגוריה.....</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className='addProduct-form-group'>
          <label>קמות:</label>
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} />
        </div>
        <div className='addProduct-form-group'>
          <label>מחיר:</label>
          <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} />
        </div>
        <div className='addProduct-button-group'>
          <button type="submit" className='addNewProduct-button'>{mode === 'edit' ? 'עדכן מוצר' : 'הוסף מוצר'}</button>
          <button type="button" onClick={onClose} className='addNewProduct-button'>ביטול</button>
        </div>

      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
import React, { useState } from 'react';
// AddProductPage.jsx
import { db } from '../firebase'; // ✅ Adjust the path if needed
import { collection, addDoc } from 'firebase/firestore';

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

export default function AddProductWidget({onClose}) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
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
      return;
    }

    const productData = {
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
    };

    try {
      await addProduct(productData);
      setStatus('Product added successfully!');
      setForm({ name: '', category: '', quantity: '', price: '' });
    } catch (error) {
      setStatus('Failed to add product.');
    }
  };

  return (
    <div className='addProduct-widget'>
      <h2>הוספת מוצר חדש</h2>
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
          <button type="submit" className='addNewProduct-button'>הוסף מוצר</button>
          <button type="button" onClick={onClose} className='addNewProduct-button'>ביטול</button>
        </div>

      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
// AddProductPage.jsx
import { db } from '../../firebase/firebase'; // Using firebase from firebase folder
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Modal from './Modal';
import '../../styles/ForModals/productModal.css'

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

export default function ProductModal({ onClose, product = null, onSave, mode = 'add', existingProductNames = [] }) {
  const [form, setForm] = useState({
    name: product ? product.name : '',
    category: product ? product.category : '',
    quantity: product ? product.quantity : '',
    price: product ? product.price : '',
  });
  const [status, setStatus] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('שגיאה: לא ניתן לטעון קטגוריות');
      }
    };

    fetchCategories();
  }, []);
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

    // Duplicate name check (case-insensitive, trimmed)
    const isDuplicate = existingProductNames.some(
      (name) => name.trim().toLowerCase() === form.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setStatus('Product name already exists.');
      toast.error('שגיאה: שם המוצר כבר קיים');
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
    <Modal onClose={onClose}>
      <div className='Product-modal'>
        <h2>{mode === 'edit' ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</h2>
        <form onSubmit={handleSubmit} className='Product-form'>
          <div className='Product-form-group'>
            <label>שם מוצר:</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className='Product-form-group'>
            <label>קטיגוריה:</label>          <select name="category" value={form.category} onChange={handleChange}>
              <option value="">.....בחר קטיגוריה.....</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className='Product-form-group'>
            <label>כמות:</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange} />
          </div>
          <div className='Product-form-group'>
            <label>מחיר:</label>
            <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} />
          </div>
          <div className='Product-button-group'>
            <button type="submit" className='NewProduct-button'>{mode === 'edit' ? 'עדכן מוצר' : 'הוסף מוצר'}</button>
            <button type="button" onClick={onClose} className='NewProduct-button'>ביטול</button>
          </div>

        </form>
        {/* {status && <p>{status}</p>} */}
      </div>
    </Modal>
  );
}
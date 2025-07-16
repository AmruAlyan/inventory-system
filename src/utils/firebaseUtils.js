/**
 * Firebase operations utility
 * Centralized Firebase operations with error handling and caching
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS } from '../constants/config';
import { logError } from './errorHandler';

/**
 * Generic function to get a document from any collection
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null if not found
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    logError(`Error fetching document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Generic function to get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} options - Query options (orderBy, where, etc.)
 * @returns {Promise<Array>} Array of documents
 */
export const getCollection = async (collectionName, options = {}) => {
  try {
    let collectionRef = collection(db, collectionName);
    
    // Apply query options
    if (options.orderBy) {
      const [field, direction = 'asc'] = Array.isArray(options.orderBy) 
        ? options.orderBy 
        : [options.orderBy];
      collectionRef = query(collectionRef, orderBy(field, direction));
    }
    
    if (options.where) {
      const [field, operator, value] = options.where;
      collectionRef = query(collectionRef, where(field, operator, value));
    }
    
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logError(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<string>} Document ID of the created document
 */
export const createDocument = async (collectionName, data) => {
  try {
    // Clean data to remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, collectionName), cleanedData);
    return docRef.id;
  } catch (error) {
    logError(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update an existing document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    // Clean data to remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, cleanedData);
  } catch (error) {
    logError(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    logError(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Set a document (create or overwrite)
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error) {
    logError(`Error setting document ${docId} in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get current budget
 * @returns {Promise<Object>} Budget data
 */
export const getCurrentBudget = async () => {
  return getDocument(COLLECTIONS.BUDGETS, 'current');
};

/**
 * Get budget history
 * @returns {Promise<Array>} Budget history entries
 */
export const getBudgetHistory = async () => {
  return getCollection(`${COLLECTIONS.BUDGETS}/history/entries`, {
    orderBy: ['date', 'desc']
  });
};

/**
 * Get products with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Products array
 */
export const getProducts = async (filters = {}) => {
  return getCollection(COLLECTIONS.PRODUCTS, filters);
};

/**
 * Get categories
 * @returns {Promise<Array>} Categories array
 */
export const getCategories = async () => {
  return getCollection(COLLECTIONS.CATEGORIES);
};

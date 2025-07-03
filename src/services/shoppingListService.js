/**
 * Optimized Shopping List Service
 * Implements caching and batched queries to reduce Firebase calls
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch, 
  query,
  where,
  documentId,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import cacheManager, { CACHE_CONFIG } from '../utils/cacheManager';

class ShoppingListService {
  constructor() {
    this.unsubscribes = new Map();
    this.productCache = new Map();
    this.lastSync = 0;
  }

  /**
   * Get shopping list with optimized caching and batched product fetching
   */
  async getShoppingListOptimized() {
    try {
      // Check if we have valid cached data
      const cachedList = cacheManager.getCache(CACHE_CONFIG.SHOPPING_LIST.key);
      
      if (cachedList) {
        console.log('📋 Using cached shopping list data');
        return cachedList.data;
      }

      console.log('📋 Fetching fresh shopping list data');
      return await this.fetchShoppingListFromFirebase();
    } catch (error) {
      console.error('Error getting shopping list:', error);
      throw error;
    }
  }

  /**
   * Fetch shopping list from Firebase with optimized queries
   */
  async fetchShoppingListFromFirebase() {
    try {
      // Step 1: Get shopping list items
      const shoppingListSnapshot = await getDocs(
        collection(doc(db, 'sharedShoppingList', 'globalList'), 'items')
      );

      if (shoppingListSnapshot.empty) {
        const emptyResult = { items: [], lastUpdated: Date.now() };
        cacheManager.setCache(
          CACHE_CONFIG.SHOPPING_LIST.key, 
          emptyResult, 
          CACHE_CONFIG.SHOPPING_LIST.ttl
        );
        return emptyResult;
      }

      // Step 2: Collect unique product IDs and shopping list data
      const productIds = new Set();
      const shoppingListItems = [];

      shoppingListSnapshot.docs.forEach(doc => {
        const itemData = doc.data();
        if (itemData.productRef?.id) {
          productIds.add(itemData.productRef.id);
          shoppingListItems.push({
            id: doc.id,
            productId: itemData.productRef.id,
            quantity: itemData.quantity || 1,
            purchased: itemData.purchased || false,
            purchaseDate: itemData.purchaseDate,
            addedAt: itemData.addedAt
          });
        }
      });

      // Step 3: Batch fetch all required products
      const products = await this.batchFetchProducts(Array.from(productIds));

      // Step 4: Combine shopping list items with product data
      const completeShoppingList = shoppingListItems
        .map(item => {
          const product = products[item.productId];
          if (!product) {
            console.warn(`Product ${item.productId} not found for shopping list item ${item.id}`);
            return null;
          }

          return {
            id: item.id,
            productId: item.productId,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: item.quantity,
            purchased: item.purchased,
            purchaseDate: item.purchaseDate,
            addedAt: item.addedAt,
            lastModified: product.lastModified
          };
        })
        .filter(item => item !== null);

      const result = {
        items: completeShoppingList,
        lastUpdated: Date.now(),
        totalItems: completeShoppingList.length,
        unpurchasedCount: completeShoppingList.filter(item => !item.purchased).length
      };

      // Cache the result
      cacheManager.setCache(
        CACHE_CONFIG.SHOPPING_LIST.key, 
        result, 
        CACHE_CONFIG.SHOPPING_LIST.ttl
      );

      return result;
    } catch (error) {
      console.error('Error fetching shopping list from Firebase:', error);
      throw error;
    }
  }

  /**
   * Batch fetch products to minimize Firebase calls
   */
  async batchFetchProducts(productIds) {
    if (productIds.length === 0) return {};

    try {
      // Deduplicate IDs
      const uniqueIds = [...new Set(productIds)];
      
      // Check cache first for products
      const cachedProducts = cacheManager.getCache(CACHE_CONFIG.PRODUCTS.key);
      const products = {};
      const uncachedIds = [];

      // Use cached products if available and not expired
      if (cachedProducts) {
        uniqueIds.forEach(id => {
          if (cachedProducts.data[id]) {
            products[id] = cachedProducts.data[id];
          } else {
            uncachedIds.push(id);
          }
        });
      } else {
        uncachedIds.push(...uniqueIds);
      }

      // Fetch uncached products in batches (Firestore 'in' query limit is 10)
      if (uncachedIds.length > 0) {
        console.log(`🔄 Fetching ${uncachedIds.length} products from Firebase`);
        
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < uncachedIds.length; i += batchSize) {
          const batch = uncachedIds.slice(i, i + batchSize);
          batches.push(batch);
        }

        // Execute all batches in parallel with error handling for individual batches
        const batchResults = await Promise.allSettled(
          batches.map(async batch => {
            try {
              return await getDocs(query(collection(db, 'products'), where(documentId(), 'in', batch)));
            } catch (err) {
              console.error(`Error fetching batch of products: ${batch.join(', ')}`, err);
              return null;
            }
          })
        );
        
        // Process successful batch results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            result.value.docs.forEach(doc => {
              products[doc.id] = {
                id: doc.id,
                ...doc.data()
              };
            });
          }
        });

        // Update product cache with whatever products we successfully fetched
        if (Object.keys(products).length > 0) {
          const allProducts = { ...cachedProducts?.data || {}, ...products };
          
          // Prevent cache updates during other operations
          setTimeout(() => {
            cacheManager.setCache(
              CACHE_CONFIG.PRODUCTS.key,
              allProducts,
              CACHE_CONFIG.PRODUCTS.ttl
            );
          }, 0);
        }
      }

      return products;
    } catch (error) {
      console.error('Error batch fetching products:', error);
      // Return whatever products we managed to get from cache to avoid complete failure
      return cachedProducts?.data || {};
    }
  }

  /**
   * Subscribe to shopping list changes with optimized real-time updates
   */
  subscribeToShoppingList(callback) {
    // Debounce flag to prevent multiple concurrent fetches
    let isFetching = false;
    // Track changes that occurred during fetch
    let pendingChanges = false;
    
    const unsubscribe = onSnapshot(
      collection(doc(db, 'sharedShoppingList', 'globalList'), 'items'),
      async (snapshot) => {
        try {
          // Check if this is just metadata changes (no actual data changes)
          if (snapshot.metadata.hasPendingWrites) {
            return; // Skip if these are local writes still pending
          }

          // If already fetching, mark that changes happened during fetch
          if (isFetching) {
            pendingChanges = true;
            return;
          }

          isFetching = true;
          console.log('📋 Shopping list change detected, refreshing...');
          
          // Check if we have valid cached data first
          const cachedList = cacheManager.getCache(CACHE_CONFIG.SHOPPING_LIST.key);
          let canUseCachedData = false;
          
          // If we have cached data, check if it's still valid for the changed items
          if (cachedList && cachedList.data.items.length > 0) {
            // For each changed document, check if we have it cached
            let allChangesInCache = true;
            const changedItemIds = new Set();
            
            snapshot.docChanges().forEach(change => {
              changedItemIds.add(change.doc.id);
            });
            
            // For each changed item, check if it exists in cache
            if (changedItemIds.size > 0) {
              changedItemIds.forEach(id => {
                const itemInCache = cachedList.data.items.find(item => item.id === id);
                if (!itemInCache) {
                  allChangesInCache = false;
                }
              });
              
              if (allChangesInCache) {
                canUseCachedData = true;
              }
            } else {
              // No specific changes detected, can use cache
              canUseCachedData = true;
            }
          }

          // If we can use cached data with the new changes, update it
          if (canUseCachedData) {
            console.log('📋 Using cached data with new changes');
            // Get actual changes
            const changedItems = [];
            snapshot.docChanges().forEach(change => {
              const itemData = change.doc.data();
              // If the item was added or modified
              if (change.type === 'added' || change.type === 'modified') {
                changedItems.push({
                  id: change.doc.id,
                  itemData
                });
              }
            });
            
            // Fetch product data for changed items in batch
            if (changedItems.length > 0) {
              const productIds = [];
              changedItems.forEach(item => {
                if (item.itemData.productRef?.id) {
                  productIds.push(item.itemData.productRef.id);
                }
              });
              
              // Batch fetch products for changed items
              if (productIds.length > 0) {
                try {
                  await this.batchFetchProducts(productIds);
                } catch (error) {
                  console.error('Error fetching products for changed items:', error);
                }
              }
            }
            
            // Update cache invalidation timestamp but keep the data
            cacheManager.setCache(
              CACHE_CONFIG.SHOPPING_LIST.key,
              {
                ...cachedList.data,
                lastUpdated: Date.now()
              },
              CACHE_CONFIG.SHOPPING_LIST.ttl
            );
            
            // Re-fetch full list to ensure consistency
            setTimeout(async () => {
              try {
                const freshData = await this.fetchShoppingListFromFirebase();
                callback(freshData.items);
              } catch (err) {
                console.error('Error in delayed fetch:', err);
              }
            }, 1000); // Delay fetch to prevent rapid re-fetching
            
            // Use cached data for immediate update
            callback(cachedList.data.items);
          } else {
            // Invalidate cache and fetch fresh data
            cacheManager.invalidateCache(CACHE_CONFIG.SHOPPING_LIST.key);
            const freshData = await this.fetchShoppingListFromFirebase();
            callback(freshData.items);
          }
          
          isFetching = false;
          
          // If changes occurred during fetch, schedule another fetch
          if (pendingChanges) {
            pendingChanges = false;
            setTimeout(async () => {
              try {
                const refreshData = await this.fetchShoppingListFromFirebase();
                callback(refreshData.items);
              } catch (err) {
                console.error('Error in refresh fetch:', err);
              }
            }, 1500); // Delay to prevent rapid re-fetching
          }
          
        } catch (error) {
          console.error('Error in shopping list subscription:', error);
          isFetching = false;
          callback(null, error);
        }
      },
      (error) => {
        console.error('Shopping list subscription error:', error);
        isFetching = false;
        callback(null, error);
      }
    );

    this.unsubscribes.set('shoppingList', unsubscribe);
    return unsubscribe;
  }

  /**
   * Get budget with caching
   */
  async getBudget() {
    try {
      const cachedBudget = cacheManager.getCache(CACHE_CONFIG.BUDGET.key);
      
      if (cachedBudget) {
        console.log('💰 Using cached budget data');
        return cachedBudget.data;
      }

      console.log('💰 Fetching fresh budget data');
      
      const budgetSnapshot = await getDocs(collection(db, 'budgets'));
      if (budgetSnapshot.empty) {
        return { totalBudget: 0, lastUpdated: Date.now() };
      }

      const latestBudget = budgetSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .sort((a, b) => b.date - a.date)[0];

      const budgetData = {
        totalBudget: latestBudget?.totalBudget || 0,
        lastUpdated: Date.now()
      };

      cacheManager.setCache(
        CACHE_CONFIG.BUDGET.key,
        budgetData,
        CACHE_CONFIG.BUDGET.ttl
      );

      return budgetData;
    } catch (error) {
      console.error('Error fetching budget:', error);
      throw error;
    }
  }

  /**
   * Update shopping list item with cache invalidation
   */
  async updateShoppingListItem(itemId, updates) {
    try {
      await updateDoc(
        doc(db, 'sharedShoppingList', 'globalList', 'items', itemId),
        {
          ...updates,
          lastModified: Timestamp.fromDate(new Date())
        }
      );

      // Invalidate cache to ensure fresh data on next fetch
      cacheManager.invalidateCache(CACHE_CONFIG.SHOPPING_LIST.key);
      
    } catch (error) {
      console.error('Error updating shopping list item:', error);
      throw error;
    }
  }

  /**
   * Delete shopping list item with cache invalidation
   */
  async deleteShoppingListItem(itemId) {
    try {
      await deleteDoc(doc(db, 'sharedShoppingList', 'globalList', 'items', itemId));
      
      // Invalidate cache
      cacheManager.invalidateCache(CACHE_CONFIG.SHOPPING_LIST.key);
      
    } catch (error) {
      console.error('Error deleting shopping list item:', error);
      throw error;
    }
  }

  /**
   * Clear all shopping list items with cache invalidation
   */
  async clearAllShoppingListItems(items) {
    try {
      const batch = writeBatch(db);
      
      items.forEach(item => {
        const docRef = doc(db, 'sharedShoppingList', 'globalList', 'items', item.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      // Invalidate cache
      cacheManager.invalidateCache(CACHE_CONFIG.SHOPPING_LIST.key);
      
    } catch (error) {
      console.error('Error clearing shopping list:', error);
      throw error;
    }
  }

  /**
   * Batch update purchase status for multiple items
   */
  async batchUpdatePurchaseStatus(updates) {
    try {
      const batch = writeBatch(db);
      const currentTime = Date.now();

      updates.forEach(({ itemId, purchased, additionalData = {} }) => {
        const itemRef = doc(db, 'sharedShoppingList', 'globalList', 'items', itemId);
        batch.update(itemRef, {
          purchased,
          ...(purchased && { purchaseDate: currentTime }),
          lastModified: Timestamp.fromDate(new Date()),
          ...additionalData
        });
      });

      await batch.commit();
      
      // Invalidate cache
      cacheManager.invalidateCache(CACHE_CONFIG.SHOPPING_LIST.key);
      
    } catch (error) {
      console.error('Error batch updating purchase status:', error);
      throw error;
    }
  }

  /**
   * Preload and cache frequently accessed data
   */
  async preloadCache() {
    try {
      console.log('🚀 Preloading shopping list cache...');
      
      // Preload shopping list and products
      const [shoppingListData, budgetData] = await Promise.all([
        this.fetchShoppingListFromFirebase(),
        this.getBudget()
      ]);

      console.log('✅ Cache preloaded successfully');
      return { shoppingListData, budgetData };
      
    } catch (error) {
      console.error('Error preloading cache:', error);
      throw error;
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    this.unsubscribes.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribes.clear();
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeSubscriptions: this.unsubscribes.size,
      cacheStats: cacheManager.getCacheStats(),
      productCacheSize: this.productCache.size,
      lastSync: this.lastSync
    };
  }
}

// Create singleton instance
const shoppingListService = new ShoppingListService();

export default shoppingListService;

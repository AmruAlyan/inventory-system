// // import { useEffect } from 'react';
// // import { addProduct } from './AddProductWidget'; // Adjust path if needed

// // const seedProducts = [
// //   { name: "תפוחים אדומים", category: "פירות וירקות", price: 5.9, quantity: 100 },
// //   { name: "עגבניות שרי", category: "פירות וירקות", price: 6.5, quantity: 80 },
// //   { name: "מלפפונים", category: "פירות וירקות", price: 4.2, quantity: 120 },
// //   { name: "גבינה לבנה 5%", category: "מוצרי חלב", price: 7.9, quantity: 60 },
// //   { name: "יוגורט טבעי", category: "מוצרי חלב", price: 3.5, quantity: 75 },
// //   { name: "חלב 3% ליטר", category: "מוצרי חלב", price: 6.0, quantity: 90 },
// //   { name: "חזה עוף טרי", category: "בשר ודגים", price: 29.9, quantity: 40 },
// //   { name: "קציצות בקר", category: "בשר ודגים", price: 38.0, quantity: 30 },
// //   { name: "פילה סלמון", category: "בשר ודגים", price: 54.0, quantity: 20 },
// //   { name: "לחם שיפון", category: "מאפים ולחמים", price: 8.0, quantity: 50 },
// //   { name: "בורקס גבינה", category: "מאפים ולחמים", price: 4.5, quantity: 60 },
// //   { name: "חלה מתוקה", category: "מאפים ולחמים", price: 10.0, quantity: 35 },
// //   { name: "מים מינרליים 1.5 ליטר", category: "משקאות", price: 2.5, quantity: 100 },
// //   { name: "קולה 1.5 ליטר", category: "משקאות", price: 6.9, quantity: 85 },
// //   { name: "מיץ תפוזים טבעי", category: "משקאות", price: 8.5, quantity: 40 },
// //   { name: "אקונומיקה 2 ליטר", category: "מוצרי ניקיון", price: 6.0, quantity: 70 },
// //   { name: "ספריי לניקוי חלונות", category: "מוצרי ניקיון", price: 9.9, quantity: 45 },
// //   { name: "סבון כלים", category: "מוצרי ניקיון", price: 7.5, quantity: 60 },
// //   { name: "שוקולד פרה", category: "חטיפים ומתוקים", price: 4.9, quantity: 90 },
// //   { name: "חטיף במבה", category: "חטיפים ומתוקים", price: 3.2, quantity: 120 },
// //   { name: "עוגיות שוקולד צ'יפס", category: "חטיפים ומתוקים", price: 7.9, quantity: 55 },
// //   { name: "אורז בסמטי", category: "מזון יבש", price: 11.9, quantity: 70 },
// //   { name: "פסטה פנה", category: "מזון יבש", price: 5.9, quantity: 80 },
// //   { name: "עדשים ירוקות", category: "מזון יבש", price: 9.5, quantity: 60 },
// //   { name: "אפונה קפואה", category: "קפואים", price: 7.0, quantity: 50 },
// //   { name: "שניצל תירס", category: "קפואים", price: 18.9, quantity: 40 },
// //   { name: "פיצה קפואה", category: "קפואים", price: 22.0, quantity: 30 },
// //   { name: "נייר טואלט 12 גלילים", category: "מוצרי נייר", price: 24.9, quantity: 35 },
// //   { name: "מגבות נייר", category: "מוצרי נייר", price: 12.0, quantity: 45 },
// //   { name: "ממחטות אף", category: "מוצרי נייר", price: 5.5, quantity: 60 }
// // ];

// // const SeedProductsComponent = () => {
// //   useEffect(() => {
// //     const seed = async () => {
// //       for (const product of seedProducts) {
// //         try {
// //           await addProduct(product);
// //           console.log('✔️ Added:', product.name);
// //         } catch (error) {
// //           console.error('❌ Failed to add:', product.name, error);
// //         }
// //       }
// //     };

// //     seed();
// //   }, []);

// //   return <p>Seeding products... (Check console for status)</p>;
// // };

// // export default SeedProductsComponent;



// import { useEffect } from 'react';
// import { addProduct } from './Modals/ProductModal';
// import { db } from '../firebase/firebase';
// import { collection, getDocs } from 'firebase/firestore';

// const seedProducts = [
//   { name: "תפוחים אדומים", categoryName: "פירות וירקות", price: 5.9, quantity: 100 },
//   { name: "עגבניות שרי", categoryName: "פירות וירקות", price: 6.5, quantity: 80 },
//   { name: "מלפפונים", categoryName: "פירות וירקות", price: 4.2, quantity: 120 },
//   { name: "גבינה לבנה 5%", categoryName: "מוצרי חלב", price: 7.9, quantity: 60 },
//   { name: "יוגורט טבעי", categoryName: "מוצרי חלב", price: 3.5, quantity: 75 },
//   { name: "חלב 3% ליטר", categoryName: "מוצרי חלב", price: 6.0, quantity: 90 },
//   { name: "חזה עוף טרי", categoryName: "בשר ודגים", price: 29.9, quantity: 40 },
//   { name: "קציצות בקר", categoryName: "בשר ודגים", price: 38.0, quantity: 30 },
//   { name: "פילה סלמון", categoryName: "בשר ודגים", price: 54.0, quantity: 20 },
//   { name: "לחם שיפון", categoryName: "מאפים ולחמים", price: 8.0, quantity: 50 },
//   { name: "בורקס גבינה", categoryName: "מאפים ולחמים", price: 4.5, quantity: 60 },
//   { name: "חלה מתוקה", categoryName: "מאפים ולחמים", price: 10.0, quantity: 35 },
//   { name: "מים מינרליים 1.5 ליטר", categoryName: "משקאות", price: 2.5, quantity: 100 },
//   { name: "קולה 1.5 ליטר", categoryName: "משקאות", price: 6.9, quantity: 85 },
//   { name: "מיץ תפוזים טבעי", categoryName: "משקאות", price: 8.5, quantity: 40 },
//   { name: "אקונומיקה 2 ליטר", categoryName: "מוצרי ניקיון", price: 6.0, quantity: 70 },
//   { name: "ספריי לניקוי חלונות", categoryName: "מוצרי ניקיון", price: 9.9, quantity: 45 },
//   { name: "סבון כלים", categoryName: "מוצרי ניקיון", price: 7.5, quantity: 60 },
//   { name: "שוקולד פרה", categoryName: "חטיפים ומתוקים", price: 4.9, quantity: 90 },
//   { name: "חטיף במבה", categoryName: "חטיפים ומתוקים", price: 3.2, quantity: 120 },
//   { name: "עוגיות שוקולד צ'יפס", categoryName: "חטיפים ומתוקים", price: 7.9, quantity: 55 },
//   { name: "אורז בסמטי", categoryName: "מזון יבש", price: 11.9, quantity: 70 },
//   { name: "פסטה פנה", categoryName: "מזון יבש", price: 5.9, quantity: 80 },
//   { name: "עדשים ירוקות", categoryName: "מזון יבש", price: 9.5, quantity: 60 },
//   { name: "אפונה קפואה", categoryName: "קפואים", price: 7.0, quantity: 50 },
//   { name: "שניצל תירס", categoryName: "קפואים", price: 18.9, quantity: 40 },
//   { name: "פיצה קפואה", categoryName: "קפואים", price: 22.0, quantity: 30 },
//   { name: "נייר טואלט 12 גלילים", categoryName: "מוצרי נייר", price: 24.9, quantity: 35 },
//   { name: "מגבות נייר", categoryName: "מוצרי נייר", price: 12.0, quantity: 45 },
//   { name: "ממחטות אף", categoryName: "מוצרי נייר", price: 5.5, quantity: 60 }
// ];

// const SeedProductsComponent = () => {
//   useEffect(() => {
//     const seed = async () => {
//       // First, get all categories
//       const categories = new Map();
//       const querySnapshot = await getDocs(collection(db, 'categories'));
//       querySnapshot.docs.forEach(doc => {
//         categories.set(doc.data().name, doc.id);
//       });

//       // Then seed products
//       for (const product of seedProducts) {
//         try {
//           const categoryId = categories.get(product.categoryName);
//           if (!categoryId) {
//             console.error(`❌ Category not found: ${product.categoryName}`);
//             continue;
//           }

//           const productData = {
//             name: product.name,
//             category: categoryId, // Using the category ID instead of name
//             price: product.price,
//             quantity: product.quantity
//           };

//           await addProduct(productData);
//           console.log('✔️ Added:', product.name);
//         } catch (error) {
//           console.error('❌ Failed to add:', product.name, error);
//         }
//       }
//       console.log('✅ Seeding completed!');
//     };

//     seed();
//   }, []);

//   return <div>מוסיף מוצרים למערכת... (בדוק בקונסול לסטטוס)</div>;
// };

// export default SeedProductsComponent;
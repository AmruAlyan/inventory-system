# Inventory Management System (IMS)

**עמותת ותיקי מטה יהודה - Elderly Care Nonprofit Organization**

## 📋 Overview

The Inventory Management System (IMS) is a comprehensive web application developed specifically for עמותת ותיקי מטה יהודה, an Elderly Care Nonprofit Organization. This system streamlines the management of essential supplies including food items and cleaning materials, ensuring efficient inventory tracking, budget monitoring, and comprehensive reporting for better operational management.

The application provides real-time visibility into inventory levels, purchase history, and budget utilization, helping the nursing home maintain optimal stock levels while staying within budget constraints.

## ✨ Features

### 🏪 Product Management
- **Product Catalog**: Comprehensive database of all inventory items
- **Category Organization**: Structured categorization of food and cleaning supplies
- **Stock Level Tracking**: Real-time inventory monitoring with low-stock alerts
- **Product Details**: Detailed information including descriptions, prices, and specifications

### 🛒 Purchase Management
- **Purchase Logging**: Record all incoming purchases and deliveries
- **Purchase History**: Complete audit trail of all transactions
- **Supplier Information**: Track vendor details and purchase sources
- **Receipt Management**: Digital storage of purchase receipts and documentation

### 💰 Budget Tracking
- **Monthly Budget Allocation**: Set and monitor monthly spending limits
- **Budget Utilization**: Real-time tracking of budget usage across categories
- **Spending Analytics**: Detailed breakdown of expenses by category and time period
- **Budget Alerts**: Notifications when approaching budget limits

### 📊 Report Generation
- **Comprehensive Reports**: Generate detailed inventory and financial reports
- **Printable Formats**: Export reports in print-ready formats
- **Custom Date Ranges**: Generate reports for specific time periods
- **Budget Analysis**: Monthly and quarterly budget performance reports

### 👥 User Management
- **Role-Based Access**: Different access levels for administrators and managers
- **Secure Authentication**: Firebase-based user authentication system
- **User Profiles**: Personalized user accounts with activity tracking

## 🛠️ Tech Stack

- **Frontend**: React.js with modern JavaScript (ES6+)
- **Styling**: CSS3 with responsive design
- **Build Tool**: Vite for fast development and optimized builds
- **Backend Services**: Firebase ecosystem
  - **Authentication**: Firebase Auth for secure user management
  - **Database**: Firestore for real-time data storage
  - **File Storage**: Firebase Storage for documents and images
- **State Management**: React Context API
- **Routing**: React Router for navigation
- **Charts & Visualization**: Custom chart components for data visualization

## 🚀 Installation Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account and project setup

### 1. Clone the Repository
```bash
git clone https://github.com/AmruAlyan/inventory-system.git
cd inventory-system
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication, Firestore Database, and Storage services
3. Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Configure Firestore Rules
Deploy the provided Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 💡 Usage

### Getting Started
1. **Login**: Use your credentials to access the system
2. **Dashboard**: Overview of current inventory status and recent activities
3. **Navigation**: Use the sidebar to access different modules

### Managing Products
- Navigate to **Products** section
- Add new products with details like name, category, and price
- Update existing product information
- Track stock levels and set reorder points

### Recording Purchases
- Go to **Purchases** section
- Log new purchases with supplier and quantity information
- Upload receipt images for documentation
- Update inventory levels automatically

### Budget Monitoring
- Access **Budget** section (Admin only)
- Set monthly budget allocations
- Monitor spending against budget limits
- View budget utilization charts

### Generating Reports
- Navigate to **Reports** section
- Select report type and date range
- Generate comprehensive inventory and budget reports
- Export reports for printing or sharing

## 📁 Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdminOnly/       # Admin-specific components
│   ├── Charts/          # Data visualization components
│   ├── LayoutComponents/# Layout and navigation components
│   ├── Modals/          # Modal dialog components
│   ├── Reports/         # Report generation components
│   └── Widgets/         # Dashboard widgets
├── constants/           # Application constants and configurations
├── context/             # React Context providers
├── firebase/            # Firebase configuration and services
├── hooks/               # Custom React hooks
├── layouts/             # Page layout components
├── pages/               # Main application pages
│   ├── Admin/           # Administrator pages
│   └── Manager/         # Manager pages
├── styles/              # CSS stylesheets organized by feature
├── utils/               # Utility functions and helpers
└── assets/              # Static assets (images, icons)
```

## 📸 Screenshots

### Login Page:
![image](https://github.com/user-attachments/assets/99a3fc64-5982-4d4c-ae9c-b94da59b5f73)

### Admin Dashboard:
![image](https://github.com/user-attachments/assets/196a1360-d25c-4725-aac1-7832433ca6c8)

### Manager Dashboard:
![image](https://github.com/user-attachments/assets/53e8958b-588d-4168-a62e-c08de67a0d30)


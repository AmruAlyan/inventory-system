import React from 'react';
import SortableTable from './SortableTable';

// Example usage of the SortableTable component
const ExampleTableUsage = () => {
  // Sample data similar to your image
  const sampleData = [
    {
      id: 1,
      date: new Date('2025-01-01'),
      amount: 1500.00,
      budgetAmount: 4000.00,
      description: 'Budget Entry 1'
    },
    {
      id: 2,
      date: new Date('2025-01-29'),
      amount: 0.00,
      budgetAmount: 5200.00,
      description: 'Budget Entry 2'
    },
    {
      id: 3,
      date: new Date('2025-01-15'),
      amount: 300.00,
      budgetAmount: 2500.00,
      description: 'Budget Entry 3'
    },
    {
      id: 4,
      date: new Date('2025-01-01'),
      amount: 1200.00,
      budgetAmount: 2200.00,
      description: 'Budget Entry 4'
    },
    {
      id: 5,
      date: new Date('2025-04-01'),
      amount: 1000.00,
      budgetAmount: 1000.00,
      description: 'Budget Entry 5'
    }
  ];

  // Define table columns
  const columns = [
    {
      key: 'date',
      title: 'תאריך',
      sortable: true,
      align: 'center',
      width: '200px',
      render: (value) => value.toLocaleDateString('he-IL')
    },
    {
      key: 'amount',
      title: 'סכום',
      sortable: true,
      align: 'center',
      width: '150px',
      type: 'currency',
      render: (value) => `₪ ${value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'budgetAmount',
      title: 'סכ"פ תקציב',
      sortable: true,
      align: 'center',
      width: '150px',
      type: 'currency',
      render: (value) => `₪ ${value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`
    },
    {
      key: 'description',
      title: 'תיאור',
      sortable: true,
      align: 'right',
      render: (value) => value || '-'
    }
  ];

  // Handle edit action
  const handleEdit = (item) => {
    // Add your edit logic here
  };

  // Handle delete action
  const handleDelete = (item) => {
    // Add your delete logic here
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>דוגמה לשימוש ברכיב הטבלה</h2>
      
      <SortableTable
        columns={columns}
        data={sampleData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="אין נתונים להצגה"
        rtl={true}
        className="custom-table"
      />

      <div style={{ marginTop: '40px' }}>
        <h3>דוגמה נוספת - טבלה פשוטה ללא פעולות</h3>
        <SortableTable
          columns={[
            { key: 'date', title: 'תאריך', sortable: true },
            { key: 'amount', title: 'סכום', sortable: true, type: 'currency' }
          ]}
          data={sampleData.slice(0, 3)}
          emptyMessage="אין רשומות"
          rtl={true}
        />
      </div>
    </div>
  );
};

export default ExampleTableUsage;

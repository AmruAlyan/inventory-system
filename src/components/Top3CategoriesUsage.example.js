// Example of how to use the Top3Categories component in a dashboard

// 1. Import the component in your dashboard file:
import Top3Categories from '../components/top3cat';

// 2. Add it to your JSX render (example placement in a dashboard):

const ExampleDashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        
        {/* Your existing dashboard widgets */}
        <div className="widget-section">
          <h2>סטטיסטיקות כלליות</h2>
          {/* Other widgets... */}
        </div>

        {/* Add the Top3Categories component */}
        <div className="widget-section">
          <Top3Categories />
        </div>

        {/* More dashboard content... */}
      </div>
    </div>
  );
};

// 3. Example CSS for dashboard integration (add to your dashboard CSS file):

/*
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.widget-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}
*/

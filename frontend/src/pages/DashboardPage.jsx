import React from 'react';
import { Dashboard, Navigation } from '../components';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Dashboard />
    </div>
  );
};

export default DashboardPage;
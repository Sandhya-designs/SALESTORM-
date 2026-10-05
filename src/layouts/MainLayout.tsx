import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { GlobalDemoBar } from '../components/GlobalDemoBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <TopBar />
        <GlobalDemoBar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};


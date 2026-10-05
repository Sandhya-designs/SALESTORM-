import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../data/mockData';
import { DynamicIcon } from './DynamicIcon';
import { ShieldCheck, Server } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-icon-wrapper">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-title">FLASHGUARD</div>
            <div className="brand-subtitle">SYS-CRAFTERS 2026</div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">SIMULATION CONTROLS</div>
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-left">
                <DynamicIcon name={item.iconName} size={17} />
                <span>{item.label}</span>
              </div>
              <span className="nav-phase-tag">P{item.phase}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status-box">
          <div className="status-row">
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM STATUS</span>
            <span className="status-dot pulse-dot" />
          </div>
          <div className="status-row" style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            LOCAL SIMULATION
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Server size={11} /> Standby • Node 127.0.0.1
          </div>
        </div>
      </div>
    </aside>
  );
};

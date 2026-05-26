import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardCheck, History, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const CheckingLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Top Bar */}
      <header style={{ 
        background: '#fff', padding: '1rem', borderBottom: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ClipboardCheck size={20} />
          </div>
          <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>Checking<span style={{ color: '#3B82F6' }}>Pro</span></span>
        </div>
        <button onClick={handleLogout} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '0.5rem', color: '#64748B' }}>
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: '#fff', borderTop: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-around', padding: '0.75rem 0',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
        zIndex: 100
      }}>
        <NavLink to="/checking/dashboard" style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: isActive ? '#3B82F6' : '#94A3B8', textDecoration: 'none'
        })}>
          <LayoutDashboard size={22} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Queue</span>
        </NavLink>

        <NavLink to="/checking/history" style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          color: isActive ? '#3B82F6' : '#94A3B8', textDecoration: 'none'
        })}>
          <History size={22} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>History</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CheckingLayout;

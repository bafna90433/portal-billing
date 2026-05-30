import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, LogOut, LayoutDashboard, Truck, Receipt, Users, ArrowLeft, Image as ImageIcon, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { getPortalConfig } from '../../utils/portalConfig';

interface BillingSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { to: '/billing/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/billing/ready', icon: <Truck size={17} />, label: 'Ready for Bill' },
  { to: '/billing/generated', icon: <Receipt size={17} />, label: 'Invoice Records' },
  { to: '/billing/fulfillment', icon: <Users size={17} />, label: 'Customer Fulfillment' },
];

const BillingSidebar: React.FC<BillingSidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const portal = getPortalConfig();
  const accentGradient = `linear-gradient(135deg, ${portal.gradientFrom}, ${portal.gradientTo})`;

  const [pendingBillCount, setPendingBillCount] = useState(0);

  const fetchPendingBills = useCallback(async () => {
    try {
      const { data } = await api.get('/billing');
      if (Array.isArray(data)) {
        const pending = data.filter((b: any) => !b.isSubmitted).length;
        setPendingBillCount(pending);
      }
    } catch (err) {
      console.error('Failed to fetch billing count in sidebar', err);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'billing') {
      fetchPendingBills();
      const interval = setInterval(fetchPendingBills, 15000); // Poll every 15s for instant updates
      return () => clearInterval(interval);
    }
  }, [user, fetchPendingBills]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Portal accent top bar */}
        <div style={{ height: 3, background: accentGradient, flexShrink: 0 }} />
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ overflow: 'hidden', background: 'white', boxShadow: `0 8px 24px -6px ${portal.accentColor}60` }}>
            <img
              src="https://ik.imagekit.io/rishii/bafnatoys/Copy%20of%20Super_Car___05_vrkphh.webp?updatedAt=1775309336739"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Logo"
            />
          </div>
          <div>
            <div className="sidebar-logo-text">Stock<span>Pro</span></div>
            <div style={{ fontSize: '0.62rem', color: portal.accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px', opacity: 0.9 }}>
              Billing Portal
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Finance & Billing</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.to === '/billing/generated' && pendingBillCount > 0 && (
                <span className="blinking-bell-badge" style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  padding: '2px 8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  color: '#EF4444',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  marginLeft: 'auto',
                  animation: 'sidebar-bell-blink 1.5s infinite ease-in-out'
                }}>
                  <Bell size={12} style={{ animation: 'sidebar-bell-ring 1s infinite', flexShrink: 0 }} />
                  <span>{pendingBillCount}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Accounts & Billing'}</div>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
              <ArrowLeft size={15} /> Back to Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--sidebar-text)' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
        <style>{`
          @keyframes sidebar-bell-blink {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
          @keyframes sidebar-bell-ring {
            0%, 100% { transform: rotate(0); }
            20%, 60% { transform: rotate(15deg); }
            40%, 80% { transform: rotate(-15deg); }
          }
        `}</style>
      </aside>
    </>
  );
};

export default BillingSidebar;

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, X, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { getPortalConfig } from '../utils/portalConfig';

const routeLabels: Record<string, string> = {
  // Admin
  '/admin/dashboard':   'Admin Dashboard',
  '/admin/users':       'User Management',
  '/admin/categories':  'Categories',
  '/admin/stock':       'Stock Management',
  '/admin/products':    'Products',
  // Stock Manager
  '/stock-manager/dashboard':  'Inventory Dashboard',
  '/stock-manager/stock':      'Stock Management',
  '/stock-manager/categories': 'Categories',
  '/stock-manager/add-product':'Add Product',
  '/stock-manager/products':   'Products List',
  // Staff
  '/sale-staff/dashboard':        'Staff Dashboard',
  '/sale-staff/manage-orders':    'Manage Orders',
  '/sale-staff/direct-order':     'New Sales Order',
  '/sale-staff/dispatched-orders':'Dispatched Orders',
  '/sale-staff/pending-orders':   'Pending Orders',
  '/sale-staff/fulfillment':      'Customer Fulfillment',
  // Dispatch
  '/dispatch/dashboard':  'Dispatch Dashboard',
  '/dispatch/ready':      'Ready to Dispatch',
  '/dispatch/hold':       'Pending & Hold',
  '/dispatch/dispatched': 'Dispatched Items',
  '/dispatch/history':    'Dispatch History',
  '/dispatch/orders':     'All Orders',
  // Billing
  '/billing/dashboard':   'Billing Dashboard',
  '/billing/ready':       'Ready for Bill',
  '/billing/generated':   'Generated Bills',
  '/billing/fulfillment': 'Customer Fulfillment',
};

function getPageTitle(pathname: string): string {
  if (routeLabels[pathname]) return routeLabels[pathname];
  if (pathname.startsWith('/billing/') && pathname.includes('/create/')) return 'Create Invoice';
  if (pathname.startsWith('/billing/')) return 'Invoice';
  if (pathname.startsWith('/dispatch/orders/')) return 'Dispatch Order';
  if (pathname.startsWith('/sale-staff/invoice/')) return 'Order Invoice';
  if (pathname.startsWith('/sale-staff/edit-order/')) return 'Edit Order';
  return '';
}

const typeIcon: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  error: '🔴',
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface TopHeaderProps {
  onMenuClick?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, markRead, markAllRead, clearAll, unreadCount, urgentCount, startPolling } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);
  const portal = getPortalConfig();
  const accentGradient = `linear-gradient(90deg, ${portal.gradientFrom}, ${portal.gradientTo})`;

  const count = unreadCount();
  const urgent = urgentCount();
  const title = getPageTitle(location.pathname);

  // Start polling when user is logged in
  useEffect(() => {
    if (user) {
      const stop = startPolling();
      return stop;
    }
  }, [user]);

  // Blinking effect when there are urgent notifications
  useEffect(() => {
    if (urgent > 0) {
      const interval = setInterval(() => setBlink(b => !b), 700);
      return () => clearInterval(interval);
    } else {
      setBlink(false);
    }
  }, [urgent]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n: any) => {
    markRead(n.id);
    if (n.link) {
      let targetLink = n.link;

      // Portal-lock for Admins: If an admin is working in a specific portal (like sales-staff),
      // clicking a notification should keep them in that portal instead of yanking them to another.
      if (user?.role === 'admin') {
        const currentPortal = location.pathname.split('/')[1];
        const targetPortal = n.link.split('/')[1];

        if (currentPortal && targetPortal && currentPortal !== targetPortal) {
          if (currentPortal === 'sale-staff') {
            // Map cross-portal links to specific staff pages based on notification title
            const title = n.title.toLowerCase();
            if (title.includes('dispatched') && !title.includes('partial')) {
              targetLink = '/sale-staff/dispatched-orders';
            } else if (title.includes('order') || title.includes('hold') || title.includes('stock')) {
              targetLink = '/sale-staff/pending-orders';
            } else {
              targetLink = '/sale-staff/dashboard';
            }
          }
        }
      }

      navigate(targetLink);
      setOpen(false);
    }
  };

  return (
    <header className="top-header" style={{ position: 'relative' }}>
      {/* Portal accent bottom line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: accentGradient, opacity: 0.6,
      }} />
      <div className="top-header-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        {title && <h1 className="top-header-title">{title}</h1>}
      </div>

      <div className="top-header-right">
        {/* Notification Bell */}
        <div className="notif-wrapper" ref={dropdownRef}>
          <button
            className={`notif-bell-btn${count > 0 ? ' has-unread' : ''}`}
            onClick={() => setOpen((p) => !p)}
            aria-label="Notifications"
            style={{
              position: 'relative',
              background: urgent > 0 && blink ? 'rgba(239,68,68,0.15)' : undefined,
              borderRadius: 10,
              transition: 'background 0.3s',
            }}
          >
            <Bell
              size={20}
              style={{
                color: urgent > 0 ? (blink ? '#EF4444' : '#F87171') : undefined,
                transition: 'color 0.3s',
              }}
            />
            {count > 0 && (
              <span
                className="notif-badge"
                style={{
                  background: urgent > 0 ? '#EF4444' : portal.accentColor,
                  boxShadow: urgent > 0 && blink ? '0 0 8px 2px rgba(239,68,68,0.6)' : undefined,
                  transition: 'box-shadow 0.3s',
                }}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          {open && (
            <div className="notif-dropdown" style={{ width: 360 }}>
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">
                  Notifications
                  {urgent > 0 && (
                    <span style={{
                      marginLeft: 8, fontSize: '0.68rem', fontWeight: 700,
                      background: 'rgba(239,68,68,0.12)', color: '#EF4444',
                      borderRadius: 20, padding: '1px 8px',
                    }}>
                      {urgent} urgent
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {count > 0 && (
                    <button className="notif-action-btn" onClick={markAllRead} title="Mark all read">
                      <CheckCheck size={15} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="notif-action-btn" onClick={clearAll} title="Clear all">
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button className="notif-action-btn" onClick={() => setOpen(false)}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={28} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? ' read' : ''}`}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        cursor: n.link ? 'pointer' : 'default',
                        borderLeft: !n.read && n.urgent ? '3px solid #EF4444' : !n.read ? `3px solid ${portal.accentColor}` : '3px solid transparent',
                        background: !n.read && n.urgent ? 'rgba(239,68,68,0.04)' : undefined,
                      }}
                    >
                      <span className="notif-icon">{typeIcon[n.type]}</span>
                      <div className="notif-body">
                        <div className="notif-item-title" style={{ color: n.urgent && !n.read ? '#EF4444' : undefined }}>
                          {n.title}
                        </div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{timeAgo(n.time)}</div>
                      </div>
                      {!n.read && <span className="notif-dot" style={{ background: n.urgent ? '#EF4444' : portal.accentColor }} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="header-user">
          <div className="header-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name}</span>
            <span className="header-user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

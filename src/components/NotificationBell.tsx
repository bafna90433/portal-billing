import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

interface Notif {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  urgent?: boolean;
  link?: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

const typeColor: Record<string, string> = {
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#6366F1',
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const DROPDOWN_WIDTH = 340;

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30000);
    return () => clearInterval(iv);
  }, []);

  // Reposition dropdown on open / scroll / resize
  const calcPos = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  };

  const toggleOpen = () => {
    if (!open) calcPos();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', () => setOpen(false));
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', () => setOpen(false));
    };
  }, [open]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    setLoading(true);
    await api.patch('/notifications/read-all/mark');
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    await api.delete('/notifications/clear-all');
    setNotifs([]);
    setLoading(false);
  };

  return (
    <>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={toggleOpen}
        style={{
          position: 'relative',
          background: open ? '#6366F1' : '#fff',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? '#fff' : '#6366F1',
          transition: 'all 0.15s',
          width: 42,
          height: 42,
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#EF4444', color: '#fff',
            fontSize: '0.6rem', fontWeight: 800,
            borderRadius: 20, padding: '1px 5px',
            minWidth: 17, textAlign: 'center',
            animation: 'bell-pulse 1.4s ease-in-out infinite',
            boxShadow: '0 0 8px rgba(239,68,68,0.6)',
            lineHeight: '14px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown — rendered via fixed position, escapes overflow:hidden */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            right: dropPos.right,
            zIndex: 99999,
            width: DROPDOWN_WIDTH,
            maxHeight: 'min(500px, 80vh)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg2)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={15} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Notifications</span>
              {unread > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', fontSize: '0.62rem', fontWeight: 800, borderRadius: 20, padding: '1px 7px' }}>
                  {unread} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    disabled={loading}
                    title="Mark all read"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 6 }}
                  >
                    <CheckCheck size={13} /> Mark all
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    disabled={loading}
                    title="Clear all notifications"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }} className="custom-scrollbar">
            {notifs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                🔔 No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n._id}
                  className={n.read ? '' : 'unread-notif'}
                  onClick={() => { 
                    markRead(n._id); 
                    setOpen(false); 

                    // 1. If explicit link exists, use it, BUT check for role compatibility
                    if (n.link) {
                      const isDispatchLink = n.link.includes('/dispatch/');
                      const isBillingLink = n.link.includes('/billing/');
                      const role = user?.role;

                      // If it's a restricted link and user is NOT that role, skip and use orderId logic
                      const skipLink = (isDispatchLink && role !== 'dispatch' && role !== 'admin') || 
                                       (isBillingLink && role !== 'billing' && role !== 'admin');

                      if (!skipLink) {
                        navigate(n.link);
                        return;
                      }
                    }

                    // 2. If orderId exists (or skipLink was true), go to details based on role
                    if (n.orderId) {
                      const role = user?.role;
                      if (role === 'admin' || role === 'sale_head') {
                        navigate(`/admin/order-details/${n.orderId}`);
                      } else if (role === 'dispatch') {
                        navigate(`/dispatch/ready`); 
                      } else if (role === 'billing') {
                        navigate(`/billing/manage`); 
                      } else {
                        navigate(`/sale-staff/order-details/${n.orderId}`);
                      }
                      return;
                    }

                    // 3. Fallback for stock alerts
                    if (n.title?.toLowerCase().includes('stock') || n.message?.toLowerCase().includes('stock')) {
                      navigate('/dispatch/stock?filter=out');
                      return;
                    }

                    // 4. Legacy fallback for admin search
                    if (user?.role === 'admin') {
                      let status = 'all';
                      const msg = n.message?.toLowerCase() || '';
                      const title = n.title?.toLowerCase() || '';
                      
                      if (title.includes('bill') || msg.includes('bill')) status = 'billed';
                      else if (title.includes('partial') || msg.includes('partial')) status = 'partial';
                      else if (title.includes('dispatch') || msg.includes('dispatch')) status = 'dispatched';
                      else if (title.includes('order') || msg.includes('order')) status = 'pending';

                      const orderMatch = (n.message + n.title).match(/ORD-\d+/i);
                      const search = orderMatch ? orderMatch[0] : '';
                      
                      navigate(`/admin/order-images?search=${search}&status=${status}`);
                      return;
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)',
                    display: 'flex',
                    gap: '0.65rem',
                    alignItems: 'flex-start',
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Type dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                    background: typeColor[n.type] || '#6366F1',
                    boxShadow: n.read ? 'none' : `0 0 6px ${typeColor[n.type]}80`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 600 : 800, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.3 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bell-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
        @keyframes breathing-glow {
          0% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 2px rgba(239,68,68,0.1), inset 0 0 2px rgba(239,68,68,0.05); background: #fff; }
          50% { border-color: rgba(239,68,68,1); box-shadow: 0 0 15px rgba(239,68,68,0.5), inset 0 0 10px rgba(239,68,68,0.15); background: rgba(239,68,68,0.04); }
          100% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 2px rgba(239,68,68,0.1), inset 0 0 2px rgba(239,68,68,0.05); background: #fff; }
        }
        .unread-notif {
          animation: breathing-glow 2s ease-in-out infinite;
          margin: 8px 12px;
          border-radius: 12px;
          border: 1.5px solid rgba(239,68,68,0.3) !important;
          position: relative;
          transition: all 0.3s ease;
        }
        .unread-notif:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239,68,68,0.25) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
};

export default NotificationBell;

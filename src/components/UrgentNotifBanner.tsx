import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';

const UrgentNotifBanner: React.FC = () => {
  const { notifications, markRead } = useNotificationStore();
  const navigate = useNavigate();
  const [blink, setBlink] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const urgent = notifications.filter(n => !n.read && n.urgent && !dismissed.has(n.id));

  useEffect(() => {
    if (urgent.length > 0) {
      const interval = setInterval(() => setBlink(b => !b), 600);
      return () => clearInterval(interval);
    }
  }, [urgent.length]);

  if (urgent.length === 0) return null;

  const handleClick = (n: any) => {
    markRead(n.id);
    setDismissed(prev => new Set([...prev, n.id]));
    if (n.link) navigate(n.link);
  };

  const dismissAll = () => {
    urgent.forEach(n => markRead(n.id));
    setDismissed(prev => new Set([...prev, ...urgent.map(n => n.id)]));
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {urgent.slice(0, 3).map(n => (
        <div
          key={n.id}
          onClick={() => handleClick(n)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '0.5rem',
            cursor: n.link ? 'pointer' : 'default',
            background: blink
              ? (n.type === 'error' ? 'rgba(239,68,68,0.12)' : n.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)')
              : (n.type === 'error' ? 'rgba(239,68,68,0.06)' : n.type === 'warning' ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.06)'),
            border: `1.5px solid ${n.type === 'error' ? 'rgba(239,68,68,0.35)' : n.type === 'warning' ? 'rgba(245,158,11,0.35)' : 'rgba(99,102,241,0.35)'}`,
            transition: 'background 0.3s',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: n.type === 'error' ? 'rgba(239,68,68,0.15)' : n.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
            fontSize: '1.1rem',
            boxShadow: blink ? `0 0 10px 2px ${n.type === 'error' ? 'rgba(239,68,68,0.4)' : n.type === 'warning' ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)'}` : 'none',
            transition: 'box-shadow 0.3s',
          }}>
            <Bell size={16} color={n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#F59E0B' : '#6366F1'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: '0.85rem',
              color: n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#D97706' : '#6366F1',
            }}>
              {n.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {n.message}
            </div>
          </div>
          {n.link && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#D97706' : '#6366F1', whiteSpace: 'nowrap' }}>
              View →
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); setDismissed(prev => new Set([...prev, n.id])); markRead(n.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2, flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {urgent.length > 3 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
          <span>+{urgent.length - 3} more urgent notifications</span>
          <button onClick={dismissAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>
            Dismiss all
          </button>
        </div>
      )}
    </div>
  );
};

export default UrgentNotifBanner;

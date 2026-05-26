import React, { useEffect, useState, useCallback } from 'react';
import { Clock, AlertTriangle, IndianRupee, FileText, ArrowUpRight, ArrowRight } from 'lucide-react';
import DashboardHero from '../../components/DashboardHero';
import api from '../../api/axios';
import UrgentNotifBanner from '../../components/UrgentNotifBanner';
import { Link, useNavigate } from 'react-router-dom';

const BillingDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [draftBills, setDraftBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await api.get('/billing/dashboard-stats');
      setStats(data.stats);
      setRecentBills(data.recentBills || []);
      setDraftBills(data.draftBills || []);
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    { label: 'Pending Bills',    value: stats.pendingBills,                                  icon: <Clock size={18} />,        color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
    { label: 'Unpaid Bills',     value: stats.unpaidBills,                                   icon: <AlertTriangle size={18} />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
    { label: 'Total Collected',  value: `₹${(stats.totalCollected || 0).toLocaleString()}`,  icon: <IndianRupee size={18} />,   color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  ];

  const quickActions = [
    { label: 'Generated Bills', icon: <FileText size={15} />, to: '/billing/generated', color: '#6366F1' },
  ];

  return (
    <div style={{ padding: '1.75rem 2rem', width: '100%', boxSizing: 'border-box' }}>
      <UrgentNotifBanner />

      <DashboardHero
        title="Billing Dashboard"
        subtitle="Manage invoices, track payments, and monitor financial overview."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        stats={[
          { label: 'Pending Bills', value: loading ? '—' : stats.pendingBills ?? 0, color: '#F59E0B' },
          { label: 'Unpaid', value: loading ? '—' : stats.unpaidBills ?? 0, color: '#EF4444' },
          { label: 'Collected', value: loading ? '—' : `₹${((stats.totalCollected || 0) / 1000).toFixed(0)}k`, color: '#10B981' },
        ]}
        actions={[
          { label: 'View Bills', icon: <FileText size={15} />, to: '/billing/generated', variant: 'primary' },
        ]}
      />

      {/* 3 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {statCards.map((s) => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderLeft: `4px solid ${s.color}`,
            borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: 'var(--shadow-xs)', transition: 'all 0.18s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>
                {loading ? '—' : s.value ?? 0}
              </div>
            </div>
            <ArrowUpRight size={14} style={{ color: s.color, opacity: 0.4, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1.25rem',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '0.85rem 1.25rem', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>Quick Actions</span>
        <div style={{ width: 1, height: 24, background: 'var(--border)', marginRight: '0.5rem' }} />
        {quickActions.map((a) => (
          <Link key={a.label} to={a.to} style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            textDecoration: 'none', color: a.color,
            fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = a.color; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.color = a.color; }}
          >
            {a.icon} {a.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Upcoming Draft Bills */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Upcoming Bills</div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#D97706', border: '1px solid rgba(245,158,11,0.3)' }}>DRAFT</span>
            </div>
            {draftBills.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {draftBills.length} pending dispatch
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
          ) : draftBills.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', opacity: 0.2 }}>⏳</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>No upcoming bills right now</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>Appears when dispatch team opens an order</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Order #', 'Customer', 'Est. Amount', 'Since'].map(h => (
                    <th key={h} style={{ padding: '0.45rem 1.25rem', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftBills.map((b: any, i: number) => (
                  <tr key={b._id}
                    style={{ borderBottom: i < draftBills.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td style={{ padding: '0.5rem 1.25rem', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{b.orderNumber}</td>
                    <td style={{ padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.82rem' }}>{b.customerName}</td>
                    <td style={{ padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem', color: '#D97706' }}>
                      ~₹{(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '0.5rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Bills Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Bills Generated</div>
            <Link to="/billing/generated" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
          ) : recentBills.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', opacity: 0.2 }}>🧾</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>No recent bills</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Bill #', 'Order #', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.45rem 1.25rem', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b: any, i: number) => {
                  const isPaid = b.status === 'paid';
                  return (
                    <tr key={b._id}
                      onClick={() => navigate(`/billing/${b._id}`)}
                      style={{ borderBottom: i < recentBills.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td style={{ padding: '0.5rem 1.25rem', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{b.billNumber}</td>
                      <td style={{ padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.82rem' }}>{b.orderNumber}</td>
                      <td style={{ padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.82rem' }}>₹{b.totalAmount?.toLocaleString()}</td>
                      <td style={{ padding: '0.5rem 1.25rem' }}>
                        <span style={{
                          fontSize: '0.67rem', fontWeight: 700, padding: '2px 9px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em',
                          background: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: isPaid ? '#10B981' : '#F59E0B',
                        }}>{b.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default BillingDashboard;

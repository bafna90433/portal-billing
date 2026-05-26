import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const BalancePending: React.FC = () => {
  const [data, setData] = useState<any>({ totalPending: 0, byCustomer: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/billing/pending-summary').then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, []);

  const sendWAReminder = (customer: string, amount: number) => {
    const msg = `Hello ${customer},\n\nThis is a payment reminder from StockPro.\n\nYour outstanding balance is: *₹${amount.toFixed(2)}*\n\nKindly clear the dues at your earliest convenience.\n\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Balance Pending</h1>
          <p className="page-subtitle">Outstanding dues from customers</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ ['--gradient' as any]: 'linear-gradient(135deg, #FF6B6B, #e55c5c)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.15)', color: 'var(--danger)' }}>
            <Wallet size={22} />
          </div>
          <div className="stat-value">₹{loading ? '—' : data.totalPending.toFixed(0)}</div>
          <div className="stat-label">Total Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(253,203,110,0.15)', color: 'var(--accent)' }}>
            <AlertCircle size={22} />
          </div>
          <div className="stat-value">{loading ? '—' : data.count}</div>
          <div className="stat-label">Unpaid Bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--primary)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-value">{loading ? '—' : data.byCustomer?.length}</div>
          <div className="stat-label">Customers with Dues</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner"></div></div>
      ) : data.byCustomer?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">All cleared!</div>
          <div className="empty-text">No pending balances. All customers are up to date.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.byCustomer.map((c: any) => (
            <div key={c.customerName} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{c.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.bills?.length} pending bill{c.bills?.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total Due</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>₹{c.totalDue.toFixed(2)}</div>
                  </div>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => sendWAReminder(c.customerName, c.totalDue)}
                    title="Send WhatsApp Reminder"
                    id={`wa-reminder-${c.customerName}`}
                  >
                    <MessageSquare size={14} /> WhatsApp Reminder
                  </button>
                </div>
              </div>

              {/* Bills breakdown */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                {c.bills?.map((b: any) => (
                  <div key={b._id} onClick={() => navigate(`/billing/${b._id}`)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.6rem 0', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => (e.currentTarget.style.paddingLeft = '8px')}
                    onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{b.billNumber}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        {new Date(b.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${b.paymentStatus === 'partial' ? 'status-partial' : 'status-pending'}`}>
                        {b.paymentStatus}
                      </span>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{b.balanceDue.toFixed(2)}</span>
                      <ArrowRight size={14} color="var(--text-dim)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BalancePending;

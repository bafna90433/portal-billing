import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Package, ChevronDown, ChevronRight, Search, Download, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface ProductDetail {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  qtyOrdered: number;
  qtyDispatched: number;
  qtyPending: number;
}

interface CustomerReport {
  customerName: string;
  totalOrders: number;
  products: ProductDetail[];
}

const CustomerAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'linear-gradient(135deg,#6366F1,#8B5CF6)',
    'linear-gradient(135deg,#06B6D4,#10B981)',
    'linear-gradient(135deg,#F59E0B,#EF4444)',
    'linear-gradient(135deg,#EF4444,#EC4899)',
    'linear-gradient(135deg,#10B981,#3B82F6)',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
      background: colors[idx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'white',
      boxShadow: '0 4px 12px -2px rgba(99,102,241,0.35)',
    }}>
      {initials}
    </div>
  );
};

const CustomerFulfillment: React.FC = () => {
  const [reports, setReports] = useState<CustomerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'partial' | 'pending'>('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/orders/reports/customer-fulfillment');
        setReports(data);
      } catch {
        toast.error('Failed to load customer reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const toggleExpand = (customerName: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      next.has(customerName) ? next.delete(customerName) : next.add(customerName);
      return next;
    });
  };

  const getCustomerStatus = (report: CustomerReport): 'complete' | 'partial' | 'pending' => {
    const sent = report.products.reduce((a, p) => a + p.qtyDispatched, 0);
    const pending = report.products.reduce((a, p) => a + p.qtyPending, 0);
    if (pending === 0) return 'complete';
    if (sent > 0) return 'partial';
    return 'pending';
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || getCustomerStatus(r) === filterStatus;
    return matchSearch && matchFilter;
  });

  const totalDispatched = reports.reduce((a, r) => a + r.products.reduce((b, p) => b + p.qtyDispatched, 0), 0);
  const totalPending = reports.reduce((a, r) => a + r.products.reduce((b, p) => b + p.qtyPending, 0), 0);
  const totalOrdered = totalDispatched + totalPending;
  const overallRate = totalOrdered > 0 ? Math.round((totalDispatched / totalOrdered) * 100) : 0;
  const completedCount = reports.filter(r => getCustomerStatus(r) === 'complete').length;

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Loading fulfillment data…</span>
    </div>
  );

  return (
    <div className="page-container">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px -6px rgba(99,102,241,0.5)',
          }}>
            <TrendingUp size={22} color="white" />
          </div>
          <div>
            <h1 className="page-title">Customer Fulfillment</h1>
            <p className="page-subtitle">Dispatched vs pending breakdown by customer</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-icon" title="Export Report">
          <Download size={17} />
        </button>
      </div>

      {/* ── Stats Grid ──────────────────────────────── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card" style={{ '--gradient': 'linear-gradient(135deg,#6366F1,#8B5CF6)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
            <Users size={20} />
          </div>
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Customers</div>
        </div>

        <div className="stat-card" style={{ '--gradient': 'linear-gradient(135deg,#10B981,#059669)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
            <Package size={20} />
          </div>
          <div className="stat-value">{totalDispatched.toLocaleString()}</div>
          <div className="stat-label">Units Dispatched</div>
        </div>

        <div className="stat-card" style={{ '--gradient': 'linear-gradient(135deg,#EF4444,#DC2626)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="stat-value">{totalPending.toLocaleString()}</div>
          <div className="stat-label">Units Pending</div>
        </div>

        <div className="stat-card" style={{ '--gradient': 'linear-gradient(135deg,#F59E0B,#D97706)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-value">{overallRate}%</div>
          <div className="stat-label">Fulfillment Rate</div>
          <div className="stat-change positive" style={{ marginTop: '0.5rem' }}>
            {completedCount}/{reports.length} completed
          </div>
        </div>
      </div>

      {/* ── Main Card ───────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap',
          background: 'var(--bg3)',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search customer…"
              className="form-control"
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem', height: 38 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {([
              { key: 'all', label: 'All' },
              { key: 'complete', label: 'Completed' },
              { key: 'partial', label: 'Partial' },
              { key: 'pending', label: 'Pending' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  padding: '0.3rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: filterStatus === f.key ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: filterStatus === f.key ? 'var(--primary-50)' : 'white',
                  color: filterStatus === f.key ? 'var(--primary-700)' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all var(--transition)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {filteredReports.length} customer{filteredReports.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 44, paddingRight: 0 }}></th>
                <th>Customer</th>
                <th style={{ textAlign: 'center' }}>Orders</th>
                <th style={{ textAlign: 'center' }}>Dispatched</th>
                <th style={{ textAlign: 'center' }}>Pending</th>
                <th style={{ width: 200 }}>Fulfillment</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => {
                const sent = report.products.reduce((a, p) => a + p.qtyDispatched, 0);
                const pend = report.products.reduce((a, p) => a + p.qtyPending, 0);
                const tot = sent + pend;
                const pct = tot > 0 ? Math.round((sent / tot) * 100) : 0;
                const status = getCustomerStatus(report);
                const isExpanded = expandedCustomers.has(report.customerName);

                const statusConfig = {
                  complete: { label: 'Completed', color: '#047857', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
                  partial:  { label: 'Partial',   color: '#1D4ED8', bg: 'rgba(59,130,246,0.1)', icon: <Clock size={12} /> },
                  pending:  { label: 'Pending',   color: '#B91C1C', bg: 'rgba(239,68,68,0.1)',  icon: <AlertCircle size={12} /> },
                }[status];

                return (
                  <React.Fragment key={report.customerName}>
                    <tr
                      onClick={() => toggleExpand(report.customerName)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ paddingRight: 0, color: 'var(--text-dim)' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <CustomerAvatar name={report.customerName} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>{report.customerName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                              {report.products.length} product{report.products.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-info">{report.totalOrders}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: '#047857', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{sent}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block' }}>units</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: pend > 0 ? '#B91C1C' : 'var(--text-dim)', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{pend}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', display: 'block' }}>units</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ flex: 1, height: 7, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: 99,
                              background: pct === 100
                                ? 'linear-gradient(90deg,#10B981,#059669)'
                                : pct > 0
                                  ? 'linear-gradient(90deg,#6366F1,#8B5CF6)'
                                  : 'var(--border)',
                              transition: 'width 0.5s var(--ease)',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 34, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.28rem 0.75rem', borderRadius: 'var(--radius-full)',
                          background: statusConfig.bg, color: statusConfig.color,
                          fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 0 0.5rem 0', background: '#F7F8FA' }}>
                          <div style={{ padding: '1rem 1.5rem 1.25rem 5.5rem' }}>
                            <div style={{
                              background: 'white',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border-soft)',
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-sm)',
                            }}>
                              {/* Sub-table header */}
                              <div style={{
                                padding: '0.7rem 1.15rem',
                                borderBottom: '1px solid var(--border-soft)',
                                background: 'linear-gradient(135deg,rgba(99,102,241,0.04),rgba(139,92,246,0.03))',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                              }}>
                                <Package size={14} color="var(--primary)" />
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  Product Breakdown
                                </span>
                              </div>

                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ background: 'var(--bg3)' }}>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>Product</th>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>SKU</th>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>Ordered</th>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>Dispatched</th>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>Pending</th>
                                    <th style={{ padding: '0.75rem 1.15rem', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)', width: 100 }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.products.map((product, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx < report.products.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                                      <td style={{ padding: '0.8rem 1.15rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                          {product.imageUrl ? (
                                            <img src={product.imageUrl} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-soft)' }} alt="" />
                                          ) : (
                                            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📦</div>
                                          )}
                                          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{product.productName}</span>
                                        </div>
                                      </td>
                                      <td style={{ padding: '0.8rem 1.15rem' }}>
                                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'var(--bg3)', padding: '0.15rem 0.45rem', borderRadius: 5, color: 'var(--text-muted)' }}>{product.sku}</code>
                                      </td>
                                      <td style={{ padding: '0.8rem 1.15rem', textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{product.qtyOrdered}</td>
                                      <td style={{ padding: '0.8rem 1.15rem', textAlign: 'center', color: '#047857', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{product.qtyDispatched}</td>
                                      <td style={{ padding: '0.8rem 1.15rem', textAlign: 'center', color: product.qtyPending > 0 ? '#B91C1C' : 'var(--text-dim)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{product.qtyPending}</td>
                                      <td style={{ padding: '0.8rem 1.15rem', textAlign: 'center' }}>
                                        {product.qtyPending === 0 ? (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', background: 'rgba(16,185,129,0.1)', padding: '0.22rem 0.65rem', borderRadius: 99 }}>
                                            <CheckCircle2 size={11} /> Done
                                          </span>
                                        ) : product.qtyDispatched > 0 ? (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', background: 'rgba(99,102,241,0.1)', padding: '0.22rem 0.65rem', borderRadius: 99 }}>
                                            <Clock size={11} /> Partial
                                          </span>
                                        ) : (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', background: 'rgba(239,68,68,0.1)', padding: '0.22rem 0.65rem', borderRadius: 99 }}>
                                            <AlertCircle size={11} /> Pending
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">📋</div>
                      <div className="empty-title">No records found</div>
                      <div className="empty-text">
                        {search ? `No customers matching "${search}"` : 'No fulfillment data available yet.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerFulfillment;

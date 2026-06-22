import React, { useState, useEffect } from 'react';
import { Receipt, Search, Eye, CheckCircle, Clock, Filter, X, RotateCcw, ChevronDown, ChevronUp, SlidersHorizontal, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const GeneratedBills: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab] = useState<'submitted' | 'pending'>('submitted');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [quickDate, setQuickDate] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | ''>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const { data } = await api.get('/billing');
        setBills(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const applyQuickDate = (range: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    setQuickDate(range);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (range === 'today') {
      const formatted = today.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (range === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const formatted = yesterday.toISOString().split('T')[0];
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (range === 'week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const formattedStart = lastWeek.toISOString().split('T')[0];
      const formattedEnd = today.toISOString().split('T')[0];
      setStartDate(formattedStart);
      setEndDate(formattedEnd);
    } else if (range === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const formattedStart = firstDayOfMonth.toISOString().split('T')[0];
      const formattedEnd = today.toISOString().split('T')[0];
      setStartDate(formattedStart);
      setEndDate(formattedEnd);
    }
  };

  const filteredBills = bills.filter(b => {
    // Apply search filter
    const matchesSearch = 
      b.billNumber?.toLowerCase().includes(search.toLowerCase()) || 
      b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.orderNumber?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Apply tab filter
    if (activeTab === 'submitted') {
      if (b.isSubmitted !== true) return false;
    }
    if (activeTab === 'pending') {
      if (b.isSubmitted === true) return false;
      const activeStatuses = ['dispatched', 'partial', 'packing_in_progress', 'packing_complete', 'waiting', 'checked'];
      if (!activeStatuses.includes(b.orderStatus)) return false;
    }

    // Apply Date Filters
    if (startDate || endDate) {
      const billDate = new Date(b.createdAt);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (billDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (billDate > end) return false;
      }
    }

    // Apply Amount Filters
    if (minAmount) {
      if ((b.totalAmount || 0) < Number(minAmount)) return false;
    }
    
    if (maxAmount) {
      if ((b.totalAmount || 0) > Number(maxAmount)) return false;
    }

    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Invoice Records</h1>
          <p className="page-subtitle">Manage and track your finalized invoice submissions and billing records.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="search-bar" style={{ width: 320 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by bill #, order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{ 
              padding: '0.625rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              borderColor: showFilters ? 'var(--primary)' : 'var(--border)',
              background: showFilters ? 'var(--primary-subtle)' : 'white',
              color: showFilters ? 'var(--primary)' : 'var(--text)'
            }}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Premium Collapsible Filters Panel */}
      {showFilters && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--primary-light)',
          boxShadow: 'var(--shadow-md)',
          animation: 'slideDown 0.3s var(--ease)',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <Filter size={18} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Advanced Search Filters</h3>
            </div>
            <button 
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setMinAmount('');
                setMaxAmount('');
                setQuickDate('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {/* Quick Select Ranges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={13} style={{ color: 'var(--primary)' }} /> Quick Date Range
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Last 7 days' },
                  { id: 'month', label: 'This Month' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => applyQuickDate(item.id as any)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: quickDate === item.id ? 'var(--primary)' : 'var(--border)',
                      background: quickDate === item.id ? 'var(--grad-primary)' : 'white',
                      color: quickDate === item.id ? 'white' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: quickDate === item.id ? 'var(--shadow-xs)' : 'none'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Start Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickDate('');
                }}
              />
            </div>

            {/* Custom End Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickDate('');
                }}
              />
            </div>

            {/* Min Amount */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Min Amount (₹)</label>
              <input
                type="number"
                placeholder="Min total..."
                className="form-control"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            {/* Max Amount */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Amount (₹)</label>
              <input
                type="number"
                placeholder="Max total..."
                className="form-control"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}



      {/* Active Filter Indicators */}
      {(search || startDate || endDate || minAmount || maxAmount) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '10px',
          border: '1px dashed var(--border)'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>Active Filters:</span>
          
          {search && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              Search: "{search}"
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
            </span>
          )}

          {startDate && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              From: {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setStartDate(''); setQuickDate(''); }} />
            </span>
          )}

          {endDate && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              To: {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setEndDate(''); setQuickDate(''); }} />
            </span>
          )}

          {minAmount && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--success)'
            }}>
              Min: ₹{Number(minAmount).toLocaleString('en-IN')}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setMinAmount('')} />
            </span>
          )}

          {maxAmount && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--success)'
            }}>
              Max: ₹{Number(maxAmount).toLocaleString('en-IN')}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => setMaxAmount('')} />
            </span>
          )}

          <button
            onClick={() => {
              setSearch('');
              setStartDate('');
              setEndDate('');
              setMinAmount('');
              setMaxAmount('');
              setQuickDate('');
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--danger)',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RotateCcw size={12} /> Clear All
          </button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading-page" style={{ minHeight: '350px' }}><div className="spinner"></div></div>
        ) : filteredBills.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            <Receipt size={56} className="empty-icon" style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.6 }} />
            <h3 className="empty-title">No records found</h3>
            <p className="empty-text">
              {activeTab === 'submitted' 
                ? 'No finalized invoice records found. Submit pending invoices to add them here.' 
                : activeTab === 'pending'
                  ? 'All generated invoices have been submitted and finalized.'
                  : 'Your generated billing history is empty.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Date Generated</th>
                  <th style={{ textAlign: 'center' }}>Record Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => (
                  <tr key={b._id} className="hover-row">
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{b.billNumber}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{b.orderNumber}</td>
                    <td style={{ fontWeight: 700 }}>{b.customerName}</td>
                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                      ₹{Math.round(b.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {b.isSubmitted ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          color: '#10B981', 
                          background: 'rgba(16,185,129,0.08)', 
                          border: '1px solid rgba(16,185,129,0.2)', 
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '20px' 
                        }}>
                          <CheckCircle size={12} /> Finalized
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          color: '#F59E0B', 
                          background: 'rgba(245,158,11,0.08)', 
                          border: '1px solid rgba(245,158,11,0.2)', 
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '20px' 
                        }}>
                          <Clock size={12} style={{ animation: 'pulse 2s infinite' }} /> Pending Submit
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700 }}
                        onClick={() => navigate(`/billing/${b._id}`)}
                      >
                        <Eye size={14} /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedBills;

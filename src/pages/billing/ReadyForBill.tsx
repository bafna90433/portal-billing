import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Receipt, Loader, CheckCircle, Package, Clock, AlertCircle, RefreshCw, Search } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../../store/notificationStore';
import OrderPreviewModal from '../../components/OrderPreviewModal';

const ReadyForBill: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [urgentModalNote, setUrgentModalNote] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // States related to Tally modal are removed

  const fetchReadyOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders in dispatched, partial, packing, packing_complete, checked, or hold status
      const { data } = await api.get('/orders?status=dispatched,partial,packing_in_progress,packing_complete,waiting,checked&limit=100&readyForBill=true');
      const fetchedOrders: any[] = data.orders || [];
      
      const filtered = fetchedOrders.filter((o: any) => {
        // If a bill has already been submitted/finalized, hide it
        if (o.billInfo && o.billInfo.isSubmitted) {
          return false;
        }
        // Always display packing, checked, or waiting (hold) orders so the bill is accessible
        if (o.status === 'packing_in_progress' || o.status === 'packing_complete' || o.status === 'waiting' || o.status === 'checked') {
          return true;
        }
        // For partial or fully dispatched orders, only show if they haven't been billed yet
        return !o.billInfo;
      });
      
      setOrders(filtered);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadyOrders(); }, [fetchReadyOrders]);

  const handleGenerateBill = async (order: any) => {
    const dispatchId = order.dispatchInfo?._id;
    if (!dispatchId) {
      setGeneratingId(order._id);
      try {
        const { data } = await api.post('/billing/draft', { orderId: order._id });
        toast.success('Bill generated from order details!');
        await fetchReadyOrders();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to generate bill');
      } finally {
        setGeneratingId(null);
      }
      return;
    }
    navigate(`/billing/create/${order._id}?dispatchId=${dispatchId}`);
  };

  const handlePrintViewClick = (order: any) => {
    navigate(`/billing/${order.billInfo._id}`);
  };

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(term) ||
      order.orderNumber?.toLowerCase().includes(term) ||
      order.billInfo?.billNumber?.toLowerCase().includes(term)
    );
  });

  const totalReady = filteredOrders.length;

  return (
    <div className="page-container">
      <style>{`
        @keyframes blink-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .blink-urgent {
          animation: blink-animation 0.6s infinite;
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Ready for Bill</h1>
          <p className="page-subtitle">Orders confirmed for dispatch — generate or print bills here</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ width: '280px', position: 'relative' }}>
            <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search customer or order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 1rem 0 2.5rem',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 650,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button className="btn btn-secondary" onClick={fetchReadyOrders} disabled={loading} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>
      </div>

      {/* Banner Message */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.15rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.06))',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 'var(--radius)',
        marginBottom: '1.75rem',
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 8px 20px -6px rgba(245,158,11,0.45)',
        }}>
          <Truck size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.015em' }}>
            Goods Ready for Dispatch — Please Generate Bill
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {totalReady === 0
               ? 'No orders waiting for billing right now.'
               : `${totalReady} order${totalReady > 1 ? 's' : ''} active and pending bill generation or printing.`}
          </div>
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          background: 'white',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 800,
          color: '#B45309',
          fontFamily: 'var(--font-mono)',
        }}>
          {totalReady} pending
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /><p>Loading orders...</p></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">{orders.length === 0 ? 'All caught up!' : 'No matches found'}</div>
          <div className="empty-text">
            {orders.length === 0 
              ? 'No orders are ready for billing at the moment.' 
              : 'Try adjusting your search term.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredOrders.map(order => {
            const dispatch = order.dispatchInfo || {};
            const itemCount = order.items?.length || 0;
            const totalQty = order.items?.reduce((s: number, i: any) => s + (i.qtyOrdered || 0), 0) || 0;
            const isGenerating = generatingId === order._id;

            return (
              <div key={order._id} className="card" style={{
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: order.status === 'waiting'
                  ? '4px solid #F59E0B'
                  : (order.status === 'packing_in_progress' || order.status === 'packing_complete')
                    ? '4px solid #6366F1'
                    : '4px solid var(--success)',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {order.orderNumber}
                      {order.isUrgent && (
                        <span className="blink-urgent" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: '1px 6px',
                          background: '#FEE2E2',
                          color: '#EF4444',
                          borderRadius: '4px',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                          🔴 URGENT
                        </span>
                      )}
                    </div>
                    {order.isUrgent && order.urgentNote && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUrgentModalNote(order.urgentNote);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.18)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          marginTop: '0.45rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#B91C1C',
                          cursor: 'pointer'
                        }}
                        title="Click to view urgent note"
                      >
                        🚨 View Urgent Note
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.2rem', letterSpacing: '-0.015em' }}>
                      {order.customerName}
                    </div>
                    {order.customerType && (
                      <span className="badge badge-secondary" style={{ marginTop: '0.35rem', textTransform: 'capitalize', fontSize: '0.65rem' }}>
                        {order.customerType}
                      </span>
                    )}
                  </div>
                  {order.status === 'waiting' ? (
                    <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245,158,11,0.15)', color: '#D97706' }}>
                      <Clock size={11} /> On Hold
                    </span>
                  ) : order.status === 'packing_in_progress' ? (
                    <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                      <Loader size={11} style={{ animation: 'spin 1.5s linear infinite' }} /> Packing
                    </span>
                  ) : order.status === 'packing_complete' ? (
                    <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                      <CheckCircle size={11} /> Packing Done
                    </span>
                  ) : order.status === 'partial' ? (
                    <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                      <Clock size={11} /> Partial Pending
                    </span>
                  ) : (
                    <span className="badge status-dispatched" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={11} /> Confirmed
                    </span>
                  )}
                </div>

                {/* Order details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Package size={14} />
                    <span>{itemCount} product{itemCount !== 1 ? 's' : ''} · {totalQty} qty total</span>
                  </div>
                  {dispatch.transportName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Truck size={14} />
                      <span>{dispatch.transportName}{dispatch.lrNumber ? ` · LR: ${dispatch.lrNumber}` : ''}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <Clock size={12} />
                      <span>Ordered: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {order.estimatedDeliveryDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>
                        <Clock size={12} />
                        <span>Est. Delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    {dispatch.dispatchedAt && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>
                          <Truck size={14} />
                          <span>Dispatched: {new Date(dispatch.dispatchedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(dispatch.dispatchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ marginLeft: '1.45rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          Duration: {(() => {
                            const diff = new Date(dispatch.dispatchedAt).getTime() - new Date(order.createdAt).getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            if (days === 0 && hours === 0) return 'less than an hour';
                            return `${days > 0 ? `${days}d ` : ''}${hours}h`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: '0 0 auto' }}
                    onClick={() => setPreviewId(order._id)}
                  >
                    View
                  </button>
                  {order.billInfo ? (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handlePrintViewClick(order)}
                    >
                      <Receipt size={15} /> Print / View Bill
                    </button>
                  ) : (
                    <button
                      className="btn btn-success"
                      style={{ flex: 1, justifyContent: 'center', opacity: (order.status === 'waiting') ? 0.6 : 1 }}
                      onClick={() => handleGenerateBill(order)}
                      disabled={isGenerating || order.status === 'waiting'}
                    >
                      {isGenerating ? (
                        <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                      ) : order.status === 'waiting' ? (
                        <><Clock size={15} /> Order on Hold</>
                      ) : (
                        <><Receipt size={15} /> Generate Bill</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderPreviewModal
        isOpen={!!previewId}
        orderId={previewId}
        onClose={() => setPreviewId(null)}
      />

      {/* Tally Modal removed - entered inside bill view instead */}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {urgentModalNote !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setUrgentModalNote(null)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '2px solid #FCA5A5',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#EF4444' }}>
              <AlertCircle size={20} />
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Urgent Order Note</h3>
            </div>
            <p style={{
              fontSize: '0.95rem',
              color: '#374151',
              lineHeight: '1.5',
              background: '#FEF2F2',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #FEE2E2',
              whiteSpace: 'pre-wrap',
              fontWeight: 600,
            }}>
              {urgentModalNote}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setUrgentModalNote(null)}
                style={{ padding: '0.4rem 1.25rem', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadyForBill;

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Receipt, Loader, CheckCircle, Package, Clock, AlertCircle, RefreshCw } from 'lucide-react';
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

  const fetchReadyOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Confirmed for dispatch — status 'dispatched' or 'partial', without a bill yet
      const { data } = await api.get('/orders?status=dispatched&limit=100');
      const dispatched: any[] = data.orders || [];
      setOrders(dispatched.filter((o: any) => !o.billInfo));
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadyOrders(); }, [fetchReadyOrders]);

  const handleGenerateBill = (order: any) => {
    const dispatchId = order.dispatchInfo?._id;
    if (!dispatchId) {
      toast.error('No dispatch found for this order.');
      return;
    }
    navigate(`/billing/create/${order._id}?dispatchId=${dispatchId}`);
  };

  const totalReady = orders.length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ready for Bill</h1>
          <p className="page-subtitle">Orders confirmed for dispatch — generate bills here</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchReadyOrders} disabled={loading}>
          <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
        </button>
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
              : `${totalReady} order${totalReady > 1 ? 's' : ''} confirmed for dispatch and pending bill generation.`}
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
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">All caught up!</div>
          <div className="empty-text">No orders are ready for billing at the moment.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {orders.map(order => {
            const dispatch = order.dispatchInfo || {};
            const itemCount = order.items?.length || 0;
            const totalQty = order.items?.reduce((s: number, i: any) => s + (i.qtyOrdered || 0), 0) || 0;
            const isGenerating = generatingId === order._id;

            return (
              <div key={order._id} className="card" style={{
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: '4px solid var(--warning)',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                      {order.orderNumber}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.2rem', letterSpacing: '-0.015em' }}>
                      {order.customerName}
                    </div>
                    {order.customerType && (
                      <span className="badge badge-secondary" style={{ marginTop: '0.35rem', textTransform: 'capitalize', fontSize: '0.65rem' }}>
                        {order.customerType}
                      </span>
                    )}
                  </div>
                  {order.status === 'partial' ? (
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
                  <button
                    className="btn btn-success"
                    style={{ flex: 1, justifyContent: 'center', opacity: order.status === 'partial' ? 0.6 : 1 }}
                    onClick={() => handleGenerateBill(order)}
                    disabled={isGenerating || !dispatch._id || order.status === 'partial'}
                  >
                    {isGenerating
                      ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                      : order.status === 'partial' ? <><Clock size={15} /> Waiting for Stock</> : <><Receipt size={15} /> Generate Bill</>}
                  </button>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ReadyForBill;

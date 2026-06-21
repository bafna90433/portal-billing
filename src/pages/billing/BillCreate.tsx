import React, { useState, useEffect } from 'react';
import { Receipt, ArrowRight, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../../store/notificationStore';

const BillCreate: React.FC = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [dispatch, setDispatch] = useState<any>(null);
  const [resolvedDispatchId, setResolvedDispatchId] = useState<string | null>(null);
  const [alreadyBilled, setAlreadyBilled] = useState(false);
  const [tallyBillNumber, setTallyBillNumber] = useState('');
  const [urgentModalNote, setUrgentModalNote] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orderRes, allDispatchRes] = await Promise.all([
          api.get(`/orders/${orderId}`),
          api.get(`/dispatch`),
        ]);
        const fetchedOrder = orderRes.data;
        setOrder(fetchedOrder);

        // Check if already billed
        if (['billed', 'checked', 'dispatched', 'paid'].includes(fetchedOrder.status)) {
          setAlreadyBilled(true);
        }

        // Resolve dispatchId from URL param or find latest dispatch for this order
        const urlDispatchId = searchParams.get('dispatchId');
        if (urlDispatchId) {
          setResolvedDispatchId(urlDispatchId);
          const d = allDispatchRes.data.find((d: any) => d._id === urlDispatchId);
          if (d) setDispatch(d);
        } else {
          // Find latest dispatch for this order
          const dispatches = allDispatchRes.data.filter((d: any) => d.orderId === orderId);
          if (dispatches.length > 0) {
            const latest = dispatches.sort((a: any, b: any) =>
              new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime()
            )[0];
            setResolvedDispatchId(latest._id);
            setDispatch(latest);
          }
        }
      } catch {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const handleCreate = async () => {
    if (!resolvedDispatchId) return toast.error('No dispatch found for this order. Dispatch the order first.');
    setCreating(true);
    try {
      const { data } = await api.post('/billing', { 
        orderId, 
        dispatchId: resolvedDispatchId,
        tallyBillNumber 
      });
      toast.success(`Bill ${data.billNumber} created!`);
      addNotification({
        type: 'success',
        title: 'Invoice Generated',
        message: `${data.billNumber} created for ${order?.customerName}`,
      });
      navigate(`/billing/${data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally { setCreating(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!order) return <div className="empty-state"><div className="empty-icon">❌</div><div className="empty-title">Order not found</div></div>;

  return (
    <div className="page-container" style={{ maxWidth: 600, margin: '0 auto' }}>
      <style>{`
        @keyframes blink-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .blink-urgent {
          animation: blink-animation 0.6s infinite;
        }
      `}</style>
      <div className="page-header">
        <div>
          <h1 className="page-title">Generate Bill</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>Order {order.orderNumber}</span>
            {order.isUrgent && (
              <span className="blink-urgent" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '1px 6px',
                background: '#FEE2E2',
                color: '#EF4444',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 800,
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                🔴 URGENT
              </span>
            )}
            {order.isUrgent && order.urgentNote && (
              <span
                onClick={() => setUrgentModalNote(order.urgentNote)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  border: '1px solid rgba(239,68,68,0.18)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Click to view urgent note"
              >
                🚨 View Urgent Note
              </span>
            )}
            <span>{" — "}{order.customerName}</span>
          </p>
        </div>
      </div>

      {alreadyBilled && (
        <div style={{ background: 'rgba(253,203,110,0.1)', border: '1px solid rgba(253,203,110,0.3)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} color="var(--accent)" />
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>This order has already been billed. Creating another bill will create a duplicate.</span>
        </div>
      )}

      {!resolvedDispatchId && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} color="var(--danger)" />
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>No dispatch found. Please dispatch the order first before generating a bill.</span>
        </div>
      )}

      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧾</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Ready to Generate Bill</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            This will create an invoice for <strong style={{ color: 'var(--text)' }}>{order.customerName}</strong> based on the dispatched items.
          </p>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{order.orderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer</span>
              <span style={{ fontWeight: 700 }}>{order.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items</span>
              <span style={{ fontWeight: 700 }}>{order.items?.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dispatch</span>
              <span style={{ fontWeight: 700, color: resolvedDispatchId ? 'var(--success)' : 'var(--danger)' }}>
                {resolvedDispatchId ? (
                  <><CheckCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Found</>
                ) : '⚠ Not dispatched'}
              </span>
            </div>
            {dispatch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Order Created</span>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Dispatched On</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10B981' }}>
                    {new Date(dispatch.dispatchedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(dispatch.dispatchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', padding: '0.4rem 0.6rem', background: 'rgba(16,185,129,0.05)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Processing Duration</span>
                  <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.85rem' }}>
                    {(() => {
                      const diff = new Date(dispatch.dispatchedAt).getTime() - new Date(order.createdAt).getTime();
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      if (days === 0 && hours === 0) return 'less than an hour';
                      return `${days > 0 ? `${days}d ` : ''}${hours}h`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tally Bill Number Input */}
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'block' }}>
              📑 Enter Tally Bill Number (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. TALLY-1002"
              value={tallyBillNumber}
              onChange={(e) => setTallyBillNumber(e.target.value)}
              style={{ width: '100%', height: 42 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button
              className="btn btn-success btn-lg"
              onClick={handleCreate}
              disabled={creating || !resolvedDispatchId}
              style={{ justifyContent: 'center' }}
              id="create-bill-btn"
            >
              {creating ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Receipt size={18} /> Generate Bill <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BillCreate;

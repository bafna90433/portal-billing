import React, { useEffect, useState } from 'react';
import { X, Clock, User, Info, CheckCircle, Package, Truck, Receipt, DollarSign, XCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Edit2, Trash2 } from 'lucide-react';

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({ isOpen, onClose, orderId }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<{ isOpen: boolean, action: 'cancel' | 'delete' | null }>({ isOpen: false, action: null });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const isDispatchPortal = window.location.pathname.startsWith('/dispatch');
  const showPrice = !isDispatchPortal && (user?.role === 'admin' || user?.role === 'sale_staff' || user?.role === 'salesman');

  const [bill, setBill] = useState<any>(null);
  const [viewInvoice, setViewInvoice] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      setBill(null);
      setViewInvoice(false);
      api.get(`/orders/${orderId}`)
        .then(res => {
          setOrder(res.data);
          if (res.data.status === 'billed' || res.data.status === 'paid') {
             api.get(`/billing?search=${res.data.orderNumber}`)
               .then(bRes => {
                 if (bRes.data && bRes.data.length > 0) {
                   setBill(bRes.data[0]);
                 }
               })
               .catch(err => console.error(err));
          }
          // Mark as seen
          api.patch(`/orders/${orderId}/mark-seen`).catch(e => console.error(e));
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, orderId]);

  const handleEdit = () => {
    if (!order) return;
    onClose();
    navigate(`/sale-staff/edit-order/${order._id}`);
  };

  const handleCancel = () => {
    if (!order) return;
    setPasswordPrompt({ isOpen: true, action: 'cancel' });
    setPasswordInput('');
    setPasswordError('');
  };

  const handleDelete = () => {
    if (!order) return;
    setPasswordPrompt({ isOpen: true, action: 'delete' });
    setPasswordInput('');
    setPasswordError('');
  };

  const executeCancel = async () => {
    setProcessing(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      toast.success('Order cancelled and stock reverted');
      onClose();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
      setPasswordPrompt({ isOpen: false, action: null });
    }
  };

  const executeDelete = async () => {
    setProcessing(true);
    try {
      await api.delete(`/orders/${order._id}`);
      toast.success('Order deleted');
      onClose();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setProcessing(false);
      setPasswordPrompt({ isOpen: false, action: null });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput !== 'admin123') {
      setPasswordError('Incorrect password');
      return;
    }
    
    if (passwordPrompt.action === 'cancel') {
      executeCancel();
    } else if (passwordPrompt.action === 'delete') {
      executeDelete();
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'var(--warning)';
      case 'dispatched': return 'var(--info)';
      case 'billed': return 'var(--primary)';
      case 'paid': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Created')) return <Package size={14} />;
    if (action.includes('Dispatched')) return <Truck size={14} />;
    if (action.includes('Generated')) return <Receipt size={14} />;
    if (action.includes('Payment')) return <CheckCircle size={14} />;
    return <Info size={14} />;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', zIndex: 1000, padding: '2rem' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', width: '100%', height: '100%', maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
        <div className="modal-header">
          <h2 className="modal-title">Order Preview</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div className="loading-page" style={{ flex: 1 }}><div className="spinner"></div></div>
        ) : order ? (
          <div className="modal-body" style={{ overflowY: 'auto', padding: '2rem', background: 'var(--bg)', flex: 1 }}>
            
            {/* Premium Header (Light) */}
            <div style={{ 
              background: '#ffffff', 
              borderRadius: 16, 
              padding: '1.5rem 2rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                
                {/* Left: Order Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--text-dark)' }}>{order.orderNumber}</h2>
                    <span style={{ background: getStatusColor(order.status), color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {order.status === 'dispatched' ? 'READY TO DISPATCH' : order.status}
                    </span>
                    {bill && (
                      <button 
                        onClick={() => setViewInvoice(!viewInvoice)} 
                        className={`btn ${viewInvoice ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', gap: '0.35rem', borderRadius: 6, fontWeight: 700, marginLeft: '0.5rem' }}
                      >
                        <Receipt size={14} /> {viewInvoice ? 'View Order' : 'View Invoice'}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} /> Created: {new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {order.receivedAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={14} style={{ color: '#6366F1' }} /> Received: <strong style={{ color: 'var(--text-dark)' }}>{new Date(order.receivedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><User size={14} /> Salesman: <strong style={{ color: 'var(--text-dark)' }}>{order.salesmanName}</strong></span>
                  </div>
                </div>

                {/* Right: Amount */}
                {showPrice && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Amount</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                      {order.totalAmount ? `₹${order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : <span style={{ color: 'var(--text-dim)' }}>Pending</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Box */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Customer Details</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {order.customerName}
                      {order.customerType && <span style={{ background: 'var(--bg3)', color: 'var(--text-dark)', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', textTransform: 'uppercase', border: '1px solid var(--border)' }}>{order.customerType}</span>}
                    </div>
                  </div>
                  {order.customerAddress?.city && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Location</div>
                      <div style={{ color: 'var(--text-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>📍 {order.customerAddress.city}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions for Sales Staff / Admin */}
            {((user?.role as string) === 'sale_staff' || (user?.role as string) === 'admin') && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['pending', 'waiting', 'rejected'].includes(order.status) && (user?.role === 'sale_staff' || user?.role === 'salesman') && (
                  <button onClick={handleEdit} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <Edit2 size={16} /> Edit & Resubmit
                  </button>
                )}
                {['pending', 'waiting', 'partial'].includes(order.status) && (
                  <button onClick={handleCancel} disabled={processing} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <XCircle size={16} /> {processing ? 'Processing...' : 'Cancel Order'}
                  </button>
                )}
                {order.status === 'pending' && (
                  <button onClick={handleDelete} disabled={processing} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, background: 'transparent', color: 'var(--text-muted)' }}>
                    <Trash2 size={15} /> Delete Permanently
                  </button>
                )}
              </div>
            )}

            {/* Rejection Reason (If any) */}
            {order.status === 'rejected' && order.rejectionReason && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: 12, 
                padding: '1rem 1.25rem', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#EF4444" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Rejection Reason</div>
                  <div style={{ color: 'var(--text-dark)', fontSize: '0.9rem', lineHeight: 1.5 }}>{order.rejectionReason}</div>
                </div>
              </div>
            )}

            {/* Order Image */}
            {order.paperOrderImageUrl && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Order Image</h3>
                  <button 
                    onClick={() => setShowImage(!showImage)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                  >
                    <ImageIcon size={14} />
                    {showImage ? 'Hide Image' : 'View Order Image'}
                  </button>
                </div>
                
                {showImage && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#f8f8f8', marginTop: '1rem', position: 'relative' }}>
                    <img
                      src={order.paperOrderImageUrl}
                      alt="Order"
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', cursor: 'zoom-in' }}
                      onClick={() => window.open(order.paperOrderImageUrl, '_blank')}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', pointerEvents: 'none' }}>
                      Click to enlarge
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewInvoice && bill ? (
              <div className="invoice-wrapper" style={{ maxWidth: 'none', margin: '0 0 2rem 0' }}>
                <div className="invoice-card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  {/* Rainbow top bar */}
                  <div className="invoice-top-bar" />

                  {/* Header: brand + invoice number */}
                  <div className="invoice-header">
                    <div>
                      <div className="invoice-brand-name">Stock<span>Pro</span></div>
                      <div className="invoice-brand-sub">Stock Management System</div>
                      <div className="invoice-brand-address">
                        123 Business Park, Industrial Area<br />
                        GSTIN: 27AAAAA0000A1Z5
                      </div>
                    </div>
                    <div className="invoice-title-block">
                      <span className="invoice-label">Tax Invoice</span>
                      <div className="invoice-number">{bill.billNumber}</div>
                      <div className="invoice-date">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        {(() => {
                          const sc = bill.paymentStatus === 'paid' 
                            ? { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Paid' }
                            : bill.paymentStatus === 'partial'
                            ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Partially Paid' }
                            : { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'Payment Pending' };
                          return (
                            <span
                              className="invoice-status-badge"
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                            >
                              {bill.paymentStatus === 'paid' && <CheckCircle size={13} />}
                              {sc.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Bill To / Order Info */}
                  <div className="invoice-meta">
                    <div className="invoice-meta-cell">
                      <div className="invoice-meta-label">Bill To</div>
                      <div className="invoice-meta-value">{bill.customerName}</div>
                      {order.customerAddress && (
                        <div className="invoice-meta-sub" style={{ lineHeight: 1.6, marginTop: '0.25rem' }}>
                          {order.customerAddress.area && <div>{order.customerAddress.area}</div>}
                          {(order.customerAddress.city || order.customerAddress.pinCode) && (
                            <div>{[order.customerAddress.city, order.customerAddress.pinCode].filter(Boolean).join(' - ')}</div>
                          )}
                        </div>
                      )}
                      <div className="invoice-meta-sub" style={{ marginTop: '0.3rem' }}>
                        <span style={{ marginRight: '0.75rem' }}>Order: <strong>{bill.orderNumber}</strong></span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem 1rem', marginTop: '0.5rem' }}>
                        {order.salesmanName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Salesman: </span>
                            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{order.salesmanName}</span>
                          </div>
                        )}
                        {order.customerType && (
                          <div style={{ fontSize: '0.75rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '1px 8px',
                                borderRadius: 20,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                textTransform: 'capitalize',
                                background: order.customerType === 'retailer'
                                  ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                                color: order.customerType === 'retailer' ? '#6366F1' : '#10B981',
                                border: `1px solid ${order.customerType === 'retailer' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                              }}
                            >
                              {order.customerType === 'retailer' ? '🏪 Retailer' : '🏭 Wholesaler'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="invoice-meta-cell" style={{ textAlign: 'right' }}>
                      <div className="invoice-meta-label">Amount Due</div>
                      <div className="invoice-meta-value" style={{ color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.4rem' }}>
                        ₹{bill.balanceDue?.toFixed(2)}
                      </div>
                      <div className="invoice-meta-sub">
                        of ₹{bill.totalAmount?.toFixed(2)} total
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="invoice-body">
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>#</th>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Packaging</th>
                          <th style={{ textAlign: 'center' }}>Qty (Pcs)</th>
                          <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                          <th style={{ textAlign: 'center' }}>Discount</th>
                          <th style={{ textAlign: 'center' }}>GST %</th>
                          <th style={{ textAlign: 'right' }}>GST (₹)</th>
                          <th style={{ textAlign: 'right' }}>Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.items?.map((item: any, i: number) => {
                          const parts: string[] = [];
                          if (item.cartonQty > 0) parts.push(`${item.cartonQty} CTN`);
                          if (item.innerQty > 0) parts.push(`${item.innerQty} INR`);
                          if (item.looseQty > 0) parts.push(`${item.looseQty} PCS`);
                          const packagingLabel = parts.length > 0 ? parts.join(' + ') : (item.unit || 'Pcs');
                          return (
                            <tr key={i}>
                              <td style={{ color: 'var(--text-dim)', fontWeight: 500 }}>{i + 1}</td>
                              <td style={{ fontWeight: 600 }}>{item.productName}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.sku}</td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'var(--primary-light)',
                                  background: 'rgba(99,102,241,0.08)',
                                  border: '1px solid rgba(99,102,241,0.2)',
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {packagingLabel}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                              <td style={{ textAlign: 'right' }}>₹{item.pricePerUnit?.toFixed(2)}</td>
                              <td style={{ textAlign: 'center', color: (item.discountValue || 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                {(item.discountValue || 0) > 0 ? (item.discountType === 'flat' ? `₹${item.discountValue} Off` : `${item.discountValue}% Off`) : '—'}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.gstRate}%</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{item.gstAmount?.toFixed(2)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.totalAmount?.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="invoice-totals">
                      <div className="invoice-totals-box">
                        <div className="invoice-total-row">
                          <span className="label">Subtotal</span>
                          <span className="amount">₹{bill.subtotal?.toFixed(2)}</span>
                        </div>
                        {bill.totalDiscount > 0 && (
                          <div className="invoice-total-row" style={{ color: 'var(--success)' }}>
                            <span className="label">Total Discount</span>
                            <span className="amount" style={{ fontWeight: 700 }}>-₹{bill.totalDiscount?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="invoice-total-row">
                          <span className="label">GST</span>
                          <span className="amount">₹{bill.totalGst?.toFixed(2)}</span>
                        </div>
                        <div className="invoice-total-row grand">
                          <span>Grand Total</span>
                          <span className="amount">₹{bill.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div className="invoice-total-row" style={{ marginTop: '0.5rem' }}>
                          <span className="label" style={{ color: 'var(--success)' }}>Paid</span>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{(bill.paidAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="invoice-total-row">
                          <span style={{ color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                            {bill.balanceDue > 0 ? 'Balance Due' : 'Fully Paid'}
                          </span>
                          <span style={{
                            color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)',
                            fontWeight: 800, fontSize: '1.05rem',
                          }}>
                            ₹{bill.balanceDue?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="invoice-footer">
                    <div>
                      <div className="invoice-footer-thank">Thank you for your business!</div>
                      <div className="invoice-footer-note">Payment due within 30 days. For queries, contact billing.</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <div>Generated by StockPro</div>
                      <div>{new Date(bill.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Order Items</h3>
                <div className="table-wrapper" style={{ marginBottom: '2rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Packaging (CTN/INR/PCS)</th>
                        <th>Ordered Qty</th>
                        <th>Dispatched Qty</th>
                        <th>Pending Breakdown</th>
                        <th>Current Stock</th>
                        {showPrice && <th>Price</th>}
                        {showPrice && <th>Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item: any, i: number) => (
                        <tr key={i}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                            )}
                            <span style={{ fontWeight: 600 }}>{item.productName}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.sku}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {item.cartonQty ? <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600 }}>{item.cartonQty} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>CTN</span></span> : null}
                              {item.innerQty ? <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600 }}>{item.innerQty} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>INR</span></span> : null}
                              {item.looseQty ? <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600 }}>{item.looseQty} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>PCS</span></span> : null}
                              {(!item.cartonQty && !item.innerQty && !item.looseQty) && (
                                <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', fontWeight: 600 }}>{item.qtyOrdered} <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>PCS</span></span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{item.qtyOrdered} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PCS</span></td>
                          <td style={{ fontWeight: 700, color: item.qtyDispatched >= item.qtyOrdered ? 'var(--success)' : 'var(--warning)' }}>
                            {item.qtyDispatched || 0} <span style={{ fontSize: '0.7rem' }}>PCS</span>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {item.qtyOrdered > (item.qtyDispatched || 0) ? (
                              <div>
                                {(() => {
                                  const pending = item.qtyOrdered - (item.qtyDispatched || 0);
                                  const totalInCarton = (item.innerPerCarton || 1) * (item.pcsPerInner || 1);
                                  const ctn = Math.floor(pending / totalInCarton);
                                  let rem = pending % totalInCarton;
                                  const inr = Math.floor(rem / (item.pcsPerInner || 1));
                                  const lse = rem % (item.pcsPerInner || 1);
                                  
                                  const parts = [];
                                  if (ctn > 0) parts.push({ val: ctn, unit: 'CTN' });
                                  if (inr > 0) parts.push({ val: inr, unit: 'INR' });
                                  if (lse > 0) parts.push({ val: lse, unit: 'PCS' });
                                  if (parts.length === 0) parts.push({ val: pending, unit: 'PCS' });
                                  
                                  return (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontWeight: 700 }}>
                                      {parts.map((p, idx) => (
                                        <span key={idx} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                          {p.val} <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{p.unit}</span>
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--success)', fontWeight: 700 }}>FULLY DISPATCHED</span>
                            )}
                          </td>
                          <td>
                            {item.currentStock > 0 ? (
                              <div>
                                {(() => {
                                  const stk = item.currentStock;
                                  const totalInCarton = (item.innerPerCarton || 1) * (item.pcsPerInner || 1);
                                  const ctn = Math.floor(stk / totalInCarton);
                                  let rem = stk % totalInCarton;
                                  const inr = Math.floor(rem / (item.pcsPerInner || 1));
                                  const lse = rem % (item.pcsPerInner || 1);
                                  
                                  const parts = [];
                                  if (ctn > 0) parts.push({ val: ctn, unit: 'CTN' });
                                  if (inr > 0) parts.push({ val: inr, unit: 'INR' });
                                  if (lse > 0) parts.push({ val: lse, unit: 'PCS' });
                                  if (parts.length === 0) parts.push({ val: stk, unit: 'PCS' });
                                  
                                  return (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontWeight: 700 }}>
                                      {parts.map((p, idx) => (
                                        <span key={idx} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                          {p.val} <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{p.unit}</span>
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                                <XCircle size={12} /> Out of Stock
                              </div>
                            )}
                          </td>
                          {showPrice && (
                            <td style={{ fontWeight: 600 }}>
                              <div>₹{(item.pricePerUnit || 0).toLocaleString('en-IN')}</div>
                              {item.discountValue > 0 && (
                                <div style={{ fontSize: '0.6rem', color: 'var(--danger)', fontWeight: 700 }}>
                                  ({item.discountType === 'percentage' ? `${item.discountValue}%` : `₹${item.discountValue}`} Off)
                                </div>
                              )}
                            </td>
                          )}
                          {showPrice && (
                            <td style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>
                              ₹{((item.qtyOrdered || 0) * (item.pricePerUnit || 0)).toLocaleString('en-IN')}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>History Timeline</h3>
                <div className="card" style={{ padding: '1.5rem', margin: 0 }}>
                  {order.history && order.history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {order.history.map((event: any, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', zIndex: 2 }}>
                              <Clock size={16} />
                            </div>
                            {i !== order.history.length - 1 && <div style={{ width: '2px', height: '100%', background: 'var(--border)', flex: 1, margin: '4px 0' }}></div>}
                          </div>
                          <div style={{ paddingBottom: i !== order.history.length - 1 ? '1.5rem' : '0' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{event.action}</div>
                            {event.details && (
                              <div style={{ 
                                marginTop: '0.5rem', 
                                padding: '0.75rem', 
                                background: 'var(--bg3)', 
                                borderRadius: '6px', 
                                fontSize: '0.82rem', 
                                color: 'var(--text)', 
                                whiteSpace: 'pre-line',
                                border: '1px solid var(--border)'
                              }}>
                                {event.details}
                              </div>
                            )}
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <Clock size={12} /> {new Date(event.timestamp).toLocaleString('en-IN')} 
                              <span style={{ color: 'var(--border)' }}>•</span> 
                              <User size={12} /> {event.by} ({event.role})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No history available for this order.</div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load order details.</div>
        )}
      </div>

      {/* Password Prompt Popup */}
      {passwordPrompt.isOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
          <div style={{ background: 'var(--bg)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
              <XCircle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                {passwordPrompt.action === 'cancel' ? 'Cancel Order' : 'Delete Order'}
              </h3>
            </div>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Please enter the admin password to confirm this action. {passwordPrompt.action === 'delete' && 'This cannot be undone.'}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${passwordError ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none', background: 'var(--bg2)', color: 'var(--text-dark)' }}
                />
                {passwordError && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>{passwordError}</div>}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPasswordPrompt({ isOpen: false, action: null })} disabled={processing}>
                  Go Back
                </button>
                <button type="submit" className="btn" style={{ background: 'var(--danger)', color: 'white', minWidth: '100px', justifyContent: 'center' }} disabled={processing || !passwordInput}>
                  {processing ? 'Wait...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPreviewModal;

import React, { useState, useEffect } from 'react';
import { Printer, Plus, CheckCircle, Loader, ArrowLeft, MessageCircle, IndianRupee, FileText, ZoomIn, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useNotificationStore } from '../../store/notificationStore';

const BillView: React.FC = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [bill, setBill] = useState<any>(null);
  const [customerAddress, setCustomerAddress] = useState<any>(null);
  const [orderExtra, setOrderExtra] = useState<any>(null);
  const [dispatchItems, setDispatchItems] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [paperImageUrl, setPaperImageUrl] = useState<string | null>(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchBill = async () => {
    try {
      const { data } = await api.get(`/billing/${billId}`);
      setBill(data);

      if (data.orderId) {
        // Try source 1: paperOrderImageUrl stored on the Order document
        try {
          const [orderRes, dispatchRes] = await Promise.allSettled([
            api.get(`/orders/${data.orderId}`),
            data.dispatchId ? api.get(`/dispatch/${data.dispatchId}`) : Promise.reject('no dispatch'),
          ]);

          const order = orderRes.status === 'fulfilled' ? orderRes.value.data : null;
          const dispatch = dispatchRes.status === 'fulfilled' ? dispatchRes.value.data : null;

          if (order?.customerAddress) setCustomerAddress(order.customerAddress);
          if (order?.items?.length) setOrderItems(order.items);
          if (dispatch?.items?.length) setDispatchItems(dispatch.items);
          setOrderExtra({
            salesmanName: order?.salesmanName || null,
            customerType: order?.customerType || null,
            transportName: dispatch?.transportName || null,
            lrNumber: dispatch?.lrNumber || null,
          });

          if (order?.paperOrderImageUrl) {
            setPaperImageUrl(order.paperOrderImageUrl);
            return;
          }
        } catch { /* continue to fallback */ }

        // Try source 2: look up the PaperOrder linked to this order
        try {
          const { data: paperOrders } = await api.get(`/paper-orders?linkedOrderId=${data.orderId}`);
          if (Array.isArray(paperOrders) && paperOrders.length > 0 && paperOrders[0].imageUrl) {
            setPaperImageUrl(paperOrders[0].imageUrl);
          }
        } catch { /* no paper order — that's fine */ }
      }
    } catch {
      toast.error('Bill not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBill(); }, [billId]);

  const handlePrint = () => window.print();

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return toast.error('Enter valid amount');
    setPaying(true);
    try {
      const { data } = await api.patch(`/billing/${billId}/payment`, {
        amount: Number(payAmount),
        method: payMethod,
        note: payNote,
      });
      setBill(data);
      setPayModal(false);
      setPayAmount('');
      toast.success('Payment recorded!');
      addNotification({
        type: 'success',
        title: 'Payment Recorded',
        message: `₹${Number(payAmount).toLocaleString('en-IN')} received from ${data.customerName} via ${payMethod}`,
      });
    } catch {
      toast.error('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    paid:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Paid' },
    partial: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Partially Paid' },
    pending: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  label: 'Payment Pending' },
  };

  const sc = bill ? (statusConfig[bill.paymentStatus] ?? statusConfig.pending) : statusConfig.pending;

  const methodIcons: Record<string, string> = { cash: '💵', upi: '📱', bank: '🏦', cheque: '📋' };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!bill) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <div className="empty-title">Bill not found</div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Action toolbar */}
      <div className="page-header no-print">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {bill.paymentStatus !== 'paid' && (
            <button className="btn btn-success" onClick={() => setPayModal(true)} id="record-payment-btn">
              <Plus size={16} /> Record Payment
            </button>
          )}
          <button className="btn btn-secondary" onClick={handlePrint} id="print-bill-btn">
            <Printer size={16} /> Print
          </button>
          <button
            className="btn btn-secondary"
            style={{ color: '#16A34A', borderColor: '#BBF7D0' }}
            onClick={() => {
              const msg = `*Invoice ${bill.billNumber}*\nCustomer: ${bill.customerName}\nOrder: ${bill.orderNumber}\nTotal: ₹${bill.totalAmount.toFixed(2)}\nPaid: ₹${bill.paidAmount.toFixed(2)}\nBalance: ₹${bill.balanceDue.toFixed(2)}\nStatus: ${sc.label}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            id="wa-bill-btn"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Main layout: invoice + optional paper reference panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: paperImageUrl ? '1fr 300px' : '1fr',
        gap: '1.5rem',
        alignItems: 'flex-start',
        maxWidth: paperImageUrl ? '1160px' : '820px',
        margin: '0 auto',
      }}>

      {/* Invoice Card */}
      <div className="invoice-wrapper" style={{ maxWidth: 'none' }}>
        <div className="invoice-card">
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
                <span
                  className="invoice-status-badge"
                  style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                >
                  {bill.paymentStatus === 'paid' && <CheckCircle size={13} />}
                  {sc.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To / Order Info */}
          <div className="invoice-meta">
            <div className="invoice-meta-cell">
              <div className="invoice-meta-label">Bill To</div>
              <div className="invoice-meta-value">{bill.customerName}</div>
              {customerAddress && (customerAddress.area || customerAddress.city || customerAddress.state) && (
                <div className="invoice-meta-sub" style={{ lineHeight: 1.6, marginTop: '0.25rem' }}>
                  {customerAddress.area && <div>{customerAddress.area}</div>}
                  {(customerAddress.city || customerAddress.pinCode) && (
                    <div>{[customerAddress.city, customerAddress.pinCode].filter(Boolean).join(' - ')}</div>
                  )}
                  {(customerAddress.state || customerAddress.country) && (
                    <div>{[customerAddress.state, customerAddress.country].filter(Boolean).join(', ')}</div>
                  )}
                </div>
              )}
              <div className="invoice-meta-sub" style={{ marginTop: '0.3rem' }}>
                <span style={{ marginRight: '0.75rem' }}>Order: <strong>{bill.orderNumber}</strong></span>
              </div>
              {/* Extra order info row */}
              {orderExtra && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem 1rem', marginTop: '0.5rem' }}>
                  {orderExtra.salesmanName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Salesman: </span>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{orderExtra.salesmanName}</span>
                    </div>
                  )}
                  {orderExtra.customerType && (
                    <div style={{ fontSize: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '1px 8px',
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                          background: orderExtra.customerType === 'retailer'
                            ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                          color: orderExtra.customerType === 'retailer' ? '#6366F1' : '#10B981',
                          border: `1px solid ${orderExtra.customerType === 'retailer' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        }}
                      >
                        {orderExtra.customerType === 'retailer' ? '🏪 Retailer' : '🏭 Wholesaler'}
                      </span>
                    </div>
                  )}
                  {orderExtra.transportName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Transport: </span>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{orderExtra.transportName}</span>
                    </div>
                  )}
                  {orderExtra.lrNumber && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>LR No: </span>
                      <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{orderExtra.lrNumber}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="invoice-meta-cell" style={{ textAlign: 'right' }}>
              <div className="invoice-meta-label">Amount Due</div>
              <div className="invoice-meta-value" style={{ color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.4rem' }}>
                ₹{bill.balanceDue.toFixed(2)}
              </div>
              <div className="invoice-meta-sub">
                of ₹{bill.totalAmount.toFixed(2)} total
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
                  <th style={{ textAlign: 'center' }}>GST %</th>
                  <th style={{ textAlign: 'right' }}>GST (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item: any, i: number) => {
                  // Priority: bill item fields → dispatch item → order item
                  const di = dispatchItems.find((d: any) => d.sku === item.sku || d.productName === item.productName);
                  const oi = orderItems.find((o: any) => o.sku === item.sku || o.productName === item.productName);
                  const ctn = item.cartonQty > 0 ? item.cartonQty : (di?.cartonQty || oi?.cartonQty || 0);
                  const inr = item.innerQty > 0 ? item.innerQty : (di?.innerQty || oi?.innerQty || 0);
                  const pcs = item.looseQty > 0 ? item.looseQty : (di?.looseQty || oi?.looseQty || 0);
                  const parts: string[] = [];
                  if (ctn > 0) parts.push(`${ctn} CTN`);
                  if (inr > 0) parts.push(`${inr} INR`);
                  if (pcs > 0) parts.push(`${pcs} PCS`);
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
                      <td style={{ textAlign: 'right' }}>₹{item.pricePerUnit.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.gstRate}%</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{item.gstAmount.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.totalAmount.toFixed(2)}</td>
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
                  <span className="amount">₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="invoice-total-row">
                  <span className="label">GST</span>
                  <span className="amount">₹{bill.totalGst.toFixed(2)}</span>
                </div>
                <div className="invoice-total-row grand">
                  <span>Grand Total</span>
                  <span className="amount">₹{bill.totalAmount.toFixed(2)}</span>
                </div>
                <div className="invoice-total-row" style={{ marginTop: '0.5rem' }}>
                  <span className="label" style={{ color: 'var(--success)' }}>Paid</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{bill.paidAmount.toFixed(2)}</span>
                </div>
                <div className="invoice-total-row">
                  <span style={{ color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                    {bill.balanceDue > 0 ? 'Balance Due' : 'Fully Paid'}
                  </span>
                  <span style={{
                    color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)',
                    fontWeight: 800, fontSize: '1.05rem',
                  }}>
                    ₹{bill.balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {bill.paymentHistory?.length > 0 && (
              <div style={{ marginTop: '1.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  Payment History
                </div>
                {bill.paymentHistory.map((p: any, i: number) => (
                  <div key={i} className="payment-history-item">
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="payment-method-badge">
                        {methodIcons[p.method] ?? '💳'} {p.method}
                      </span>
                      {p.note && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>• {p.note}</span>}
                    </div>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Paper Order Reference Panel — second column of the outer grid */}
      {paperImageUrl && (
        <div className="no-print" style={{ position: 'sticky', top: 'calc(var(--header-height) + 1rem)' }}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <FileText size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Paper Order Slip</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reference for product matching</div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                onClick={() => setImageZoomed(true)}
                title="View full size"
              >
                <ZoomIn size={15} />
              </button>
            </div>
            <div style={{ cursor: 'zoom-in', background: '#111', lineHeight: 0 }} onClick={() => setImageZoomed(true)}>
              <img
                src={paperImageUrl}
                alt="Paper Order Slip"
                style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', display: 'block' }}
              />
            </div>
            <div style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              Click image to zoom • Use for product verification
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Zoomed paper image lightbox */}
      {imageZoomed && paperImageUrl && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(0,0,0,0.92)', zIndex: 2000 }}
          onClick={() => setImageZoomed(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageZoomed(false)}
              style={{
                position: 'absolute', top: -40, right: 0,
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                color: 'white', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem',
              }}
            >
              <X size={15} /> Close
            </button>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Paper Order Slip — {bill.customerName}
            </div>
            <img
              src={paperImageUrl}
              alt="Paper Order"
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close" onClick={() => setPayModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <IndianRupee size={28} style={{ color: 'var(--danger)', opacity: 0.6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Balance Due</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>
                  ₹{bill.balanceDue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-control"
                type="number"
                min="1"
                max={bill.balanceDue}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                id="payment-amount"
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Method</label>
                <select className="form-control" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} id="payment-method">
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI</option>
                  <option value="bank">🏦 Bank Transfer</option>
                  <option value="cheque">📋 Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-control" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Reference / remarks" id="payment-note" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handlePayment} disabled={paying} id="confirm-payment-btn">
                {paying
                  ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing...</>
                  : <><CheckCircle size={15} /> Confirm Payment</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BillView;

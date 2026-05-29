import React, { useState, useEffect } from 'react';
import { Printer, Plus, CheckCircle, Loader, ArrowLeft, MessageCircle, IndianRupee, FileText, ZoomIn, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useNotificationStore } from '../../store/notificationStore';
import { convertNumberToWords } from '../../utils/numberToWords';

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
  const [editTallyModal, setEditTallyModal] = useState(false);
  const [tallyBillNoInput, setTallyBillNoInput] = useState('');
  const [savingTally, setSavingTally] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const fetchBill = async () => {
    try {
      try {
        const { data: settingsData } = await api.get('/settings');
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to load system settings', err);
      }

      const { data } = await api.get(`/billing/${billId}`);
      setBill(data);
      setTallyBillNoInput(data.tallyBillNumber || '');

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
            receivedAt: order?.receivedAt || null,
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
          <button className="btn btn-secondary" onClick={() => setEditTallyModal(true)} style={{ color: '#6366F1', borderColor: '#C7D2FE' }} id="edit-tally-btn">
            📑 Tally No: {bill.tallyBillNumber || 'Add'}
          </button>
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
      <div className={`invoice-layout-grid ${paperImageUrl ? 'has-paper-slip' : ''}`}>

      {/* Invoice Card */}
      <div className="invoice-wrapper" style={{ maxWidth: 'none' }}>
        <div className="invoice-card">
          {/* Rainbow top bar */}
          <div className="invoice-top-bar" />

          {/* Header: brand + invoice number */}
          <div className="invoice-header">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <img 
                src="https://ik.imagekit.io/rishii/stock-management/tap/Jet%202916%20_%2004.webp" 
                alt="BAFNA TOYS Logo" 
                style={{ height: 140, objectFit: 'contain' }} 
              />
              <div style={{ textAlign: 'left', color: '#000', fontFamily: 'sans-serif' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.02em', color: '#000', textTransform: 'uppercase', marginBottom: '0.15rem', lineHeight: 1.1 }}>
                  {settings?.company_name?.value ? String(settings.company_name.value).replace(/\s/g, '') : 'BAFNATOYS'}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.3, color: '#000' }}>
                  1-12, Thondamuthur Road,<br />
                  Coimbatore - 641 007<br />
                  Tamil Nadu
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.3, color: '#000', marginTop: '0.25rem' }}>
                  Phone No : {settings?.company_phone?.value ? String(settings.company_phone.value).replace('+91', '') : '9043347300'}<br />
                  Phone No : 93639 13039
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.3, color: '#000', marginTop: '0.25rem' }}>
                  GSTIN/UIN: {settings?.company_gstin?.value || '33ANCPH3967L1ZT'}<br />
                  State Name : Tamil Nadu, Code : 33
                </div>
              </div>
            </div>
            <div className="invoice-title-block">
              <span className="invoice-label">Tax Invoice</span>
              <div className="invoice-number">{bill.billNumber}</div>
              {bill.tallyBillNumber && (
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                  Tally Ref: {bill.tallyBillNumber}
                </div>
              )}
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
              <div className="invoice-meta-sub" style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ color: 'var(--text-dim)' }}>
                  Order: <strong style={{ color: 'var(--text)' }}>{bill.orderNumber}</strong>
                </div>
                {bill.tallyBillNumber && (
                  <div style={{ color: 'var(--text-dim)' }}>
                    Tally Bill No: <strong style={{ color: 'var(--text)' }}>{bill.tallyBillNumber}</strong>
                  </div>
                )}
                {orderExtra?.receivedAt && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Paper Order Received At: <strong style={{ color: 'var(--text)' }}>
                      {new Date(orderExtra.receivedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })} - {new Date(orderExtra.receivedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true
                      }).toLowerCase()}
                    </strong>
                  </div>
                )}
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

          <div className="invoice-body">
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th className="col-product">Product</th>
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
                      <td className="col-product" style={{ fontWeight: 600 }}>{item.productName}</td>
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
          </div>

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
            {/* Tax Amount In Words */}
            <div style={{ 
              borderTop: '1.5px solid #000', 
              borderBottom: '1.5px solid #000', 
              padding: '0.45rem 0.65rem', 
              fontSize: '0.85rem', 
              color: '#000', 
              textAlign: 'left', 
              marginTop: '1.25rem',
              fontFamily: 'sans-serif'
            }}>
              Tax Amount (in words) : <strong style={{ fontWeight: 800 }}>{convertNumberToWords(bill.totalAmount)}</strong>
            </div>

            {/* Declaration & Bank Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.2fr 1fr', 
              borderBottom: '1.5px solid #000', 
              fontSize: '0.83rem', 
              color: '#000', 
              fontFamily: 'sans-serif',
              textAlign: 'left'
            }}>
              {/* Left Column: Declaration */}
              <div style={{ 
                padding: '0.65rem', 
                borderRight: '1.5px solid #000', 
                lineHeight: 1.45 
              }}>
                <div style={{ textDecoration: 'underline', fontWeight: 700, marginBottom: '0.35rem' }}>Declaration</div>
                <div style={{ whiteSpace: 'pre-line', fontSize: '0.78rem', fontWeight: 500 }}>
                  {settings?.payment_terms?.value || `. Goods once sold cannot be returned and/or exchanged.\n. Payment Terms - 15 days.\n. Interest will be recovered at 24% per annum on overdue bills.`}
                </div>
              </div>

              {/* Right Column: Company Bank Details */}
              <div style={{ padding: '0.65rem', lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Company's Bank Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.2rem', fontSize: '0.78rem', fontWeight: 500 }}>
                  <div>A/c Holder's Name</div>
                  <div>: <strong>{settings?.bank_holder_name?.value || 'BAFNATOYS'}</strong></div>
                  
                  <div>Bank Name</div>
                  <div>: <strong>{settings?.bank_name?.value || 'Kotak Mahindra Bank'}</strong></div>
                  
                  <div>A/c No.</div>
                  <div>: <strong>{settings?.bank_ac_no?.value || '5046082287'}</strong></div>
                  
                  <div>Branch & IFS Code</div>
                  <div>: <strong>{settings?.bank_ifsc?.value || 'RAJA STREET & KKBK0008655'}</strong></div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.2fr 1fr', 
              borderBottom: '1.5px solid #000', 
              minHeight: '85px', 
              fontSize: '0.85rem', 
              color: '#000',
              fontFamily: 'sans-serif',
              textAlign: 'left'
            }}>
              <div style={{ 
                padding: '0.65rem', 
                borderRight: '1.5px solid #000', 
                display: 'flex', 
                alignItems: 'flex-start' 
              }}>
                Customer's Seal and Signature
              </div>
              <div style={{ 
                padding: '0.65rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end', 
                textAlign: 'right' 
              }}>
                <div style={{ fontWeight: 700 }}>for {settings?.company_name?.value ? String(settings.company_name.value).toUpperCase() : 'BAFNATOYS'}</div>
                <div style={{ fontSize: '0.8rem', marginTop: 'auto', fontWeight: 600 }}>Authorised Signatory</div>
              </div>
            </div>

            {/* Print Bottom Rules */}
            <div style={{ 
              padding: '0.45rem', 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#000', 
              letterSpacing: '0.05em',
              fontFamily: 'sans-serif',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              SUBJECT TO COIMBATORE JURISDICTION
              <div style={{ fontWeight: 500, fontSize: '0.7rem', color: '#666', marginTop: '0.15rem' }}>
                This is a Computer Generated Invoice
              </div>
            </div>

            {/* The 8 brand logos footer row */}
            <div style={{ 
              padding: '1.25rem 0.5rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1rem', 
              flexWrap: 'wrap' 
            }}>
              {Array.from({ length: 8 }).map((_, idx) => {
                const settingKey = `brand_logo_${idx + 1}`;
                const customLogo = settings?.[settingKey]?.value;
                
                // Beautiful default fallbacks to match the screenshot
                const defaultLogos = [
                  'https://ik.imagekit.io/rishii/stock-management/tap/Fighter%20Jet.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/Squeezy%20Toys.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/Jumping%20Key%20Toys.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/TARA.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/Betty.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/Mighty%20Machines.webp',
                  'https://ik.imagekit.io/rishii/stock-management/tap/Windup%20Key%20Toys.webp',
                  '' // brand_logo_8 is empty by default
                ];
                
                const logoUrl = customLogo !== undefined ? customLogo : defaultLogos[idx];
                if (!logoUrl) return null;
                
                return (
                  <img 
                    key={idx} 
                    src={logoUrl} 
                    alt={`Brand Logo ${idx + 1}`} 
                    style={{ 
                      height: 52, 
                      maxWidth: 140, 
                      objectFit: 'contain', 
                      display: 'block' 
                    }} 
                  />
                );
              })}
            </div>
        </div>
      </div>

      {/* Paper Order Reference Panel — second column of the outer grid */}
      {paperImageUrl && (
        <div className="no-print" style={{ position: 'sticky', top: 'calc(var(--header-height) + 1rem)', maxWidth: '250px', width: '100%', justifySelf: 'center' }}>
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
              {orderExtra?.receivedAt && (
                <div style={{ marginTop: '0.35rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Slip Received: {new Date(orderExtra.receivedAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
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

      {/* Tally Edit Modal */}
      {editTallyModal && (
        <div className="modal-overlay" onClick={() => setEditTallyModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📑 Update Tally Bill Number</h3>
              <button className="modal-close" onClick={() => setEditTallyModal(false)}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingTally(true);
              try {
                const { data } = await api.patch(`/billing/${billId}/tally`, { tallyBillNumber: tallyBillNoInput });
                setBill(data);
                setEditTallyModal(false);
                toast.success('Tally Bill Number updated!');
              } catch {
                toast.error('Failed to update Tally Bill Number');
              } finally {
                setSavingTally(false);
              }
            }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Tally Bill Number</label>
                <input
                  className="form-control"
                  type="text"
                  value={tallyBillNoInput}
                  onChange={(e) => setTallyBillNoInput(e.target.value)}
                  placeholder="e.g. TALLY-1002"
                  required
                  autoFocus
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditTallyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingTally}>
                  {savingTally ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</> : 'Save Tally Number'}
                </button>
              </div>
            </form>
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

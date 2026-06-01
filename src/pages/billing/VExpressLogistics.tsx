import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Send, Loader, CheckCircle, Search, X, Download, XCircle, Eye, RefreshCw, Package, MapPin, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

// ─── Types ────────────────────────────────────────────────
interface ConsignmentEvent {
  event_type?: string;
  description?: string;
  event_location_display_name?: string;
  occurred_at?: string;
  recorded_at?: string;
}

interface Consignment {
  id: number;
  number: string;
  readable_status?: string;
  state?: string;
  consignor_company_name?: string;
  consignor_city?: string;
  consignee_company_name?: string;
  consignee_city?: string;
  consignee_state?: string;
  consignee_pin?: string;
  weight?: number;
  weight_measure?: string;
  invoice_number?: string;
  payment_mode?: string;
  created_at?: string;
  dispatch_date?: string;
  delivered_at?: string;
  current_eta?: string;
  tracking_status?: string;
  tracking_hash_url?: string;
  events?: ConsignmentEvent[];
  number_of_items?: string;
}

// ─── Component ────────────────────────────────────────────
const VExpressLogistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [createdConsignment, setCreatedConsignment] = useState<any>(null);

  // Tracking Modal
  const [trackingModal, setTrackingModal] = useState<{ open: boolean; loading: boolean; data: Consignment | null }>({ open: false, loading: false, data: null });

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState<{ open: boolean; loading: boolean; consignment: Consignment | null }>({ open: false, loading: false, consignment: null });

  // Form
  const [formData, setFormData] = useState({
    consignee_company_name: '',
    consignee_address_line1: '',
    consignee_address_line2: '',
    consignee_city: '',
    consignee_state: '',
    consignee_pin: '',
    consignee_contact_name: '',
    consignee_phone: '',
    weight: '10',
    units: '1',
    invoice_number: '',
    invoice_value: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearForm = () => setFormData({
    consignee_company_name: '', consignee_address_line1: '', consignee_address_line2: '',
    consignee_city: '', consignee_state: '', consignee_pin: '',
    consignee_contact_name: '', consignee_phone: '', weight: '10', units: '1',
    invoice_number: '', invoice_value: '',
  });

  // ─── Fetch Consignment List (Real API) ──────────────────
  const fetchConsignments = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await api.post('/vxpress/list', {}, { timeout: 25000 });
      const lrs = data?.lrs || data?.lr || [];
      setConsignments(Array.isArray(lrs) ? lrs : [lrs]);
    } catch (err: any) {
      console.error('Failed to fetch consignments:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('V-Xpress server slow hai, thodi der baad try karo');
      } else {
        toast.error('V-Xpress se data load nahi hua');
      }
      setConsignments([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchConsignments();
    }
  }, [activeTab, fetchConsignments]);

  // ─── Create Consignment ─────────────────────────────────
  const handleCreateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedConsignment(null);

    const payload = {
      consignment: {
        consolidate: "No",
        shipper_company_code: "19247",
        consignment_number: "",
        is_draft: "No",
        consignor_company_code: "19247",
        consignor_facility_code: "10318719",
        consignor_pin: "400705",
        consignor_contact_name: "RAHUL",
        consignor_phone: "7045848448",
        consignee_company_name: formData.consignee_company_name,
        consignee_address_line1: formData.consignee_address_line1,
        consignee_address_line2: formData.consignee_address_line2,
        consignee_city: formData.consignee_city,
        consignee_state: formData.consignee_state,
        consignee_pin: formData.consignee_pin,
        consignee_contact_name: formData.consignee_contact_name,
        consignee_phone: formData.consignee_phone,
        service_option: "SURF XPRS",
        service_provider_company_code: "VX",
        payment_mode: "To Bill",
        weight: formData.weight,
        weight_measure: "Kgs",
        consignment_contents: {
          consignment_content: {
            product_name: "OTHERS",
            product_display_name: "Toys",
            units: formData.units,
            unit_type: "Cartons",
            weight: formData.weight,
            weight_measure: "Kgs",
            length: "10", width: "10", height: "20", uom: "inches"
          }
        },
        consignment_invoices: {
          consignment_invoice: {
            invoice_number: formData.invoice_number,
            invoice_value: formData.invoice_value,
            invoice_date: new Date().toISOString().split('T')[0],
          }
        },
        consignment_type: "OUTBOUND-TBB"
      }
    };

    try {
      const { data } = await api.post('/vxpress/create', payload);
      setCreatedConsignment(data.consignment);
      toast.success('Consignment created successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create consignment');
    } finally {
      setLoading(false);
    }
  };

  // ─── Track Consignment ──────────────────────────────────
  const handleTrack = async (docketNumber: string) => {
    setTrackingModal({ open: true, loading: true, data: null });
    try {
      const { data } = await api.get(`/vxpress/track/${docketNumber}`);
      setTrackingModal({ open: true, loading: false, data: data.consignment });
    } catch (err: any) {
      toast.error('Tracking info nahi mili');
      setTrackingModal({ open: false, loading: false, data: null });
    }
  };

  // ─── Generate Label ─────────────────────────────────────
  const handleLabel = async (consignment: Consignment) => {
    const toastId = toast.loading('Label generate ho raha hai...');
    try {
      const { data } = await api.post('/vxpress/label', {
        consignment: { id: consignment.id, number: consignment.number }
      });
      toast.dismiss(toastId);
      if (data?.label_url || data?.url) {
        window.open(data.label_url || data.url, '_blank');
        toast.success('Label downloaded!');
      } else {
        toast.success('Label request sent to V-Xpress');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Label generate nahi hua');
    }
  };

  // ─── Cancel Consignment ─────────────────────────────────
  const handleCancel = async () => {
    if (!cancelModal.consignment) return;
    setCancelModal(prev => ({ ...prev, loading: true }));
    try {
      await api.post('/vxpress/cancel', {
        consignment: {
          id: cancelModal.consignment.id,
          number: cancelModal.consignment.number,
        }
      });
      toast.success(`Docket ${cancelModal.consignment.number} cancel ho gaya!`);
      setCancelModal({ open: false, loading: false, consignment: null });
      fetchConsignments();
    } catch (err: any) {
      toast.error('Cancel nahi hua');
      setCancelModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ─── Get POD ────────────────────────────────────────────
  const handlePOD = async (consignment: Consignment) => {
    const toastId = toast.loading('POD download ho raha hai...');
    try {
      const { data } = await api.get(`/vxpress/pod/${consignment.id}`);
      toast.dismiss(toastId);
      if (data?.pod_url || data?.url) {
        window.open(data.pod_url || data.url, '_blank');
        toast.success('POD opened!');
      } else {
        toast.success('POD data received');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('POD available nahi hai');
    }
  };

  // ─── Status Badge Helper ────────────────────────────────
  const getStatusStyle = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981' };
    if (s.includes('transit') || s.includes('dispatch')) return { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' };
    if (s.includes('cancel')) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' };
    if (s.includes('creat') || s.includes('book')) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
    return { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' };
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header with Toggle */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">V-Xpress Logistics</h1>
          <p className="page-subtitle">Create shipments, track dockets & manage consignments</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            className="btn"
            style={{
              border: 'none', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '8px',
              background: activeTab === 'new' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'new' ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setActiveTab('new')}
          >
            + Create New
          </button>
          <button
            className="btn"
            style={{
              border: 'none', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '8px',
              background: activeTab === 'history' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'history' ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setActiveTab('history')}
          >
            📦 All Shipments
          </button>
        </div>
      </div>

      {/* ═══ TAB: CREATE NEW ═══ */}
      {activeTab === 'new' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Form */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', color: '#F59E0B' }}><Truck size={20} /></div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>New Shipment Details</h2>
            </div>
            <form onSubmit={handleCreateConsignment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Consignee (Receiver) Company Name</label>
                  <input type="text" className="form-control" name="consignee_company_name" value={formData.consignee_company_name} onChange={handleChange} required placeholder="e.g. Rujutha Health care" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input type="text" className="form-control" name="consignee_contact_name" value={formData.consignee_contact_name} onChange={handleChange} required placeholder="e.g. Advaith" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" name="consignee_phone" value={formData.consignee_phone} onChange={handleChange} required placeholder="e.g. 9999999999" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address Line 1</label>
                  <input type="text" className="form-control" name="consignee_address_line1" value={formData.consignee_address_line1} onChange={handleChange} required placeholder="e.g. 107, K S Garden" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address Line 2</label>
                  <input type="text" className="form-control" name="consignee_address_line2" value={formData.consignee_address_line2} onChange={handleChange} placeholder="e.g. Lalbagh Road" />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" name="consignee_city" value={formData.consignee_city} onChange={handleChange} required placeholder="e.g. Bengaluru" />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-control" name="consignee_state" value={formData.consignee_state} onChange={handleChange} required placeholder="e.g. Karnataka" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" className="form-control" name="consignee_pin" value={formData.consignee_pin} onChange={handleChange} required placeholder="e.g. 560027" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Weight (Kgs)</label>
                  <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Cartons/Units</label>
                  <input type="number" className="form-control" name="units" value={formData.units} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input type="text" className="form-control" name="invoice_number" value={formData.invoice_number} onChange={handleChange} required placeholder="e.g. INV-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Value (₹)</label>
                  <input type="number" className="form-control" name="invoice_value" value={formData.invoice_value} onChange={handleChange} required placeholder="e.g. 10000" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={clearForm}>Clear</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 180, justifyContent: 'center' }}>
                  {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Send size={16} /> Create Consignment</>}
                </button>
              </div>
            </form>
          </div>

          {/* Right side: Info + Success */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg3)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Sender (Auto-filled)</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>Company:</strong> Bafna Toys (19247)</div>
                <div><strong>Facility:</strong> 10318719</div>
                <div><strong>Contact:</strong> RAHUL (7045848448)</div>
                <div><strong>Pincode:</strong> 400705</div>
                <div><strong>Service:</strong> SURF XPRS · To Bill</div>
              </div>
            </div>

            {createdConsignment && (
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <CheckCircle size={24} color="#10B981" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#10B981' }}>Success!</h3>
                </div>
                <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.25rem' }}>Docket / AWB Number</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{createdConsignment.number}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem' }}>
                    <div><span style={{ color: 'var(--text-dim)' }}>Status: </span><span style={{ fontWeight: 600 }}>{createdConsignment.status}</span></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Invoice: </span><span style={{ fontWeight: 600 }}>{createdConsignment.invoice_number}</span></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }} onClick={() => handleTrack(createdConsignment.number)}>
                    <Search size={14} /> Track
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }} onClick={() => { setActiveTab('history'); }}>
                    <Eye size={14} /> View All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══ TAB: ALL SHIPMENTS (HISTORY) ═══ */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {consignments.length > 0 ? `${consignments.length} consignment(s) found from V-Xpress` : 'Loading data from V-Xpress...'}
            </div>
            <button className="btn btn-secondary" onClick={fetchConsignments} disabled={listLoading} style={{ fontSize: '0.8rem' }}>
              <RefreshCw size={14} style={listLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
            </button>
          </div>

          {listLoading ? (
            <div className="loading-page"><div className="spinner" /><p>V-Xpress se data load ho raha hai...</p></div>
          ) : consignments.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Koi consignment nahi mila</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pehle "Create New" tab se ek naya docket banayein</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                      {['Date', 'Docket #', 'Consignee', 'City → State', 'Weight', 'Invoice', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consignments.map((c, idx) => {
                      const st = getStatusStyle(c.readable_status || c.tracking_status);
                      return (
                        <tr key={c.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{c.number}</td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.consignee_company_name || '—'}</td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.consignee_city || '—'}{c.consignee_state ? ` → ${c.consignee_state}` : ''}</td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{c.weight || '—'} {c.weight_measure || ''}</td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>{c.invoice_number || '—'}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ padding: '0.25rem 0.65rem', background: st.bg, color: st.color, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {c.readable_status || c.tracking_status || 'Created'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px' }} onClick={() => handleTrack(c.number)} title="Track">
                                <Search size={13} />
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px' }} onClick={() => handleLabel(c)} title="Label">
                                <Download size={13} />
                              </button>
                              {(c.readable_status || '').toLowerCase().includes('deliver') && (
                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px' }} onClick={() => handlePOD(c)} title="POD">
                                  <FileText size={13} />
                                </button>
                              )}
                              {!(c.readable_status || '').toLowerCase().includes('deliver') && !(c.readable_status || '').toLowerCase().includes('cancel') && (
                                <button className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => setCancelModal({ open: true, loading: false, consignment: c })} title="Cancel">
                                  <XCircle size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ TRACKING MODAL ═══ */}
      {trackingModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setTrackingModal({ open: false, loading: false, data: null })}
        >
          <div className="card" style={{ maxWidth: 560, width: '100%', padding: '1.75rem', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>🔍 Shipment Tracking</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '1.2rem' }} onClick={() => setTrackingModal({ open: false, loading: false, data: null })}>✕</button>
            </div>

            {trackingModal.loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Tracking info load ho raha hai...</p></div>
            ) : trackingModal.data ? (
              <>
                {/* Docket Info */}
                <div style={{ background: 'var(--bg3)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: 'var(--text-dim)' }}>Docket:</span> <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{trackingModal.data.number}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Status:</span> <strong>{trackingModal.data.readable_status || trackingModal.data.tracking_status}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>From:</span> {trackingModal.data.consignor_city || 'N/A'}</div>
                    <div><span style={{ color: 'var(--text-dim)' }}>To:</span> {trackingModal.data.consignee_city || 'N/A'}, {trackingModal.data.consignee_state || ''}</div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Weight:</span> {trackingModal.data.weight || '—'} {trackingModal.data.weight_measure || ''}</div>
                    <div><span style={{ color: 'var(--text-dim)' }}>ETA:</span> {formatDate(trackingModal.data.current_eta)}</div>
                  </div>
                </div>

                {/* Events Timeline */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>📍 Tracking Events</h4>
                {trackingModal.data.events && trackingModal.data.events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {trackingModal.data.events.map((evt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        {/* Timeline line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#10B981' : 'var(--border)', flexShrink: 0, marginTop: 5 }} />
                          {i < (trackingModal.data?.events?.length || 0) - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)' }} />}
                        </div>
                        <div style={{ paddingBottom: '1.25rem', flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{evt.description || evt.event_type || 'Event'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {evt.event_location_display_name && <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {evt.event_location_display_name}</span>}
                            {evt.occurred_at && <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {formatDate(evt.occurred_at)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Abhi koi tracking event nahi hai. Shipment pickup hone ke baad events aayenge.</div>
                )}

                {/* Track on V-Xpress link */}
                {trackingModal.data.tracking_hash_url && (
                  <a href={trackingModal.data.tracking_hash_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', textDecoration: 'none' }}>
                    V-Xpress par Track karein ↗
                  </a>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tracking data nahi mila</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CANCEL MODAL ═══ */}
      {cancelModal.open && cancelModal.consignment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setCancelModal({ open: false, loading: false, consignment: null })}
        >
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Cancel Consignment?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Kya aap sure hain ki Docket <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{cancelModal.consignment.number}</strong> cancel karna hai?
              </p>
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>Yeh action undo nahi ho sakta!</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCancelModal({ open: false, loading: false, consignment: null })}>Nahi, Rehne Do</button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', background: '#EF4444', color: 'white', border: 'none' }} onClick={handleCancel} disabled={cancelModal.loading}>
                {cancelModal.loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cancelling...</> : <><XCircle size={14} /> Haan, Cancel Karo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default VExpressLogistics;

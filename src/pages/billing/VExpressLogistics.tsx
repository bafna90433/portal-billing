import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Loader, Search, X, Download, XCircle, RefreshCw, Package, MapPin, Clock, FileText, Calendar } from 'lucide-react';
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
  const [listLoading, setListLoading] = useState(false);
  const [consignments, setConsignments] = useState<Consignment[]>([]);

  // Tracking Modal
  const [trackingModal, setTrackingModal] = useState<{ open: boolean; loading: boolean; data: Consignment | null }>({ open: false, loading: false, data: null });

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState<{ open: boolean; loading: boolean; consignment: Consignment | null }>({ open: false, loading: false, consignment: null });

  // Pagination & Load More
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [nextLastId, setNextLastId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 50;

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Apply filters → then paginate
  const filteredConsignments = consignments.filter(c => {
    // Text search (docket or consignee)
    if (searchText) {
      const q = searchText.toLowerCase();
      const matchDocket = (c.number || '').toLowerCase().includes(q);
      const matchConsignee = (c.consignee_company_name || '').toLowerCase().includes(q);
      const matchCity = (c.consignee_city || '').toLowerCase().includes(q);
      const matchInvoice = (c.invoice_number || '').toLowerCase().includes(q);
      if (!matchDocket && !matchConsignee && !matchCity && !matchInvoice) return false;
    }
    // Status filter
    if (statusFilter !== 'all') {
      const st = (c.readable_status || c.tracking_status || '').toLowerCase();
      if (statusFilter === 'delivered' && !st.includes('deliver')) return false;
      if (statusFilter === 'transit' && !st.includes('transit') && !st.includes('dispatch')) return false;
      if (statusFilter === 'created' && !st.includes('creat') && !st.includes('book')) return false;
      if (statusFilter === 'cancelled' && !st.includes('cancel')) return false;
    }
    // Date range
    if (dateFrom) {
      const d = new Date(c.created_at || 0);
      if (d < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const d = new Date(c.created_at || 0);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredConsignments.length / ITEMS_PER_PAGE);
  const paginatedConsignments = filteredConsignments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchText || statusFilter !== 'all' || dateFrom || dateTo;

  // ─── Fetch ALL consignments (backend auto-paginates) ─────
  const fetchConsignments = useCallback(async () => {
    setListLoading(true);
    setCurrentPage(1);
    try {
      const { data } = await api.post('/vxpress/list', {}, { timeout: 300000 }); // 5 min for full fetch
      const lrs = data?.lrs || [];
      setConsignments(Array.isArray(lrs) ? lrs : [lrs]); // Already sorted newest-first by backend
      if (data?.total) {
        toast.success(`${data.total} consignments loaded!`);
      }
    } catch (err: any) {
      console.error('Failed to fetch consignments:', err);
      if (err.code === 'ECONNABORTED') {
        toast.error('V-Xpress server se response mein time lag raha hai, retry karein');
      } else {
        toast.error('V-Xpress se data load nahi hua');
      }
      setConsignments([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsignments();
  }, [fetchConsignments]);

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
      const { data } = await api.post('/vxpress/pod', { number: consignment.number });
      toast.dismiss(toastId);
      // POD response may contain pods array with image URLs
      if (data?.pods && Array.isArray(data.pods) && data.pods.length > 0) {
        const pod = data.pods[0];
        const imageUrl = pod?.pod_image_url || pod?.image_url || pod?.url;
        if (imageUrl) {
          window.open(imageUrl, '_blank');
          toast.success('POD opened!');
        } else {
          toast.success('POD data received — check console');
          console.log('POD data:', data);
        }
      } else if (data?.pod_url || data?.url) {
        window.open(data.pod_url || data.url, '_blank');
        toast.success('POD opened!');
      } else {
        toast.error('POD abhi available nahi hai');
        console.log('POD response:', data);
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
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">V-Xpress Logistics</h1>
        <p className="page-subtitle">Track dockets, download POD & manage consignments</p>
      </div>

      {/* ═══ ALL SHIPMENTS ═══ */}
          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
              {/* Search */}
              <div style={{ flex: '1 1 220px', minWidth: 180 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}>Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input type="text" className="form-control" placeholder="Docket, Consignee, City, Invoice..." value={searchText}
                    onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                    style={{ paddingLeft: '2rem', fontSize: '0.85rem', height: 36 }} />
                </div>
              </div>
              {/* Status */}
              <div style={{ minWidth: 140 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                <select className="form-control" value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.85rem', height: 36, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 0.75rem' }}>
                  <option value="all">All Status</option>
                  <option value="delivered">✅ Delivered</option>
                  <option value="transit">🚛 In Transit</option>
                  <option value="created">📝 Created</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
              {/* Date From */}
              <div style={{ minWidth: 140 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}><Calendar size={10} /> From Date</label>
                <input type="date" className="form-control" value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.85rem', height: 36 }} />
              </div>
              {/* Date To */}
              <div style={{ minWidth: 140 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}><Calendar size={10} /> To Date</label>
                <input type="date" className="form-control" value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '0.85rem', height: 36 }} />
              </div>
              {/* Clear */}
              {hasActiveFilters && (
                <button className="btn btn-secondary" onClick={clearFilters} style={{ height: 36, fontSize: '0.8rem', borderRadius: 8, whiteSpace: 'nowrap' }}>
                  <X size={14} /> Clear
                </button>
              )}
              {/* Refresh */}
              <button className="btn btn-secondary" onClick={fetchConsignments} disabled={listLoading} style={{ height: 36, fontSize: '0.8rem', borderRadius: 8 }}>
                <RefreshCw size={14} style={listLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
              </button>
            </div>
          </div>

          {/* Info Text */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredConsignments.length > 0
                ? `${filteredConsignments.length} of ${consignments.length} consignment(s)${hasActiveFilters ? ' (filtered)' : ''} — Page ${currentPage} of ${totalPages}`
                : consignments.length > 0 ? 'No results match your filters' : 'Loading data from V-Xpress...'}
            </div>
          </div>

          {listLoading ? (
            <div className="loading-page"><div className="spinner" /><p>V-Xpress se data load ho raha hai...</p></div>
          ) : consignments.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Koi consignment nahi mila</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data load hone ka wait karein...</div>
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
                    {paginatedConsignments.map((c, idx) => {
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
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className="btn"
                      style={{
                        padding: '0.4rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px', minWidth: 36, justifyContent: 'center',
                        background: page === currentPage ? 'var(--primary)' : 'transparent',
                        color: page === currentPage ? 'white' : 'var(--text-muted)',
                        border: page === currentPage ? 'none' : '1px solid var(--border)',
                        fontWeight: page === currentPage ? 700 : 500,
                      }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
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

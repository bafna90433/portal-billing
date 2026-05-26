import React, { useState, useEffect } from 'react';
import { Receipt, Search, Eye } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const GeneratedBills: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filteredBills = bills.filter(b => 
    b.billNumber?.toLowerCase().includes(search.toLowerCase()) || 
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Generated Bills</h1>
          <p className="page-subtitle">View all invoices that have been generated.</p>
        </div>
        <div className="search-bar" style={{ width: 300 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by bill #, order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-page" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
        ) : filteredBills.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} className="empty-icon" style={{ color: 'var(--primary)' }} />
            <h3 className="empty-title">No bills found</h3>
            <p className="empty-text">Generated invoices will appear here.</p>
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
                      ₹{b.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
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

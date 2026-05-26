import React, { useEffect, useState } from 'react';
import { X, Package, Tag, Hash, Layers } from 'lucide-react';
import api from '../api/axios';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({ isOpen, onClose, productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setLoading(true);
      api.get(`/products/${productId}`)
        .then(res => setProduct(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', zIndex: 1000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 className="modal-title">Product Preview</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div className="loading-page" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
        ) : product ? (
          <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', background: 'var(--bg)' }}>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '12px', background: 'var(--bg2)', overflow: 'hidden', flexShrink: 0 }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
                )}
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{product.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Hash size={14} /> {product.sku}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(108,92,231,0.1)', color: '#6C5CE7', padding: '0.5rem', borderRadius: '8px' }}><Tag size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</div>
                      <div style={{ fontWeight: 600 }}>{product.category?.name || 'Uncategorized'}</div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(0,184,148,0.1)', color: '#00B894', padding: '0.5rem', borderRadius: '8px' }}><Layers size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit</div>
                      <div style={{ fontWeight: 600 }}>{product.unit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', margin: 0 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Pricing & Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Price</span>
                  <span style={{ fontWeight: 600 }}>₹{product.price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST Rate</span>
                  <span style={{ fontWeight: 600 }}>{product.gstRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Min Order Qty</span>
                  <span style={{ fontWeight: 600 }}>{product.minOrderQty || 1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Added On</span>
                  <span style={{ fontWeight: 600 }}>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Could not load product details.</div>
        )}
      </div>
    </div>
  );
};

export default ProductPreviewModal;

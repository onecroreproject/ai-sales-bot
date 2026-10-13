import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Target, Package, X } from 'lucide-react';

export default function ProductsTab({ products, companyId, onCreateProduct, onUpdateProduct, onDeleteProduct, loading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    benefits: '',
    target_customer: '',
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', features: '', benefits: '', target_customer: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      features: product.features || '',
      benefits: product.benefits || '',
      target_customer: product.target_customer || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      company_id: companyId,
      price: formData.price ? parseFloat(formData.price) : null,
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onCreateProduct(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Product Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage the offerings and solutions your AI Sales Bot recommends to website visitors.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '24px', fontSize: '14px' }}>
            Loading products catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="clean-card" style={{ padding: '48px 24px', textAlign: 'center', gridColumn: '1/-1' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-muted)'
            }}>
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No products found
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
              Add your first product so the AI assistant can pitch features, answer pricing questions, and convert buyers.
            </p>
            <button onClick={openCreateModal} className="btn-primary">
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          products.map((product) => (
            <div 
              key={product.id} 
              className="clean-card clean-card-hover" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  {product.price && (
                    <span className="badge badge-emerald" style={{ flexShrink: 0, fontWeight: 700 }}>
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                  {product.description || 'No description provided.'}
                </p>

                {product.target_customer && (
                  <div className="badge badge-blue" style={{ fontSize: '11.5px', fontWeight: 600, marginTop: '4px' }}>
                    <Target size={12} /> {product.target_customer}
                  </div>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-end', 
                gap: '8px', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border-subtle)' 
              }}>
                <button 
                  onClick={() => openEditModal(product)} 
                  className="btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '12.5px' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button 
                  onClick={() => onDeleteProduct(product.id)} 
                  className="btn-danger" 
                  style={{ padding: '6px 14px', fontSize: '12.5px' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="e.g. Enterprise Cloud AI"
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Price (USD)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="99.00"
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Target Customer
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. B2B Founders" 
                    value={formData.target_customer} 
                    onChange={(e) => setFormData({ ...formData, target_customer: e.target.value })} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea 
                  rows={3} 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Key features and value proposition..."
                  style={{ width: '100%', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

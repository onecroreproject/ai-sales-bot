import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Cpu, Sparkles } from 'lucide-react';

export default function KnowledgeTab({ knowledgeList, products, companyId, onCreateKnowledge, onUpdateKnowledge, onDeleteKnowledge, loading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [productId, setProductId] = useState('');
  const [content, setContent] = useState('');

  const openCreateModal = () => {
    setEditingKnowledge(null);
    setProductId(products[0]?.id || '');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingKnowledge(item);
    setProductId(item.product_id || '');
    setContent(item.content || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      company_id: companyId,
      product_id: productId ? parseInt(productId) : null,
      content,
    };

    if (editingKnowledge) {
      await onUpdateKnowledge(editingKnowledge.id, payload);
    } else {
      await onCreateKnowledge(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Knowledge Base & RAG Index</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Product documentation and FAQs indexed with 1536-dimension OpenAI vector embeddings.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={18} /> Add Knowledge Chunk
        </button>
      </div>

      {/* Knowledge Base Chunks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading knowledge base...</div>
        ) : knowledgeList.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No knowledge entries added yet. Click <strong>Add Knowledge Chunk</strong> above to index documentation.
          </div>
        ) : (
          knowledgeList.map((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return (
              <div key={item.id} className="glass-card glass-card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Cpu size={12} /> 1536-VECTOR INDEXED
                    </span>
                    {product && (
                      <span className="badge badge-indigo">
                        {product.name}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#fff', lineHeight: '1.6' }}>
                    {item.content}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(item)} className="btn-secondary" style={{ padding: '6px 10px' }} title="Edit & Re-index">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => onDeleteKnowledge(item.id)} className="btn-danger" style={{ padding: '6px 10px' }} title="Delete Chunk">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '560px', padding: '28px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              {editingKnowledge ? 'Edit Knowledge Chunk' : 'Add Knowledge Chunk'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Associated Product</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">General Knowledge (No Product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Documentation Text / FAQ *</label>
                <textarea rows={6} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste product features, pricing guidelines, or support answers..." style={{ width: '100%', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save & Generate Embedding</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

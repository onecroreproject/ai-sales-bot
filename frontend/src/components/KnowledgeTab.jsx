import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Cpu, 
  Globe, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileText,
  X
} from 'lucide-react';
import { api } from '../api/client';

export default function KnowledgeTab({ 
  knowledgeList, 
  products, 
  companyId, 
  onCreateKnowledge, 
  onUpdateKnowledge, 
  onDeleteKnowledge, 
  onRefresh, 
  loading 
}) {
  const [activeSubTab, setActiveSubTab] = useState('knowledge'); // 'knowledge' | 'unanswered'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [productId, setProductId] = useState('');
  const [content, setContent] = useState('');
  const [resolvingQueryId, setResolvingQueryId] = useState(null);

  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProductId, setUploadProductId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Crawler State
  const [isCrawlModalOpen, setIsCrawlModalOpen] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlProductId, setCrawlProductId] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);
  const [crawlError, setCrawlError] = useState(null);

  // Unanswered Queries State
  const [unansweredQueries, setUnansweredQueries] = useState([]);
  const [loadingUnanswered, setLoadingUnanswered] = useState(false);

  const fetchUnanswered = async () => {
    setLoadingUnanswered(true);
    try {
      const data = await api.getUnansweredQueries();
      setUnansweredQueries(data || []);
    } catch (err) {
      console.error('Failed to fetch unanswered queries:', err);
    } finally {
      setLoadingUnanswered(false);
    }
  };

  useEffect(() => {
    fetchUnanswered();
  }, []);

  const openCreateModal = () => {
    setEditingKnowledge(null);
    setResolvingQueryId(null);
    setProductId(products[0]?.id || '');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingKnowledge(item);
    setResolvingQueryId(null);
    setProductId(item.product_id || '');
    setContent(item.content || '');
    setIsModalOpen(true);
  };

  const openResolveModal = (query) => {
    setEditingKnowledge(null);
    setResolvingQueryId(query.id);
    setProductId(products[0]?.id || '');
    setContent(`Frequently Asked Question:\nQuestion: ${query.question}\nAnswer: `);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKnowledge) {
        await onUpdateKnowledge(editingKnowledge.id, {
          content,
          product_id: productId || null,
        });
      } else {
        await onCreateKnowledge({
          company_id: companyId,
          content,
          product_id: productId || null,
        });
        if (resolvingQueryId) {
          try {
            await api.resolveUnansweredQuery(resolvingQueryId);
            fetchUnanswered();
          } catch (resErr) {
            console.error('Failed to mark query resolved:', resErr);
          }
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving knowledge chunk: ' + err.message);
    }
  };

  const handleStartCrawl = async (e) => {
    e.preventDefault();
    if (!crawlUrl.trim()) return;

    setCrawling(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const res = await api.crawlUrl(crawlUrl.trim(), crawlProductId || null);
      setCrawlResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setCrawlError(err.message || 'Crawler failed to process this webpage.');
    } finally {
      setCrawling(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadKnowledgeDocument(selectedFile, uploadProductId || null);
      setUploadResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setUploadError(err.message || 'File upload failed or format not supported.');
    } finally {
      setUploading(false);
    }
  };

  const handleDismissQuery = async (id) => {
    try {
      await api.dismissUnansweredQuery(id);
      fetchUnanswered();
    } catch (err) {
      alert('Failed to dismiss query: ' + err.message);
    }
  };

  const pendingUnansweredCount = unansweredQueries.filter(q => q.status !== 'resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Knowledge Base (RAG)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Train your AI bot on company documentation, website URLs, and FAQs using high-precision vector search.
          </p>
        </div>

        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setUploadError(null);
              setIsUploadModalOpen(true);
            }} 
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UploadCloud size={16} /> Upload Document
          </button>

          <button 
            onClick={() => {
              setCrawlResult(null);
              setCrawlError(null);
              setIsCrawlModalOpen(true);
            }} 
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Globe size={16} /> Auto-Crawl URL
          </button>

          <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Chunk
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`nav-tab-pill ${activeSubTab === 'knowledge' ? 'active' : ''}`}
        >
          <BookOpen size={15} /> Indexed Knowledge Chunks ({knowledgeList.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('unanswered');
            fetchUnanswered();
          }}
          className={`nav-tab-pill ${activeSubTab === 'unanswered' ? 'active' : ''}`}
        >
          <HelpCircle size={15} /> Unanswered Questions
          {pendingUnansweredCount > 0 && (
            <span className="badge badge-amber" style={{ padding: '2px 7px', fontSize: '11px', fontWeight: 700 }}>
              {pendingUnansweredCount}
            </span>
          )}
        </button>
      </div>

      {/* SUB TAB 1: Indexed Knowledge Base */}
      {activeSubTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '24px', fontSize: '14px' }}>
              Loading knowledge base...
            </div>
          ) : knowledgeList.length === 0 ? (
            <div className="clean-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
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
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                No knowledge chunks indexed yet
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 20px' }}>
                Feed your sales bot accurate company facts. You can auto-crawl any website URL, upload a PDF/Word file, or add FAQ chunks.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setIsCrawlModalOpen(true)} className="btn-primary">
                  <Globe size={15} /> Auto-Crawl Website URL
                </button>
                <button onClick={() => setIsUploadModalOpen(true)} className="btn-secondary">
                  <UploadCloud size={15} /> Upload PDF / Doc
                </button>
              </div>
            </div>
          ) : (
            knowledgeList.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              const isWebCrawl = item.content.startsWith('[Source:');
              const isDoc = item.content.startsWith('[File:');
              return (
                <div 
                  key={item.id} 
                  className="clean-card clean-card-hover" 
                  style={{ 
                    padding: '20px 24px', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between', 
                    gap: '20px' 
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span className="badge badge-emerald">
                        <Cpu size={12} /> 1536-VECTOR INDEXED
                      </span>
                      {isWebCrawl && (
                        <span className="badge badge-blue">
                          <Globe size={12} /> Webpage Crawl
                        </span>
                      )}
                      {isDoc && (
                        <span className="badge badge-purple">
                          <FileText size={12} /> Document Upload
                        </span>
                      )}
                      {product && (
                        <span className="badge badge-indigo">
                          {product.name}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {item.content}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button 
                      onClick={() => openEditModal(item)} 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12.5px' }} 
                      title="Edit & Re-index"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => onDeleteKnowledge(item.id)} 
                      className="btn-danger" 
                      style={{ padding: '6px 12px', fontSize: '12.5px' }} 
                      title="Delete Chunk"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB TAB 2: Unanswered Questions */}
      {activeSubTab === 'unanswered' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Questions website visitors asked that the AI did not find knowledge for. Turn any missed question into verified knowledge in 1 click.
            </p>
            <button 
              onClick={fetchUnanswered} 
              className="btn-secondary" 
              disabled={loadingUnanswered} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}
            >
              <RefreshCw size={13} className={loadingUnanswered ? 'animate-spin' : ''} /> Refresh List
            </button>
          </div>

          {loadingUnanswered ? (
            <div style={{ color: 'var(--text-muted)', padding: '24px', fontSize: '14px' }}>
              Loading missed questions...
            </div>
          ) : unansweredQueries.length === 0 ? (
            <div className="clean-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--status-emerald-bg)',
                color: 'var(--status-emerald-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Zero Unanswered Questions
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                Your AI bot has enough knowledge context to answer all visitor queries, or no missed questions have been logged yet.
              </p>
            </div>
          ) : (
            unansweredQueries.map((q) => {
              const isResolved = q.status === 'resolved';
              return (
                <div 
                  key={q.id} 
                  className="clean-card clean-card-hover" 
                  style={{ 
                    padding: '20px 24px', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between', 
                    gap: '20px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {isResolved ? (
                        <span className="badge badge-emerald">
                          <CheckCircle2 size={12} /> RESOLVED & INDEXED
                        </span>
                      ) : (
                        <span className="badge badge-amber">
                          <AlertTriangle size={12} /> KNOWLEDGE GAP / UNANSWERED
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {q.created_at ? new Date(q.created_at).toLocaleString() : 'Recently asked'}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      "{q.question}"
                    </div>

                    {q.ai_response && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)', 
                        background: 'var(--bg-surface-subtle)', 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-subtle)',
                        lineHeight: 1.5 
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Bot Answered: </span>
                        {q.ai_response}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {!isResolved && (
                      <button 
                        onClick={() => openResolveModal(q)} 
                        className="btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '7px 14px' }}
                      >
                        <Plus size={14} /> Add to Knowledge
                      </button>
                    )}
                    <button 
                      onClick={() => handleDismissQuery(q.id)} 
                      className="btn-secondary" 
                      style={{ fontSize: '12px', padding: '7px 12px' }}
                      title="Dismiss query"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: Auto-Crawl Website URL Modal */}
      {isCrawlModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--brand-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Auto-Crawl Website URL
                </h2>
              </div>
              <button 
                onClick={() => setIsCrawlModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px', lineHeight: 1.5 }}>
              Enter any public webpage URL. The crawler extracts clean text, removes HTML noise, splits into coherent chunks, and computes vector embeddings.
            </p>

            <form onSubmit={handleStartCrawl} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Webpage URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://yourcompany.com/about-us"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Associated Product (Optional)
                </label>
                <select 
                  value={crawlProductId} 
                  onChange={(e) => setCrawlProductId(e.target.value)} 
                  style={{ width: '100%' }}
                >
                  <option value="">General Company Knowledge (No specific product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {crawlError && (
                <div className="badge badge-rose" style={{ padding: '10px 14px', borderRadius: '8px', display: 'block' }}>
                  {crawlError}
                </div>
              )}

              {crawlResult && (
                <div className="clean-card" style={{ padding: '14px', background: 'var(--status-emerald-bg)', borderColor: 'var(--status-emerald-border)', color: 'var(--status-emerald-text)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} /> Crawl Completed Successfully!
                  </div>
                  <div>Page Title: <strong>{crawlResult.title}</strong></div>
                  <div>Indexed <strong>{crawlResult.chunks_indexed}</strong> knowledge chunks ({crawlResult.total_characters} characters) into vector database.</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCrawlModalOpen(false)} 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {crawlResult ? 'Close' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={crawling} 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {crawling ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Crawling & Indexing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Start Auto-Crawl
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--status-emerald-bg)', color: 'var(--status-emerald-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={18} />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upload Knowledge Document
                </h2>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px', lineHeight: 1.5 }}>
              Upload company documents, price books, FAQ guides, or product catalogs. Supported formats: <strong>PDF</strong>, <strong>DOCX</strong>, <strong>XLSX</strong>, <strong>CSV</strong>, and <strong>TXT</strong>.
            </p>

            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Choose Document File *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.xlsx,.csv,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setSelectedFile(f || null);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '8px', 
                    border: '1px dashed var(--border-medium)', 
                    background: 'var(--bg-surface-subtle)', 
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                />
                {selectedFile && (
                  <div style={{ fontSize: '12.5px', color: 'var(--status-emerald-text)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Associated Product (Optional)
                </label>
                <select 
                  value={uploadProductId} 
                  onChange={(e) => setUploadProductId(e.target.value)} 
                  style={{ width: '100%' }}
                >
                  <option value="">General Company Knowledge (No specific product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {uploadError && (
                <div className="badge badge-rose" style={{ padding: '10px 14px', borderRadius: '8px', display: 'block' }}>
                  {uploadError}
                </div>
              )}

              {uploadResult && (
                <div className="clean-card" style={{ padding: '14px', background: 'var(--status-emerald-bg)', borderColor: 'var(--status-emerald-border)', color: 'var(--status-emerald-text)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} /> File Ingested Successfully!
                  </div>
                  <div>File: <strong>{uploadResult.filename}</strong> ({uploadResult.file_type.toUpperCase()})</div>
                  <div>Created and vector-indexed <strong>{uploadResult.chunks_indexed}</strong> knowledge chunks ({uploadResult.total_characters} characters) into RAG database.</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)} 
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {uploadResult ? 'Close' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !selectedFile} 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Ingesting & Embedding...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} /> Upload & Index
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create / Edit Knowledge Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-window">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {resolvingQueryId 
                  ? 'Resolve & Index Missed Question' 
                  : editingKnowledge 
                  ? 'Edit Knowledge Chunk' 
                  : 'Add Knowledge Chunk'}
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
                  Associated Product (Optional)
                </label>
                <select 
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)} 
                  style={{ width: '100%' }}
                >
                  <option value="">General Knowledge (No Product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Documentation Text / FAQ Answer *
                </label>
                <textarea 
                  rows={7} 
                  required 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Paste product features, pricing guidelines, or support answers..." 
                  style={{ width: '100%', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Save & Index Chunk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

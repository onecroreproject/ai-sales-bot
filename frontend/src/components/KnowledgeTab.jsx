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
  FileText
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
      if (resolvingQueryId) {
        // Extract answer part if user filled it
        let answerText = content;
        const answerPrefix = 'Answer: ';
        if (content.includes(answerPrefix)) {
          answerText = content.split(answerPrefix).slice(1).join(answerPrefix).trim();
        }
        await api.resolveUnansweredQuery(resolvingQueryId, answerText || content, productId);
        setUnansweredQueries(unansweredQueries.map(q => q.id === resolvingQueryId ? { ...q, status: 'resolved' } : q));
        if (onRefresh) onRefresh();
      } else if (editingKnowledge) {
        const payload = {
          company_id: companyId,
          product_id: productId ? parseInt(productId) : null,
          content,
        };
        await onUpdateKnowledge(editingKnowledge.id, payload);
      } else {
        const payload = {
          company_id: companyId,
          product_id: productId ? parseInt(productId) : null,
          content,
        };
        await onCreateKnowledge(payload);
      }
      setIsModalOpen(false);
      setResolvingQueryId(null);
    } catch (err) {
      alert('Failed to save knowledge item: ' + err.message);
    }
  };

  const handleDismissQuery = async (queryId) => {
    try {
      await api.dismissUnansweredQuery(queryId);
      setUnansweredQueries(unansweredQueries.filter(q => q.id !== queryId));
    } catch (err) {
      alert('Failed to dismiss query: ' + err.message);
    }
  };

  const handleStartCrawl = async (e) => {
    e.preventDefault();
    if (!crawlUrl.trim() || crawling) return;
    setCrawling(true);
    setCrawlError(null);
    setCrawlResult(null);

    try {
      const res = await api.crawlWebsite(crawlUrl.trim(), crawlProductId);
      setCrawlResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setCrawlError(err.message || 'Auto-crawl failed. Please ensure the URL is publicly reachable.');
    } finally {
      setCrawling(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadProductId) {
        formData.append('product_id', uploadProductId);
      }
      const res = await api.uploadDocument(formData);
      setUploadResult(res);
      if (onRefresh) onRefresh();
    } catch (err) {
      setUploadError(err.message || 'Document processing failed. Please check file format.');
    } finally {
      setUploading(false);
    }
  };

  const pendingUnansweredCount = unansweredQueries.filter(q => q.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--accent-indigo)" /> Knowledge Base & RAG Index
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Train your AI sales bot with multi-format files (PDF, Word, Excel, CSV), website crawling, and knowledge learning.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setUploadError(null);
              setIsUploadModalOpen(true);
            }} 
            className="btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontWeight: 600
            }}
          >
            <UploadCloud size={16} /> 📁 Upload Document
          </button>

          <button 
            onClick={() => {
              setCrawlResult(null);
              setCrawlError(null);
              setIsCrawlModalOpen(true);
            }} 
            className="btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--accent-indigo)',
              fontWeight: 600
            }}
          >
            <Globe size={16} /> 🌐 Auto-Crawl URL
          </button>

          <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> Add Knowledge Chunk
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('knowledge')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'knowledge' ? 'var(--accent-indigo)' : 'transparent',
            color: activeSubTab === 'knowledge' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={15} /> Indexed Knowledge Chunks ({knowledgeList.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('unanswered');
            fetchUnanswered();
          }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'unanswered' ? 'var(--accent-indigo)' : 'transparent',
            color: activeSubTab === 'unanswered' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <HelpCircle size={15} /> Unanswered Visitor Questions
          {pendingUnansweredCount > 0 && (
            <span style={{ 
              background: '#f59e0b', 
              color: '#000', 
              padding: '1px 6px', 
              borderRadius: '10px', 
              fontSize: '11px', 
              fontWeight: 700 
            }}>
              {pendingUnansweredCount}
            </span>
          )}
        </button>
      </div>

      {/* SUB TAB 1: Indexed Knowledge Base */}
      {activeSubTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Loading knowledge base...</div>
          ) : knowledgeList.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>No knowledge entries found</div>
              <p style={{ fontSize: '13.5px', marginTop: '6px', maxWidth: '500px', margin: '6px auto 16px auto' }}>
                Give your bot accurate company facts. You can either auto-crawl a website URL or manually add documentation chunks.
              </p>
              <button onClick={() => setIsCrawlModalOpen(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} /> Auto-Crawl Website URL
              </button>
            </div>
          ) : (
            knowledgeList.map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              const isWebCrawl = item.content.startsWith('[Source:');
              const isDoc = item.content.startsWith('[File:');
              return (
                <div key={item.id} className="glass-card glass-card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Cpu size={12} /> 1536-VECTOR INDEXED
                      </span>
                      {isWebCrawl ? (
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} /> Webpage Crawl
                        </span>
                      ) : null}
                      {isDoc ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={12} /> Document Upload
                        </span>
                      ) : null}
                      {product && (
                        <span className="badge badge-indigo">
                          {product.name}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
      )}

      {/* SUB TAB 2: Unanswered Questions (Missed Queries Log) */}
      {activeSubTab === 'unanswered' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Questions website visitors asked that the AI did not find knowledge for. Turn any missed question into verified knowledge in 1 click!
            </p>
            <button onClick={fetchUnanswered} className="btn-secondary" disabled={loadingUnanswered} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
              <RefreshCw size={13} className={loadingUnanswered ? 'animate-spin' : ''} /> Refresh List
            </button>
          </div>

          {loadingUnanswered ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Loading missed questions...</div>
          ) : unansweredQueries.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Zero Unanswered Questions!</div>
              <p style={{ fontSize: '13.5px', marginTop: '6px' }}>
                Your AI bot has enough knowledge context to answer visitor queries, or no missed questions have been logged yet.
              </p>
            </div>
          ) : (
            unansweredQueries.map((q) => {
              const isResolved = q.status === 'resolved';
              return (
                <div key={q.id} className="glass-card glass-card-hover" style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', borderLeft: isResolved ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {isResolved ? (
                        <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> RESOLVED & INDEXED
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> KNOWLEDGE GAP / UNANSWERED
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {q.created_at ? new Date(q.created_at).toLocaleString() : 'Recently asked'}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      "{q.question}"
                    </div>

                    {q.ai_response && (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '6px', marginTop: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Bot Answered: </span>
                        {q.ai_response}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isResolved && (
                      <button 
                        onClick={() => openResolveModal(q)} 
                        className="btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '8px 14px' }}
                      >
                        <Plus size={14} /> Add to Knowledge Base
                      </button>
                    )}
                    <button 
                      onClick={() => handleDismissQuery(q.id)} 
                      className="btn-secondary" 
                      style={{ fontSize: '12px', padding: '8px 12px' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '600px', padding: '28px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                <Globe size={20} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Auto-Crawl Website & Vector Index
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
              Provide a website URL (e.g., your homepage, about page, or services catalog). The crawler will fetch the page, clean HTML noise, chunk text, and compute OpenAI vector embeddings.
            </p>

            <form onSubmit={handleStartCrawl} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Website / Webpage URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://1cnews.1crorebahrainjobs.com/about-us"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Associated Product (Optional)
                </label>
                <select 
                  value={crawlProductId} 
                  onChange={(e) => setCrawlProductId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">General Company Knowledge (No specific product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {crawlError && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px' }}>
                  {crawlError}
                </div>
              )}

              {crawlResult && (
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '13px' }}>
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
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {crawling ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Crawling & Indexing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Start Auto-Crawl & Index
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload Document Modal (.pdf, .docx, .xlsx, .csv, .txt) */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '600px', padding: '28px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <UploadCloud size={20} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upload Document & Vector Index
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px' }}>
              Upload company documents, price books, FAQ guides, or product catalogs. Supported formats: <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, <strong>Excel (.xlsx)</strong>, <strong>CSV (.csv)</strong>, and <strong>Plain Text (.txt)</strong>.
            </p>

            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px dashed var(--border-glass)', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                />
                {selectedFile && (
                  <div style={{ fontSize: '12.5px', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Associated Product (Optional)
                </label>
                <select 
                  value={uploadProductId} 
                  onChange={(e) => setUploadProductId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">General Company Knowledge (No specific product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {uploadError && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px' }}>
                  {uploadError}
                </div>
              )}

              {uploadResult && (
                <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '13px' }}>
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
                  style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Parsing & Embedding...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} /> Upload & Vector Index
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Edit / Resolve Knowledge Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '580px', padding: '28px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {resolvingQueryId 
                ? 'Resolve & Index Missed Question' 
                : editingKnowledge 
                ? 'Edit Knowledge Chunk' 
                : 'Add Knowledge Chunk'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Associated Product
                </label>
                <select 
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">General Knowledge (No Product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
                  Save & Generate 1536-Embedding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

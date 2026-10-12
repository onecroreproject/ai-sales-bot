import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Globe, 
  MapPin, 
  Clock, 
  User, 
  Bot, 
  Search, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Users,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';

export default function ConversationsTab() {
  const [conversations, setConversations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.getConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      } else if (data && selectedSession) {
        // Keep selected session updated
        const match = data.find(s => s.session_id === selectedSession.session_id);
        if (match) setSelectedSession(match);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation transcript?')) return;
    try {
      await api.deleteConversation(sessionId);
      const updated = conversations.filter(s => s.session_id !== sessionId);
      setConversations(updated);
      if (selectedSession?.session_id === sessionId) {
        setSelectedSession(updated[0] || null);
      }
    } catch (err) {
      alert('Failed to delete conversation: ' + err.message);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const q = searchFilter.toLowerCase();
    if (!q) return true;
    const matchesDomain = (c.origin_domain || '').toLowerCase().includes(q);
    const matchesLoc = (c.location || '').toLowerCase().includes(q);
    const matchesMessages = c.messages.some(m => (m.content || '').toLowerCase().includes(q));
    const matchesLead = c.lead && ((c.lead.name || '').toLowerCase().includes(q) || (c.lead.email || '').toLowerCase().includes(q));
    return matchesDomain || matchesLoc || matchesMessages || matchesLead;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={24} color="var(--accent-indigo)" /> Live Conversations & Visitor Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Inspect real-time questions asked by website visitors, bot answers, and visitor geographical origins.
          </p>
        </div>
        <button 
          onClick={fetchConversations} 
          className="btn-secondary" 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Main Inbox Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left Column: Sessions List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Search Box */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by question, website, or location..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px', fontSize: '12px', height: '34px' }}
              />
            </div>
          </div>

          {/* Sessions Scroll List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loading && conversations.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading visitor logs...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No conversations yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  When visitors ask questions on your embedded widget, their full chat history and location appear here.
                </div>
              </div>
            ) : (
              filteredConversations.map((sess) => {
                const isSelected = selectedSession?.session_id === sess.session_id;
                const lastMsg = sess.messages[sess.messages.length - 1];
                const firstUserMsg = sess.messages.find(m => m.role === 'user') || lastMsg;

                return (
                  <div
                    key={sess.session_id}
                    onClick={() => setSelectedSession(sess)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} /> {sess.origin_domain}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {sess.created_at ? new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {firstUserMsg ? firstUserMsg.content : 'New Visitor Session'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <MapPin size={11} /> {sess.location}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {sess.lead && (
                          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Lead Captured
                          </span>
                        )}
                        <span style={{ fontSize: '10px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '4px' }}>
                          {sess.message_count} msgs
                        </span>
                        <button
                          onClick={(e) => handleDelete(sess.session_id, e)}
                          title="Delete session"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '2px', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Conversation Transcript */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {selectedSession ? (
            <>
              {/* Transcript Top Meta Banner */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-glass)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Visitor Session: {selectedSession.session_id.slice(0, 16)}...
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      background: 'rgba(99, 102, 241, 0.2)', 
                      color: '#818cf8', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Globe size={11} /> {selectedSession.origin_domain}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600 }}>
                      <MapPin size={12} /> Location: {selectedSession.location}
                    </span>
                    <span>•</span>
                    <span>IP: {selectedSession.ip_address}</span>
                    <span>•</span>
                    <span>Started: {selectedSession.created_at ? new Date(selectedSession.created_at).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>

                {selectedSession.lead && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textAlign: 'right'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Users size={12} /> Converted Prospect
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedSession.lead.name || selectedSession.lead.email}
                    </div>
                    {selectedSession.lead.phone && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedSession.lead.phone}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Chat Stream */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'var(--bg-secondary)'
              }}>
                {selectedSession.messages.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No messages recorded in this session yet.
                  </div>
                ) : (
                  selectedSession.messages.map((m, idx) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          alignSelf: isUser ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {isUser ? (
                            <>
                              <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Visitor</span>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={10} />
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={10} />
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Sales Bot</span>
                              <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </>
                          )}
                        </div>

                        <div style={{
                          padding: '12px 16px',
                          borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-card)',
                          color: isUser ? '#ffffff' : 'var(--text-primary)',
                          border: isUser ? 'none' : '1px solid var(--border-glass)',
                          fontSize: '13.5px',
                          lineHeight: '1.5',
                          boxShadow: 'var(--shadow-sm)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)' }}>
              <MessageSquare size={42} style={{ opacity: 0.4 }} />
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Select a visitor conversation on the left</div>
              <div style={{ fontSize: '13px' }}>You will see all questions asked and the exact AI answers provided.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

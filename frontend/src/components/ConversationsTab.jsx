import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Send,
  UserCheck,
  Radio,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';

export default function ConversationsTab() {
  const [conversations, setConversations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [agentReplyText, setAgentReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [mobileViewingChat, setMobileViewingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.getConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      } else if (data && selectedSession) {
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
        setMobileViewingChat(false);
      }
    } catch (err) {
      alert('Failed to delete conversation: ' + err.message);
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSession || !agentReplyText.trim() || sendingReply) return;
    const content = agentReplyText.trim();
    setSendingReply(true);
    try {
      const res = await api.sendAgentReply(selectedSession.session_id, content);
      const newMsg = {
        id: res.id || Date.now(),
        role: 'agent',
        content,
        created_at: new Date().toISOString()
      };
      const updatedMessages = [...(selectedSession.messages || []), newMsg];
      const updatedSession = { ...selectedSession, mode: 'human', messages: updatedMessages };
      setSelectedSession(updatedSession);
      setConversations(conversations.map(c => c.session_id === selectedSession.session_id ? updatedSession : c));
      setAgentReplyText('');
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      alert('Failed to send live agent reply: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleMode = async () => {
    if (!selectedSession) return;
    const nextMode = selectedSession.mode === 'human' ? 'ai' : 'human';
    try {
      await api.setConversationMode(selectedSession.session_id, nextMode);
      const updatedSession = { ...selectedSession, mode: nextMode };
      setSelectedSession(updatedSession);
      setConversations(conversations.map(c => c.session_id === selectedSession.session_id ? updatedSession : c));
    } catch (err) {
      alert('Failed to switch conversation mode: ' + err.message);
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
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={24} color="var(--brand-primary)" /> Live Conversations & Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Inspect real-time visitor interactions, review AI bot qualification, and step in with live agent takeover.
          </p>
        </div>
        <button 
          onClick={fetchConversations} 
          className="btn-secondary" 
          disabled={loading}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Stream
        </button>
      </div>

      {/* Main Split-Pane Workspace */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth > 900 ? '340px 1fr' : '1fr', 
        gap: '20px', 
        flex: 1, 
        minHeight: 0 
      }}>
        {/* Left Column: Sessions Queue */}
        <div 
          className="clean-card" 
          style={{ 
            display: (window.innerWidth <= 900 && mobileViewingChat) ? 'none' : 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden' 
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search visitor query, site..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', height: '36px', borderRadius: '9999px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Sessions List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {loading && conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading visitor logs...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} color="var(--border-medium)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>No conversations yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Visitor chats from your embedded widget will show up here live.
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
                    onClick={() => {
                      setSelectedSession(sess);
                      setMobileViewingChat(true);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--brand-light)' : 'transparent',
                      border: isSelected ? '1px solid var(--brand-primary)' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} /> {sess.origin_domain || 'Direct Widget'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {sess.created_at ? new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {firstUserMsg ? firstUserMsg.content : 'New Visitor Session'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <MapPin size={11} color="#059669" /> {sess.location || 'Online Visitor'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {sess.lead && (
                          <span className="badge badge-emerald" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Lead
                          </span>
                        )}
                        <span style={{ fontSize: '10px', background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
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

        {/* Right Column: Active Conversation Transcript & Takeover Console */}
        <div 
          className="clean-card" 
          style={{ 
            display: (window.innerWidth <= 900 && !mobileViewingChat) ? 'none' : 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden' 
          }}
        >
          {selectedSession ? (
            <>
              {/* Header with Live Human Takeover Switch */}
              <div style={{
                padding: '16px 22px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setMobileViewingChat(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: window.innerWidth <= 900 ? 'flex' : 'none' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    <User size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedSession.lead ? selectedSession.lead.name || 'Verified Prospect' : 'Live Website Visitor'}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{selectedSession.origin_domain}</span>
                      <span>&bull;</span>
                      <span>{selectedSession.location}</span>
                    </div>
                  </div>
                </div>

                {/* Takeover Mode Toggle Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={handleToggleMode}
                    className={selectedSession.mode === 'human' ? 'badge badge-amber' : 'badge badge-emerald'}
                    style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '12px' }}
                    title="Click to toggle between AI Agent and Live Human Specialist"
                  >
                    <span className="pulse-dot" style={{ color: selectedSession.mode === 'human' ? '#d97706' : '#059669' }} />
                    {selectedSession.mode === 'human' ? 'Live Human Takeover' : 'Autonomous AI Active'}
                  </button>
                </div>
              </div>

              {/* Chat Message Transcript Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: 'var(--bg-canvas)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {selectedSession.messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  const isAgent = m.role === 'agent';

                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        maxWidth: '78%',
                        flexDirection: isUser ? 'row-reverse' : 'row'
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isUser ? '#e2e8f0' : isAgent ? '#dbeafe' : '#f1f5f9',
                          color: isUser ? '#475569' : isAgent ? '#1d4ed8' : '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {isUser ? <User size={14} /> : isAgent ? <UserCheck size={14} /> : <Bot size={14} />}
                        </div>

                        <div style={{
                          padding: '12px 16px',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isUser ? '#2563eb' : 'var(--bg-surface)',
                          color: isUser ? '#ffffff' : 'var(--text-primary)',
                          boxShadow: isUser ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'var(--shadow-subtle)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          border: isUser ? 'none' : '1px solid var(--border-subtle)'
                        }}>
                          {m.content}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        padding: '0 36px'
                      }}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Agent Reply Box */}
              <form 
                onSubmit={handleSendReply}
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="text"
                  placeholder={selectedSession.mode === 'human' ? "Reply directly to visitor as human agent..." : "Type reply (automatically switches to Human Takeover)..."}
                  value={agentReplyText}
                  onChange={(e) => setAgentReplyText(e.target.value)}
                  style={{ flex: 1, borderRadius: '9999px', height: '42px', paddingLeft: '18px' }}
                />
                <button
                  type="submit"
                  disabled={sendingReply || !agentReplyText.trim()}
                  className="btn-primary"
                  style={{ height: '42px', padding: '0 20px' }}
                >
                  <Send size={15} /> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} color="var(--border-medium)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Select a conversation</div>
              <div style={{ fontSize: '13px' }}>Click on any visitor thread on the left to view transcript.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

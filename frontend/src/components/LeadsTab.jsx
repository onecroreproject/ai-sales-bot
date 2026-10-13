import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Building2, 
  Search, 
  Trash2, 
  Eye, 
  Plus, 
  Download, 
  MapPin, 
  Globe, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Sparkles, 
  X, 
  FileSpreadsheet,
  Layers,
  UserCheck,
  HelpCircle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export default function LeadsTab({ 
  leads, 
  companyId, 
  onCreateLead, 
  onUpdateLead, 
  onDeleteLead, 
  loading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFieldsInfo, setShowFieldsInfo] = useState(true);

  // New Lead Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newStatus, setNewStatus] = useState('new');
  const [savingLead, setSavingLead] = useState(false);

  const filteredLeads = (leads || []).filter((lead) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (lead.name || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.phone || '').toLowerCase().includes(q) ||
      (lead.company_name || '').toLowerCase().includes(q) ||
      (lead.requirement || '').toLowerCase().includes(q) ||
      (lead.location || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': 
        return <span className="badge badge-blue"><Sparkles size={11} /> New Lead</span>;
      case 'contacted': 
        return <span className="badge badge-amber"><Clock size={11} /> Contacted</span>;
      case 'converted': 
        return <span className="badge badge-emerald"><CheckCircle2 size={11} /> Converted</span>;
      case 'lost': 
        return <span className="badge badge-rose">Lost</span>;
      default: 
        return <span className="badge badge-blue">{status || 'New'}</span>;
    }
  };

  const handleExportCSV = () => {
    if (!leads || leads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const headers = [
      'Lead ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Company Name',
      'Specific Requirement',
      'Lifecycle Status',
      'Captured Date',
      'Visitor Location',
      'Referral Domain'
    ];

    const rows = leads.map(l => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.company_name || '').replace(/"/g, '""')}"`,
      `"${(l.requirement || '').replace(/"/g, '""')}"`,
      l.status || 'new',
      l.created_at ? new Date(l.created_at).toISOString() : '',
      `"${(l.location || 'Online Visitor').replace(/"/g, '""')}"`,
      `"${(l.origin_domain || 'Direct / Widget').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_pipeline_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateLead) return;
    setSavingLead(true);
    try {
      await onCreateLead({
        name: newName.trim() || null,
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        company_name: newCompany.trim() || null,
        requirement: newRequirement.trim() || null,
        status: newStatus,
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewCompany('');
      setNewRequirement('');
      setNewStatus('new');
    } catch (err) {
      alert('Failed to add lead: ' + err.message);
    } finally {
      setSavingLead(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Primary Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={26} color="#6366f1" /> Leads Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            High-intent prospects and buying leads automatically captured by your AI Sales Bot during chat conversations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', padding: '9px 15px' }}
            title="Download CSV export"
          >
            <Download size={15} /> Export CSV ({leads?.length || 0})
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', padding: '9px 16px' }}
          >
            <Plus size={16} /> + Add Lead Manually
          </button>
        </div>
      </div>

      {/* Explainer Banner: All Data Points Collected by Chatbot */}
      {showFieldsInfo && (
        <div className="glass-card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(99, 102, 241, 0.25)', position: 'relative' }}>
          <button
            onClick={() => setShowFieldsInfo(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="Dismiss banner"
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Layers size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Complete Data Schema Captured by AI Sales Bot
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                During live chat sessions, our natural language model gathers and cross-references all the following parameters:
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <UserCheck size={16} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>1. Full Prospect Name</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>First & last name of visitor</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Mail size={16} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>2. Verified Email Address</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corporate or personal email</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Phone size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>3. Direct Phone Number</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobile, office or WhatsApp</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Building2 size={16} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>4. Company / Business</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prospect's organization name</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Sparkles size={16} color="#ec4899" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>5. Specific Requirement</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custom needs, volume & specs</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <MapPin size={16} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>6. Visitor Geolocation</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>City, region & country of visitor</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Globe size={16} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>7. Origin Domain & URL</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Landing page that converted</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <Calendar size={16} color="#a855f7" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>8. Timestamp & Status</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live lead date & CRM stage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, email, company, requirement, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '320px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '13px', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Statuses ({leads?.length || 0})</option>
              <option value="new">New Leads</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredLeads.length}</strong> of <strong>{leads?.length || 0}</strong> prospects
        </div>
      </div>

      {/* Main Leads Data Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <th style={{ padding: '14px 18px' }}>Prospect Name</th>
              <th style={{ padding: '14px 18px' }}>Contact Details</th>
              <th style={{ padding: '14px 18px' }}>Company & Requirement</th>
              <th style={{ padding: '14px 18px' }}>Origin & Location</th>
              <th style={{ padding: '14px 18px' }}>Captured Date</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leads pipeline...</td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <TrendingUp size={36} style={{ opacity: 0.3, margin: '0 auto 10px auto', display: 'block' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No leads found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search criteria or status filter.' : 'Qualified leads will automatically appear here as visitors interact with your AI bot.'}
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="btn-primary" 
                    style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Plus size={15} /> Add First Lead Manually
                  </button>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const initials = (lead.name || 'A').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }}>
                    
                    {/* 1. Prospect Name with Avatar */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '34px', 
                          height: '34px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                          color: '#fff', 
                          fontWeight: 700, 
                          fontSize: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {lead.name || 'Anonymous Prospect'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ID #{lead.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Contact Info */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--accent-indigo)', textDecoration: 'none' }}>
                            <Mail size={13} /> {lead.email}
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No email</span>
                        )}
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#10b981', textDecoration: 'none' }}>
                            <Phone size={13} /> {lead.phone}
                          </a>
                        ) : null}
                      </div>
                    </td>

                    {/* 3. Company & Requirement */}
                    <td style={{ padding: '14px 18px', maxWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                        <Building2 size={14} color="var(--text-muted)" />
                        {lead.company_name || 'Individual Prospect'}
                      </div>
                      {lead.requirement && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          background: 'var(--bg-secondary)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          maxWidth: '260px'
                        }} title={lead.requirement}>
                          "{lead.requirement}"
                        </div>
                      )}
                    </td>

                    {/* 4. Origin & Location */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <MapPin size={13} color="#8b5cf6" />
                          {lead.location || 'Online Visitor'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <Globe size={12} />
                          {lead.origin_domain || 'Direct / Widget'}
                        </div>
                      </div>
                    </td>

                    {/* 5. Date */}
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                      {lead.created_at && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '19px' }}>
                          {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    {/* 6. Status */}
                    <td style={{ padding: '14px 18px' }}>
                      {getStatusBadge(lead.status)}
                    </td>

                    {/* 7. Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedLead(lead)} 
                          className="btn-secondary" 
                          style={{ padding: '6px 10px' }} 
                          title="View all 8 collected fields"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => onDeleteLead(lead.id)} 
                          className="btn-danger" 
                          style={{ padding: '6px 10px' }} 
                          title="Delete lead record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Lead Details Drawer / Modal */}
      {selectedLead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card" style={{ width: '600px', padding: '28px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(selectedLead.name || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedLead.name || 'Anonymous Prospect'}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lead ID #{selectedLead.id} &bull; Captured via AI Chatbot</span>
                </div>
              </div>

              {getStatusBadge(selectedLead.status)}
            </div>

            {/* Collected Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.email || 'N/A'}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#10b981' }}>{selectedLead.phone || 'N/A'}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Company Name</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLead.company_name || 'N/A'}</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Captured Date & Time</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Visitor Location</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {selectedLead.location || 'Online Visitor'}
                </span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>Origin Domain</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={13} /> {selectedLead.origin_domain || 'Direct / Widget'}
                </span>
              </div>
            </div>

            {/* Requirement Box */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Customer Stated Requirement / Pain Point
              </span>
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '8px', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {selectedLead.requirement || 'No specific requirement provided.'}
              </div>
            </div>

            {/* Change Status Action */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Update Pipeline Status:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['new', 'contacted', 'converted', 'lost'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateLead(selectedLead.id, { status: st });
                      setSelectedLead({ ...selectedLead, status: st });
                    }}
                    className={selectedLead.status === st ? 'btn-primary' : 'btn-secondary'}
                    style={{ textTransform: 'capitalize', fontSize: '12.5px', padding: '6px 14px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setSelectedLead(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Close Lead Profile
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Lead Manually */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card" style={{ width: '560px', padding: '28px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Plus size={20} />
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add New Lead Manually
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Create a CRM lead record manually for offline clients, calls, or trade shows.
            </p>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Prospect Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+973 33123456"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Specific Business Requirement
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding requested products, quantity, or implementation timeline..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Initial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {savingLead ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

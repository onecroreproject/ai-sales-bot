import React, { useState } from 'react';
import { Mail, Phone, Building2, Search, Trash2, Eye } from 'lucide-react';

export default function LeadsTab({ leads, companyId, onUpdateLead, onDeleteLead, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (lead.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <span className="badge badge-indigo">NEW</span>;
      case 'contacted': return <span className="badge badge-amber">CONTACTED</span>;
      case 'converted': return <span className="badge badge-emerald">CONVERTED</span>;
      default: return <span className="badge badge-indigo">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Leads Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Qualified leads automatically captured by your AI Sales Bot during chat interactions.
          </p>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', width: '220px' }}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <th style={{ padding: '14px 20px' }}>Prospect Name</th>
              <th style={{ padding: '14px 20px' }}>Contact Info</th>
              <th style={{ padding: '14px 20px' }}>Company</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leads...</td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No leads found.</td></tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {lead.name || 'Anonymous Prospect'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}><Mail size={14} color="#6366f1" /> {lead.email}</div>}
                      {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}><Phone size={14} color="#10b981" /> {lead.phone}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={15} color="var(--text-muted)" /> {lead.company_name || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {getStatusBadge(lead.status)}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button onClick={() => setSelectedLead(lead)} className="btn-secondary" style={{ padding: '6px 10px' }} title="View details">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => onDeleteLead(lead.id)} className="btn-danger" style={{ padding: '6px 10px' }} title="Delete lead">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card" style={{ width: '540px', padding: '28px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Lead Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', color: 'var(--text-primary)' }}>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Name:</strong> {selectedLead.name || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Email:</strong> {selectedLead.email || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Phone:</strong> {selectedLead.phone || 'N/A'}</div>
              <div><strong style={{ color: 'var(--text-secondary)' }}>Company:</strong> {selectedLead.company_name || 'N/A'}</div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Business Requirement:</strong>
                <p style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '13px', lineHeight: '1.5' }}>
                  {selectedLead.requirement || 'No specific requirement recorded.'}
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Update Status:</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['new', 'contacted', 'converted'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onUpdateLead(selectedLead.id, { status: st });
                        setSelectedLead({ ...selectedLead, status: st });
                      }}
                      className={selectedLead.status === st ? 'btn-primary' : 'btn-secondary'}
                      style={{ textTransform: 'capitalize', fontSize: '13px' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setSelectedLead(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

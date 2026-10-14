import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Package, 
  DollarSign, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Trash2,
  Activity,
  Cpu,
  HardDrive,
  Mail,
  RefreshCw,
  Shield,
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';
import { api } from '../api/client';

export default function SuperAdminTab() {
  const [activeSection, setActiveSection] = useState('tenants'); // 'tenants' | 'health' | 'audit'
  const [data, setData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [triggeringCrawl, setTriggeringCrawl] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [crawlMessage, setCrawlMessage] = useState('');

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const res = await api.getSuperAdminStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load Super Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    setHealthLoading(true);
    try {
      const res = await api.getSystemHealth();
      setHealthData(res);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAuditLogs('', 100);
      setAuditLogs(res || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleTabChange = (section) => {
    setActiveSection(section);
    if (section === 'health' && !healthData) {
      fetchHealthData();
    } else if (section === 'audit' && auditLogs.length === 0) {
      fetchAuditLogs();
    }
  };

  const handleApproveCompany = async (companyId) => {
    setApprovingId(companyId);
    try {
      await api.updateCompany(companyId, { is_verified: true, is_active: true });
      await fetchSuperAdminData();
    } catch (err) {
      alert('Failed to approve company: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('WARNING: Are you sure you want to completely DELETE this company? This will erase all their users, leads, products, and knowledge vectors immediately!')) return;
    
    setDeletingId(companyId);
    try {
      await api.deleteCompany(companyId);
      await fetchSuperAdminData();
    } catch (err) {
      alert('Failed to delete company: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTriggerScheduledCrawls = async () => {
    setTriggeringCrawl(true);
    setCrawlMessage('');
    try {
      const res = await api.triggerScheduledCrawls();
      setCrawlMessage(res.message || 'Scheduled crawling job completed successfully.');
      if (activeSection === 'health') fetchHealthData();
    } catch (err) {
      alert('Crawl execution failed: ' + err.message);
    } finally {
      setTriggeringCrawl(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Super Admin Platform Data...</div>;
  }

  const companies = (data?.companies || []).filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.website || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Super Admin Governance</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Multi-tenant control, background task orchestration, health monitoring & security audit logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-subtle)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => handleTabChange('tenants')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSection === 'tenants' ? 'var(--brand-primary)' : 'transparent',
              color: activeSection === 'tenants' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={15} /> Company Tenants
          </button>
          <button
            onClick={() => handleTabChange('health')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSection === 'health' ? 'var(--brand-primary)' : 'transparent',
              color: activeSection === 'health' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={15} /> System Health & Tasks
          </button>
          <button
            onClick={() => handleTabChange('audit')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSection === 'audit' ? 'var(--brand-primary)' : 'transparent',
              color: activeSection === 'audit' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Shield size={15} /> Security & Audit Logs
          </button>
        </div>
      </div>

      {crawlMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--status-emerald-bg)', color: 'var(--status-emerald-text)', border: '1px solid var(--status-emerald-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{crawlMessage}</span>
          <button onClick={() => setCrawlMessage('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}

      {/* SECTION 1: TENANTS */}
      {activeSection === 'tenants' && (
        <>
          {/* Top Platform KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="clean-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--status-blue-bg)', color: 'var(--status-blue-text)' }}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COMPANIES</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{data?.total_companies || 0}</div>
              </div>
            </div>

            <div className="clean-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--status-emerald-bg)', color: 'var(--status-emerald-text)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL LEADS</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{data?.total_leads || 0}</div>
              </div>
            </div>

            <div className="clean-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)' }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PRODUCTS</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{data?.total_products || 0}</div>
              </div>
            </div>

            <div className="clean-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--status-amber-bg)', color: 'var(--status-amber-text)' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>EST. REVENUE</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>${data?.estimated_mrr || 0}</div>
              </div>
            </div>
          </div>

          {/* Tenants Management Table */}
          <div className="clean-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Registered Workspace Tenants ({companies.length})
              </h3>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search company or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <th style={{ padding: '14px 20px' }}>ID</th>
                  <th style={{ padding: '14px 20px' }}>Company Name</th>
                  <th style={{ padding: '14px 20px' }}>Verification Status</th>
                  <th style={{ padding: '14px 20px' }}>Leads</th>
                  <th style={{ padding: '14px 20px' }}>Products</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>No companies found.</td></tr>
                ) : (
                  companies.map((comp) => (
                    <tr key={comp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        #{comp.id}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div>{comp.name}</div>
                        {comp.website && <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 400 }}>{comp.website}</div>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {comp.is_verified ? (
                          <span className="badge badge-emerald">
                            <CheckCircle size={12} /> APPROVED & ACTIVE
                          </span>
                        ) : (
                          <span className="badge badge-amber">
                            <Clock size={12} /> PENDING VERIFICATION
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-blue">{comp.total_leads} LEADS</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-purple">{comp.total_products} PRODUCTS</span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {!comp.is_verified ? (
                            <button
                              onClick={() => handleApproveCompany(comp.id)}
                              disabled={approvingId === comp.id}
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              {approvingId === comp.id ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px' }}>Verified</span>
                          )}

                          <button
                            onClick={() => handleDeleteCompany(comp.id)}
                            disabled={deletingId === comp.id || comp.id === 1}
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px', opacity: comp.id === 1 ? 0.3 : 1 }}
                            title={comp.id === 1 ? "Cannot delete super admin" : "Delete Company"}
                          >
                            {deletingId === comp.id ? 'Deleting...' : <Trash2 size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* SECTION 2: SYSTEM HEALTH & BACKGROUND TASKS */}
      {activeSection === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={fetchHealthData}
              disabled={healthLoading}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <RefreshCw size={14} className={healthLoading ? 'spin' : ''} /> Refresh Health Metrics
            </button>
            <button
              onClick={handleTriggerScheduledCrawls}
              disabled={triggeringCrawl}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Play size={14} /> {triggeringCrawl ? 'Running Due Crawls...' : 'Run Scheduled Auto-Crawlers'}
            </button>
          </div>

          {healthLoading && !healthData ? (
            <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Checking platform health...</div>
          ) : healthData ? (
            <>
              {/* Server Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div className="clean-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={18} color="var(--brand-primary)" /> PostgreSQL Database
                    </div>
                    <span className={`badge ${healthData.database?.status === 'healthy' ? 'badge-emerald' : 'badge-rose'}`}>
                      {healthData.database?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {healthData.database?.latency_ms} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>ms latency</span>
                  </div>
                </div>

                <div className="clean-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={18} color="#8b5cf6" /> Server CPU Usage
                    </div>
                    <span className="badge badge-purple">{healthData.system_resources?.cpu_usage_percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${healthData.system_resources?.cpu_usage_percent || 0}%`, height: '100%', background: '#8b5cf6' }}></div>
                  </div>
                </div>

                <div className="clean-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HardDrive size={18} color="#10b981" /> Memory (RAM)
                    </div>
                    <span className="badge badge-emerald">{healthData.system_resources?.memory_usage_percent}%</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Available: {healthData.system_resources?.memory_available_mb} MB
                  </div>
                </div>

                <div className="clean-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={18} color="#f59e0b" /> SMTP Email Service
                    </div>
                    <span className={`badge ${healthData.services?.smtp?.status === 'configured' ? 'badge-emerald' : 'badge-amber'}`}>
                      {healthData.services?.smtp?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Host: {healthData.services?.smtp?.host}:{healthData.services?.smtp?.port}
                  </div>
                </div>
              </div>

              {/* Background Tasks Overview */}
              <div className="clean-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Background Task Workers & Knowledge Vectors
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue Auto-Crawls</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: healthData.services?.background_crawlers?.overdue_tasks > 0 ? 'var(--status-amber-text)' : 'var(--text-primary)' }}>
                      {healthData.services?.background_crawlers?.overdue_tasks || 0}
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Vector Chunks</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {healthData.telemetry?.total_vector_chunks || 0}
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Chat Sessions</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {healthData.telemetry?.total_chat_sessions || 0}
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Model Provider</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                      {healthData.services?.llm_engine?.default_provider?.toUpperCase()} ({healthData.services?.llm_engine?.default_model})
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* SECTION 3: AUDIT & SECURITY LOGS */}
      {activeSection === 'audit' && (
        <div className="clean-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Platform Security & Audit Trails
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Tracks authentication attempts, permission changes, exports, and tenant operations.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              disabled={auditLoading}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <RefreshCw size={14} className={auditLoading ? 'spin' : ''} /> Refresh Logs
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <th style={{ padding: '14px 20px' }}>Timestamp</th>
                <th style={{ padding: '14px 20px' }}>Action</th>
                <th style={{ padding: '14px 20px' }}>User / Subject</th>
                <th style={{ padding: '14px 20px' }}>Resource</th>
                <th style={{ padding: '14px 20px' }}>IP Address</th>
                <th style={{ padding: '14px 20px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit records captured yet. Events will appear here upon user sign-ins, registrations, and administrative updates.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${
                        log.action.includes('failed') ? 'badge-rose' :
                        log.action.includes('registered') ? 'badge-purple' :
                        log.action.includes('login') ? 'badge-emerald' : 'badge-blue'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.user_email || 'System / Anonymous'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {log.resource}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {log.ip_address || 'Internal'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

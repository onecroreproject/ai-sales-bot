import React, { useState, useEffect } from 'react';
import { Building2, Users, Package, DollarSign, Search, ShieldAlert, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export default function SuperAdminTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Super Admin Platform Data...</div>;
  }

  const companies = (data?.companies || []).filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.website || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Platform Command Center
          </h1>
          <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={13} /> SUPER ADMIN ACCESS
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Approve pending tenant company registrations, monitor global platform leads, and track AI model token consumption.
        </p>
      </div>

      {/* Global KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="clean-card clean-card-hover" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Companies</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={19} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_companies || 0}
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Platform Leads Captured</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--status-emerald-bg)', color: 'var(--status-emerald-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={19} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_platform_leads || 0}
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Products</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--status-amber-bg)', color: 'var(--status-amber-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={19} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_platform_products || 0}
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Platform Spend</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={19} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            ${(data?.total_platform_cost_usd || 0).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Companies Verification Table */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Registered Companies ({companies.length})
        </h3>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%', height: '36px', borderRadius: 'var(--radius-pill)', fontSize: '13px' }}
          />
        </div>
      </div>

      <div className="clean-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
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
    </div>
  );
}

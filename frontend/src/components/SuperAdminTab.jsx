import React, { useState, useEffect } from 'react';
import { Building2, Users, Package, DollarSign, Search, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api/client';

export default function SuperAdminTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvingId, setApprovingId] = useState(null);

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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Super Admin Platform Command Center</h1>
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
        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Companies</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_companies || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Platform Leads Captured</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_platform_leads || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Active Products</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {data?.total_platform_products || 0}
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Platform Cost</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            ${(data?.total_platform_cost_usd || 0).toFixed(4)}
          </div>
        </div>
      </div>

      {/* Companies Verification Table */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Registered Tenant Companies ({companies.length})</h3>

        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', width: '240px' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 600 }}>
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
              <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No companies found.</td></tr>
            ) : (
              companies.map((comp) => (
                <tr key={comp.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    #{comp.id}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div>{comp.name}</div>
                    {comp.website && <div style={{ fontSize: '12px', color: 'var(--accent-indigo)' }}>{comp.website}</div>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {comp.is_verified ? (
                      <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} /> APPROVED & ACTIVE
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> PENDING VERIFICATION
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge badge-indigo">{comp.total_leads} LEADS</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge badge-indigo">{comp.total_products} PRODUCTS</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {!comp.is_verified ? (
                      <button
                        onClick={() => handleApproveCompany(comp.id)}
                        disabled={approvingId === comp.id}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {approvingId === comp.id ? 'Approving...' : 'Verify & Approve Company'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No action needed</span>
                    )}
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

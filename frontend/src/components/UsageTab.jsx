import React from 'react';
import { Activity, Cpu, DollarSign, BarChart2, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function UsageTab({ stats, loading }) {
  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading real-time usage analytics...</div>;
  }

  const totalRequests = stats?.total_requests || 0;
  const totalTokens = stats?.total_tokens || 0;
  const totalCost = (stats?.total_cost_usd || 0).toFixed(4);
  const monthlyLimit = 10000;
  const usagePercent = Math.min(100, Math.round((totalRequests / monthlyLimit) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Usage & AI Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Monitor your OpenAI model token consumption, API message volume, and estimated platform costs.
        </p>
      </div>

      {/* Monthly Quota Card */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-indigo)" /> Monthly Message Conversations Quota
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Bring-Your-Own-Key (BYOK) Mode: No artificial platform message caps applied.
            </p>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            ⚡ UNLIMITED BYOK
          </span>
        </div>

        {/* Progress Bar & Quota Status */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            <span>{totalRequests.toLocaleString()} Messages Processed</span>
            <span style={{ color: '#10b981' }}>Unlimited (Your API Key)</span>
          </div>
          <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'var(--bg-primary)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '5px', background: 'linear-gradient(90deg, #10b981, #6366f1)', opacity: 0.85 }} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Your company uses its own direct AI provider key, allowing unmetered throughput without artificial restrictions.
          </p>
        </div>
      </div>

      {/* Usage KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total AI Chat Requests</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {totalRequests.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={13} color="#10b981" /> High-concurrency async resolution
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Tokens Consumed</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 114, 182, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#f472b6" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            {totalTokens.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prompt + Completion tokens
          </div>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated Cost (USD)</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
            ${totalCost}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Based on OpenAI gpt-4o-mini rates
          </div>
        </div>
      </div>

      {/* Model Performance Details Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Active AI Model Configuration
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <th style={{ padding: '10px 0' }}>Model Name</th>
              <th style={{ padding: '10px 0' }}>Embedding Dimension</th>
              <th style={{ padding: '10px 0' }}>Latency (Avg)</th>
              <th style={{ padding: '10px 0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '14px 0', fontWeight: 600, color: 'var(--text-primary)' }}>gpt-4o-mini</td>
              <td style={{ padding: '14px 0', color: 'var(--text-secondary)' }}>1536 (text-embedding-3-small)</td>
              <td style={{ padding: '14px 0', color: 'var(--text-secondary)' }}>~ 320 ms</td>
              <td style={{ padding: '14px 0' }}><span className="badge badge-emerald">OPERATIONAL</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

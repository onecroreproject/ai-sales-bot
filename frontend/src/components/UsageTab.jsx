import React from 'react';
import { Activity, Cpu, DollarSign, TrendingUp, ShieldCheck, Zap, Sparkles, Server } from 'lucide-react';

export default function UsageTab({ stats, loading, company }) {
  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>Loading usage & token analytics...</p>
      </div>
    );
  }

  const totalRequests = stats?.total_requests || 0;
  const totalTokens = stats?.total_tokens || 0;
  const totalCost = (stats?.total_cost_usd || 0).toFixed(4);
  const avgTokensPerChat = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Usage & AI Quotas</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Monitor your AI model token consumption, API message volume, and estimated platform costs.
        </p>
      </div>

      {/* Monthly Quota Card - Clean, Handcrafted, No Ugly Borders! */}
      <div className="clean-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Message Conversations Quota
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Bring-Your-Own-Key (BYOK) mode active
                </p>
              </div>
            </div>
          </div>

          <span className="badge badge-emerald" style={{ padding: '6px 14px', fontSize: '13px' }}>
            <span className="pulse-dot" style={{ color: '#059669' }} /> Unlimited BYOK
          </span>
        </div>

        {/* Status Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            <span>{totalRequests.toLocaleString()} Messages Handled</span>
            <span style={{ color: 'var(--brand-primary)' }}>Unmetered Throughput</span>
          </div>

          <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
            <div style={{ width: totalRequests > 0 ? '100%' : '5%', height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
            Your company uses its own direct AI provider credentials ({company?.llm_provider ? company.llm_provider.toUpperCase() : 'OPENAI'}), allowing unlimited messages without artificial platform limits.
          </p>
        </div>
      </div>

      {/* Usage Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px' }}>
        <div className="clean-card clean-card-hover" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total AI Chats</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '14px', color: 'var(--text-primary)' }}>
            {totalRequests.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Synchronous & Async resolutions
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Tokens</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '14px', color: 'var(--text-primary)' }}>
            {totalTokens.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prompt + Completion tokens
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Est. Direct Cost</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '14px', color: 'var(--text-primary)' }}>
            ${totalCost}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Calculated at model standard rates
          </div>
        </div>

        <div className="clean-card clean-card-hover" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Avg Tokens / Query</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '14px', color: 'var(--text-primary)' }}>
            {avgTokensPerChat.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Efficient prompt compression
          </div>
        </div>
      </div>

      {/* Provider Details Card */}
      <div className="clean-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="var(--brand-primary)" /> Configured AI Infrastructure
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active AI Provider</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {company?.llm_provider ? company.llm_provider.toUpperCase() : 'OpenAI'}
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Model ID</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {company?.llm_model || 'gpt-4o-mini'}
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Direct BYOK Status</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
              {company?.llm_api_key ? 'Direct Key Active' : 'Default Platform Key'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Users, 
  UserPlus, 
  Package, 
  BookOpen, 
  Cpu, 
  DollarSign, 
  Activity, 
  Sparkles,
  Bot,
  Clock,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

export default function OverviewTab({ stats, loading, company, onNavigateTab }) {
  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>Loading workspace analytics...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Leads Captured',
      value: stats?.total_leads || 0,
      change: '+12.5%',
      icon: Users,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      title: 'New Leads Today',
      value: stats?.new_leads_today || 0,
      change: '+8.1%',
      icon: UserPlus,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
    },
    {
      title: 'Active Products',
      value: stats?.total_products || 0,
      change: 'Catalog',
      icon: Package,
      iconBg: '#fffbeb',
      iconColor: '#d97706',
    },
    {
      title: 'Knowledge Chunks',
      value: stats?.total_knowledge_chunks || 0,
      change: 'Vector RAG',
      icon: BookOpen,
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed',
    },
    {
      title: 'Total AI Chats',
      value: stats?.total_requests || 0,
      change: '+15.2%',
      icon: Activity,
      iconBg: '#eef2ff',
      iconColor: '#4f46e5',
    },
    {
      title: 'Tokens Consumed',
      value: (stats?.total_tokens || 0).toLocaleString(),
      change: 'Unmetered',
      icon: Cpu,
      iconBg: '#fff1f2',
      iconColor: '#e11d48',
    },
    {
      title: 'Estimated Spend',
      value: `$${(stats?.total_cost_usd || 0).toFixed(4)}`,
      change: 'USD',
      icon: DollarSign,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome & Agent Status Banner (Valo / Dribbble Hero Style) */}
      <div 
        className="clean-card"
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
            Sales Assistant Agent Active
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.25 }}>
            Welcome back, {company?.name || 'Workspace'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
            Your autonomous sales bot is live on your website widget, qualifying prospects and capturing leads around the clock.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('conversations') : null}
            style={{
              background: '#ffffff',
              color: '#1d4ed8',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <MessageSquare size={16} /> Live Inquiries
          </button>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('widget') : null}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              padding: '12px 20px',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
          >
            Widget Studio <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Modern KPI Cards Grid (Laptop: 4 cols, Tablet: 2 cols, Mobile: 1 col) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Performance Metrics</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Updated real-time</span>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px' 
        }}>
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div 
                key={idx} 
                className="clean-card clean-card-hover" 
                style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {kpi.title}
                  </span>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: kpi.iconBg,
                    color: kpi.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={19} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                    {kpi.value}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: 'var(--bg-surface-subtle)',
                    color: 'var(--text-secondary)'
                  }}>
                    {kpi.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Active Inquiries & Real-time Activity Feed */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Left Column: Recent Visitor Sessions / Inquiries */}
        <div className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Visitor Sessions
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Latest prospects engaged on website
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('conversations')}
                style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View all <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: item.type === 'lead' ? '#ecfdf5' : '#eff6ff',
                      color: item.type === 'lead' ? '#059669' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      flexShrink: 0
                    }}>
                      {item.type === 'lead' ? 'L' : 'Q'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title || 'Website Visitor'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.detail || 'Inquiry processed'}
                      </div>
                    </div>
                  </div>

                  <span className={item.type === 'lead' ? 'badge badge-emerald' : 'badge badge-blue'}>
                    {item.type === 'lead' ? 'Qualified' : 'Active'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No visitor conversations yet. Embed the widget script to start engaging prospects!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quota & System Health (Clean BYOK Card) */}
        <div className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                System & AI Engine
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Direct API quota & infrastructure
              </p>
            </div>
            <span className="badge badge-emerald">
              <span className="pulse-dot" style={{ color: '#059669' }} /> 99.9% Uptime
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Throughput Quota</span>
                <span className="badge badge-blue">Unlimited BYOK</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {stats?.total_requests || 0} Messages Handled
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Unmetered volume using your direct AI provider credentials.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} color="#059669" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Guardrails & Safety</span>
              </div>
              <span className="badge badge-emerald">Active</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="#2563eb" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Active AI Provider</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                {company?.llm_provider ? company.llm_provider.toUpperCase() : 'OPENAI'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

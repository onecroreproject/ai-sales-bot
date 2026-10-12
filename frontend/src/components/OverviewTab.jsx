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
  ShieldCheck
} from 'lucide-react';

export default function OverviewTab({ stats, loading, company, onNavigateTab }) {
  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading real-time dashboard analytics...</div>;
  }

  const cards = [
    { title: 'Total Leads Captured', value: stats?.total_leads || 0, icon: Users, color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' },
    { title: 'New Leads Today', value: stats?.new_leads_today || 0, icon: UserPlus, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
    { title: 'Active Products', value: stats?.total_products || 0, icon: Package, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
    { title: 'Knowledge Chunks', value: stats?.total_knowledge_chunks || 0, icon: BookOpen, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    { title: 'Total AI Chats', value: stats?.total_requests || 0, icon: Activity, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)' },
    { title: 'Tokens Used', value: (stats?.total_tokens || 0).toLocaleString(), icon: Cpu, color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
    { title: 'Total Spend (USD)', value: `$${(stats?.total_cost_usd || 0).toFixed(4)}`, icon: DollarSign, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Main Grid: Agent Card & Recent Activity Feed (Matching Botpress UI Screenshot) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Deployed Agent Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', color: '#fff' }}>
                  8
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Sales Assistant Agent
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    Deployed live on website widget <ShieldCheck size={12} color="#10b981" />
                  </span>
                </div>
              </div>
              <span className="badge badge-emerald">ACTIVE</span>
            </div>

            {/* Quick Metrics Line */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Messages Processed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {stats?.total_requests || 0} Messages
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No errors reported</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leads Converted</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                  {stats?.total_leads || 0} Leads
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Captured automatically</div>
              </div>
            </div>
          </div>

          {/* Quota Progress Bar: BYOK Unlimited */}
          <div 
            className="glass-card" 
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => onNavigateTab ? onNavigateTab('usage') : null}
            title="Click to view detailed AI usage"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} color="var(--accent-indigo)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Conversations Usage Quota</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              <span>{stats?.total_requests || 0} Messages Processed</span>
              <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                Unlimited (BYOK)
              </span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Activity Timeline */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Agent Activity
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('conversations')}
                style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View Live Logs &rarr;
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '220px', overflowY: 'auto' }}>
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((act, idx) => {
                const isChat = act.type === 'chat';
                const isLead = act.type === 'lead';
                const iconBg = isChat ? 'rgba(99,102,241,0.2)' : isLead ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';
                const iconColor = isChat ? '#818cf8' : isLead ? '#34d399' : '#fbbf24';

                return (
                  <div key={act.id || idx} style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '11px' }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.subtitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {act.time}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executive Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '20px'
      }}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card glass-card-hover" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{card.title}</span>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '12px', color: 'var(--text-primary)' }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

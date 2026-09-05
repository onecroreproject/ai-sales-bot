import React from 'react';
import { 
  Users, 
  UserPlus, 
  Package, 
  BookOpen, 
  Cpu, 
  DollarSign, 
  Activity, 
  ExternalLink,
  Sparkles,
  Bot,
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function OverviewTab({ stats, loading, company }) {
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
      {/* Botpress Style Top Highlight Banner */}
      <div className="botpress-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.9 }}>
            <span>AI SALES BOT DESK</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>✓ INCLUDED</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
            AI Helpdesk & Lead Concierge for your Sales Team
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.9, maxWidth: '600px' }}>
            Escalate conversations to human agents, automatically capture leads, and answer product questions 24/7.
          </p>
        </div>
        <button 
          onClick={() => window.location.hash = '#/widget'} 
          className="btn-secondary" 
          style={{ background: '#ffffff', color: '#4f46e5', border: 'none', fontWeight: 700, padding: '10px 18px', flexShrink: 0 }}
        >
          Open Studio <ExternalLink size={15} />
        </button>
      </div>

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

          {/* Quota Progress Bar (Botpress Conversations 0/100 >) */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} color="var(--accent-indigo)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Conversations Usage Quota</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {stats?.total_requests || 0} / 1,000 <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Recent Agent Activity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>1</div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Bot Agent Active</strong> published on site</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> Real-time active
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>2</div>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Knowledge Base Vector Embeddings</strong> updated</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {stats?.total_knowledge_chunks || 0} chunks ready
                </div>
              </div>
            </div>
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

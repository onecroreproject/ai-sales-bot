import React from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  BookOpen, 
  Sliders, 
  Bot, 
  Sparkles,
  X,
  Activity,
  Settings,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  company, 
  leadsCount = 0,
  unreadChatsCount = 0,
  mobileOpen = false,
  onCloseMobile = () => {},
  onLogout = () => {}
}) {
  const isSuperAdmin = user?.email === 'superadmin@platform.com';

  const navItems = isSuperAdmin ? [
    { id: 'superadmin', label: 'Command Center', icon: ShieldAlert },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ] : [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'conversations', label: 'Live Conversations', icon: MessageSquare, badge: unreadChatsCount > 0 ? unreadChatsCount : null },
    { id: 'leads', label: 'Leads Pipeline', icon: Users, badge: leadsCount > 0 ? leadsCount : null },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'guardrails', label: 'AI Guardrails', icon: ShieldCheck },
    { id: 'widget', label: 'Widget Studio', icon: Sliders },
    { id: 'usage', label: 'Usage & Quota', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            transition: 'opacity 0.2s ease',
          }}
          className="hide-on-desktop"
        />
      )}

      <aside style={{
        width: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        zIndex: 50,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(mobileOpen ? {
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          transform: 'translateX(0)',
          boxShadow: 'var(--shadow-modal)'
        } : {})
      }}
      className={mobileOpen ? 'sidebar-mobile-open' : 'sidebar-normal'}
      >
        {/* Brand Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              color: '#ffffff'
            }}>
              <Bot size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                SalesBot AI
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span className="pulse-dot" style={{ color: '#10b981' }} /> Live Platform
              </span>
            </div>
          </div>

          {/* Close button on mobile drawer */}
          <button
            onClick={onCloseMobile}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              padding: '6px', 
              borderRadius: '8px',
              display: 'none'
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 8px 12px' }}>
            Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'var(--brand-light)' : 'transparent',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-surface-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={19} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: isActive ? 'var(--brand-primary)' : 'var(--border-subtle)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}

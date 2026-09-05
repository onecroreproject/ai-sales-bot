import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  BookOpen, 
  Sliders, 
  Bot, 
  Sparkles,
  Menu,
  X,
  Activity,
  CreditCard,
  Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, company }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Home', icon: BarChart3 },
    { id: 'leads', label: 'Leads Pipeline', icon: Users },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'widget', label: 'Widget Studio', icon: Sliders },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: collapsed ? '80px' : '260px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      zIndex: 20,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Brand & Hamburger Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        {!collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <Bot size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AI Sales Bot
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--accent-indigo)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={10} /> PRO PLATFORM
                </span>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: 'transparent', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              title="Collapse Sidebar"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}
            title="Expand Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} color={isActive ? '#6366f1' : 'var(--text-muted)'} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer User Profile (Botpress Style) */}
      <div style={{
        padding: collapsed ? '10px' : '12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        marginTop: 'auto'
      }}>
        {!collapsed ? (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {company ? company.name : 'Company Admin'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user ? user.email : ''}
            </div>
          </div>
        ) : (
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
            {user ? user.email.charAt(0).toUpperCase() : 'A'}
          </div>
        )}
      </div>
    </aside>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from './api/client';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import LeadsTab from './components/LeadsTab';
import ProductsTab from './components/ProductsTab';
import KnowledgeTab from './components/KnowledgeTab';
import WidgetStudioTab from './components/WidgetStudioTab';
import UsageTab from './components/UsageTab';
import SettingsTab from './components/SettingsTab';
import SuperAdminTab from './components/SuperAdminTab';
import ConversationsTab from './components/ConversationsTab';
import GuardrailsTab from './components/GuardrailsTab';
import LoginModal from './components/LoginModal';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut,
  Sparkles,
  X,
  CheckCheck,
  Users,
  Package,
  BookOpen,
  Sliders,
  Activity,
  Settings as SettingsIcon,
  Bot,
  Layers,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Menu
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes('/super-admin') || window.location.hash.includes('super-admin')) {
      return 'superadmin';
    }
    return 'overview';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()));
  const [verifyStatus, setVerifyStatus] = useState(null); // { type: 'success'|'error', msg: string }
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Apply theme class to body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Data states
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [widgetConfig, setWidgetConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search & Notifications state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close search, notification & user profile popups on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dynamic notifications feed based on workspace activity
  const rawNotifications = useMemo(() => {
    const items = [
      {
        id: 'sys-welcome',
        title: 'Workspace Active',
        desc: `${company?.name || 'Company'} workspace is ready with AI capabilities.`,
        time: 'Real-time',
        type: 'system',
        tab: 'overview'
      },
      {
        id: 'sys-widget',
        title: 'Sales Bot Status',
        desc: widgetConfig?.is_enabled
          ? `Chatbot widget is active with site key ${widgetConfig.site_key?.slice(0, 10)}...`
          : 'Chatbot widget is ready to customize in Widget Studio.',
        time: 'Live',
        type: 'widget',
        tab: 'widget'
      },
      ...(leads && leads.length > 0 ? leads.slice(0, 5).map(l => ({
        id: `lead-${l.id}`,
        title: `New Lead: ${l.name || l.email}`,
        desc: l.requirement ? `Interest: ${l.requirement.slice(0, 45)}...` : `Email: ${l.email}`,
        time: l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Recent',
        type: 'lead',
        tab: 'leads'
      })) : [
        {
          id: 'sys-leads-ready',
          title: 'Lead Pipeline Ready',
          desc: 'Visitor conversations will automatically capture leads here.',
          time: 'Pipeline',
          type: 'lead',
          tab: 'leads'
        }
      ]),
      ...(products && products.length > 0 ? [{
        id: 'sys-products',
        title: 'Catalog Synced',
        desc: `${products.length} products available for AI recommendation.`,
        time: 'Catalog',
        type: 'product',
        tab: 'products'
      }] : [])
    ];

    return items.map(item => ({
      ...item,
      read: readNotifIds.includes(item.id)
    }));
  }, [company, widgetConfig, leads, products, readNotifIds]);

  // Filter out any cleared/dismissed notifications
  const notifications = useMemo(() => {
    return rawNotifications.filter(n => !clearedNotifIds.includes(n.id));
  }, [rawNotifications, clearedNotifIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const next = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(next);
    localStorage.setItem('read_notifications', JSON.stringify(next));
  };

  const handleClearAll = () => {
    const allIds = rawNotifications.map(n => n.id);
    const next = Array.from(new Set([...clearedNotifIds, ...allIds]));
    setClearedNotifIds(next);
    localStorage.setItem('cleared_notifications', JSON.stringify(next));
  };

  const handleDismissNotif = (e, notifId) => {
    e.stopPropagation();
    const next = Array.from(new Set([...clearedNotifIds, notifId]));
    setClearedNotifIds(next);
    localStorage.setItem('cleared_notifications', JSON.stringify(next));
  };

  const handleNotificationClick = (notif) => {
    if (!readNotifIds.includes(notif.id)) {
      const next = [...readNotifIds, notif.id];
      setReadNotifIds(next);
      localStorage.setItem('read_notifications', JSON.stringify(next));
    }
    if (notif.tab) {
      setActiveTab(notif.tab);
      setNotificationsOpen(false);
    }
  };

  // Global search filtering across features, leads, products, and knowledge
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const navFeatures = [
      { id: 'f-overview', title: 'Home / Overview', desc: 'KPIs, stats and agent activity', tab: 'overview', icon: Layers },
      { id: 'f-conversations', title: 'Live Conversations', desc: 'Inspect real-time visitor chat transcripts and locations', tab: 'conversations', icon: MessageSquare },
      { id: 'f-leads', title: 'Leads Pipeline', desc: 'Manage visitor contacts and CRM leads', tab: 'leads', icon: Users },
      { id: 'f-products', title: 'Product Catalog', desc: 'Manage products, prices and inventory', tab: 'products', icon: Package },
      { id: 'f-knowledge', title: 'Knowledge Base (RAG)', desc: 'Upload documents & FAQs for AI training', tab: 'knowledge', icon: BookOpen },
      { id: 'f-guardrails', title: 'AI Guardrails & Content Safety', desc: 'Block topics, filter competitors, mask PII and enforce safety', tab: 'guardrails', icon: ShieldCheck },
      { id: 'f-widget', title: 'Widget Studio', desc: 'Customize chatbot branding, colors and embed code', tab: 'widget', icon: Sliders },
      { id: 'f-usage', title: 'Usage Analytics', desc: 'Track token usage and AI cost metrics', tab: 'usage', icon: Activity },
      { id: 'f-settings', title: 'Workspace Settings & BYOK', desc: 'Company profile and custom AI models', tab: 'settings', icon: SettingsIcon },
    ];

    const matchedFeatures = navFeatures.filter(f => f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q));
    const matchedLeads = leads.filter(l => 
      (l.name && l.name.toLowerCase().includes(q)) || 
      (l.email && l.email.toLowerCase().includes(q)) || 
      (l.requirement && l.requirement.toLowerCase().includes(q))
    ).slice(0, 4);
    const matchedProducts = products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.category && p.category.toLowerCase().includes(q)) || 
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, 4);
    const matchedKnowledge = knowledgeList.filter(k => 
      (k.title && k.title.toLowerCase().includes(q)) || 
      (k.content && k.content.toLowerCase().includes(q))
    ).slice(0, 3);

    const count = matchedFeatures.length + matchedLeads.length + matchedProducts.length + matchedKnowledge.length;
    return { features: matchedFeatures, leads: matchedLeads, products: matchedProducts, knowledge: matchedKnowledge, count };
  }, [searchQuery, leads, products, knowledgeList]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
  };

  // Sync hash routing & email verification link handling
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash.includes('super-admin')) {
        setActiveTab('superadmin');
      } else if (hash.includes('verify-email')) {
        const tokenMatch = hash.match(/token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          try {
            const res = await api.verifyEmail(tokenMatch[1]);
            setVerifyStatus({ type: 'success', msg: res.message || 'Email verified successfully! You can now log in.' });
            window.location.hash = '';
          } catch (err) {
            setVerifyStatus({ type: 'error', msg: err.message || 'Email verification link invalid or expired.' });
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auto-dismiss verifyStatus after 6 seconds
  useEffect(() => {
    if (verifyStatus) {
      const timer = setTimeout(() => setVerifyStatus(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [verifyStatus]);

  // Fetch initial profile
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileAndData();
    }
  }, [isAuthenticated]);

  const loadProfileAndData = async () => {
    setLoading(true);
    try {
      const u = await api.getMe();
      setUser(u);

      const c = await api.getMyCompany();
      setCompany(c);
      
      const isSuperAdmin = u.email === 'superadmin@platform.com';
      if (isSuperAdmin && activeTab === 'overview') {
        setActiveTab('superadmin');
      }

      // Load tab datasets
      await refreshData(c.id);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setIsAuthenticated(false);
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (companyId) => {
    try {
      const [sData, lData, pData, kData, wData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getLeads(companyId).catch(() => []),
        api.getProducts().catch(() => []),
        api.getKnowledge().catch(() => []),
        api.getWidgetConfig().catch(() => null),
      ]);

      setStats(sData);
      setLeads(lData);
      setProducts(pData);
      setKnowledgeList(kData);
      setWidgetConfig(wData);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    setAuthToken(res.access_token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    setCompany(null);
    setUserMenuOpen(false);
  };

  // Handlers for Products
  const handleCreateProduct = async (data) => {
    await api.createProduct(data);
    if (company) refreshData(company.id);
  };
  const handleUpdateProduct = async (id, data) => {
    await api.updateProduct(id, data);
    if (company) refreshData(company.id);
  };
  const handleDeleteProduct = async (id) => {
    await api.deleteProduct(id);
    if (company) refreshData(company.id);
  };

  // Handlers for Knowledge Base
  const handleCreateKnowledge = async (data) => {
    await api.createKnowledge(data);
    if (company) refreshData(company.id);
  };
  const handleUpdateKnowledge = async (id, data) => {
    await api.updateKnowledge(id, data);
    if (company) refreshData(company.id);
  };
  const handleDeleteKnowledge = async (id) => {
    await api.deleteKnowledge(id);
    if (company) refreshData(company.id);
  };

  // Handlers for Leads
  const handleCreateLead = async (data) => {
    if (!company) return;
    await api.createLead({ ...data, company_id: company.id });
    refreshData(company.id);
  };
  const handleUpdateLead = async (id, data) => {
    if (!company) return;
    await api.updateLead(id, company.id, data);
    refreshData(company.id);
  };
  const handleDeleteLead = async (id) => {
    await api.deleteLead(id);
    if (company) refreshData(company.id);
  };

  // Handlers for Widget Studio
  const handleUpdateWidgetConfig = async (data) => {
    const updated = await api.updateWidgetConfig(data);
    setWidgetConfig(updated);
    return updated;
  };
  const handleRegenerateKey = async () => {
    const updated = await api.regenerateSiteKey();
    setWidgetConfig(updated);
  };

  const handleUpdateCompany = (updatedCompany) => {
    setCompany(updatedCompany);
  };

  if (!isAuthenticated) {
    return (
      <>
        {verifyStatus && (
          <div style={{
            position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
            background: verifyStatus.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(244, 63, 94, 0.95)',
            color: '#fff', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '12px', zIndex: 300, fontSize: '14px', fontWeight: 600,
            animation: 'fadeIn 0.3s ease'
          }}>
            {verifyStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{verifyStatus.msg}</span>
            <button 
              onClick={() => setVerifyStatus(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '8px', fontSize: '16px', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}
        <LoginModal
          onLogin={handleLogin}
          onRegister={{
            createCompany: api.createCompany,
            registerUser: api.register,
          }}
        />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'superadmin') {
            window.location.hash = '/super-admin';
          } else {
            window.location.hash = '';
          }
        }}
        user={user}
        company={company}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Right Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Clean Modern SaaS Header */}
        <header className="app-header" style={{
          height: '64px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 15
        }}>
          {/* Left Breadcrumb & Mobile Menu Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {company ? company.name : 'Workspace'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ textTransform: 'capitalize', color: 'var(--brand-primary)', fontWeight: 600 }}>
                {activeTab}
              </span>
            </div>
          </div>

          {/* Center Search Bar with Live Filter Dropdown */}
          <div ref={searchRef} className="header-search-container" style={{ position: 'relative', width: '320px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search features, leads, products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '32px' : '14px',
                height: '38px',
                fontSize: '13px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {/* Live Search Results Popup */}
            {searchOpen && searchQuery.trim() && (
              <div className="glass-card" style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                width: '420px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 200,
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                border: '1px solid var(--border-glass)'
              }}>
                {searchResults?.count === 0 ? (
                  <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No results found for "<span style={{ color: 'var(--text-primary)' }}>{searchQuery}</span>"
                  </div>
                ) : (
                  <>
                    {/* Features */}
                    {searchResults.features.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '6px' }}>
                          Modules & Navigation
                        </div>
                        {searchResults.features.map(f => {
                          const Icon = f.icon;
                          return (
                            <div
                              key={f.id}
                              onClick={() => { setActiveTab(f.tab); setSearchOpen(false); setSearchQuery(''); }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                <Icon size={15} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Leads */}
                    {searchResults.leads.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '6px' }}>
                          Captured Leads ({searchResults.leads.length})
                        </div>
                        {searchResults.leads.map(l => (
                          <div
                            key={l.id}
                            onClick={() => { setActiveTab('leads'); setSearchOpen(false); setSearchQuery(''); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                              <Users size={15} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {l.name || l.email}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {l.requirement || l.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Products */}
                    {searchResults.products.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '6px' }}>
                          Products ({searchResults.products.length})
                        </div>
                        {searchResults.products.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setActiveTab('products'); setSearchOpen(false); setSearchQuery(''); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                              <Package size={15} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category} &bull; ${p.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Knowledge */}
                    {searchResults.knowledge.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '6px' }}>
                          Knowledge Base Articles
                        </div>
                        {searchResults.knowledge.map(k => (
                          <div
                            key={k.id}
                            onClick={() => { setActiveTab('knowledge'); setSearchOpen(false); setSearchQuery(''); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                              <BookOpen size={15} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.title}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Header Action Icons & User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Notifications Bell with Counter and Dropdown */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                style={{
                  position: 'relative',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: notificationsOpen ? 'rgba(99, 102, 241, 0.2)' : undefined,
                  borderColor: notificationsOpen ? '#6366f1' : undefined
                }}
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen(prev => !prev);
                  setUserMenuOpen(false);
                  setSearchOpen(false);
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notificationsOpen && (
                <div className="glass-card" style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '380px',
                  maxHeight: '460px',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 200,
                  padding: 0,
                  overflow: 'hidden',
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-glass)'
                }}>
                  {/* Header with Title and "Mark as read" & "Clear all" Buttons */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#818cf8',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#818cf8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px'
                          }}
                          title="Mark all as read"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#a5b4fc'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#818cf8'}
                        >
                          <CheckCheck size={14} /> Mark as read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px'
                          }}
                          title="Clear all notifications"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={13} /> Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List Body */}
                  <div style={{ overflowY: 'auto', maxHeight: '360px', padding: '8px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.8 }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>No notifications to display.</div>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const iconBg = n.type === 'lead' ? 'rgba(16, 185, 129, 0.2)' : n.type === 'widget' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)';
                        const iconColor = n.type === 'lead' ? '#34d399' : n.type === 'widget' ? '#818cf8' : '#fbbf24';
                        const Icon = n.type === 'lead' ? Users : n.type === 'widget' ? Bot : Sparkles;

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              background: !n.read ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              marginBottom: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              const dismissBtn = e.currentTarget.querySelector('.dismiss-btn');
                              if (dismissBtn) dismissBtn.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = !n.read ? 'rgba(99, 102, 241, 0.08)' : 'transparent';
                              const dismissBtn = e.currentTarget.querySelector('.dismiss-btn');
                              if (dismissBtn) dismissBtn.style.opacity = '0';
                            }}
                          >
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: iconBg,
                              color: iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <Icon size={16} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: !n.read ? 700 : 500, color: 'var(--text-primary)' }}>
                                  {n.title}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {!n.read && (
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                                  )}
                                  <button
                                    className="dismiss-btn"
                                    onClick={(e) => handleDismissNotif(e, n.id)}
                                    title="Dismiss notification"
                                    style={{
                                      opacity: 0,
                                      transition: 'opacity 0.15s, color 0.15s',
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                                {n.desc}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {n.time}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with Dropdown Menu */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setUserMenuOpen(prev => !prev);
                  setNotificationsOpen(false);
                  setSearchOpen(false);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {user ? user.email.charAt(0).toUpperCase() : 'A'}
              </button>

              {/* User Dropdown Popup Menu */}
              {userMenuOpen && (
                <div className="glass-card" style={{
                  position: 'absolute',
                  right: 0,
                  top: '46px',
                  width: '240px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 200,
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--border-glass)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{company?.name || 'Workspace User'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>

                  <button 
                    onClick={() => {
                      toggleTheme();
                    }} 
                    style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Sparkles size={14} color="#6366f1" /> Appearance ({theme === 'dark' ? 'Dark' : 'Light'})
                  </button>

                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }} 
                    style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fb7185', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="app-main-content" style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', zIndex: 10 }}>
          {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} company={company} onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'conversations' && <ConversationsTab />}
          {activeTab === 'leads' && (
            <LeadsTab
              leads={leads}
              companyId={company?.id}
              onCreateLead={handleCreateLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              loading={loading}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              companyId={company?.id}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              loading={loading}
            />
          )}
          {activeTab === 'knowledge' && (
            <KnowledgeTab
              knowledgeList={knowledgeList}
              products={products}
              companyId={company?.id}
              onCreateKnowledge={handleCreateKnowledge}
              onUpdateKnowledge={handleUpdateKnowledge}
              onDeleteKnowledge={handleDeleteKnowledge}
              onRefresh={() => company && refreshData(company.id)}
              loading={loading}
            />
          )}
          {activeTab === 'guardrails' && (
            <GuardrailsTab
              company={company}
              onUpdateCompany={handleUpdateCompany}
            />
          )}
          {activeTab === 'widget' && (
            <WidgetStudioTab
              widgetConfig={widgetConfig}
              onUpdateConfig={handleUpdateWidgetConfig}
              onRegenerateKey={handleRegenerateKey}
            />
          )}
          {activeTab === 'usage' && <UsageTab stats={stats} loading={loading} />}
          {activeTab === 'settings' && <SettingsTab company={company} onUpdateCompany={handleUpdateCompany} />}
          {activeTab === 'superadmin' && <SuperAdminTab />}
        </main>
      </div>
    </div>
  );
}

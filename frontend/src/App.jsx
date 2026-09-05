import React, { useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from './api/client';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import LeadsTab from './components/LeadsTab';
import ProductsTab from './components/ProductsTab';
import KnowledgeTab from './components/KnowledgeTab';
import WidgetStudioTab from './components/WidgetStudioTab';
import UsageTab from './components/UsageTab';
import BillingTab from './components/BillingTab';
import SettingsTab from './components/SettingsTab';
import SuperAdminTab from './components/SuperAdminTab';
import LoginModal from './components/LoginModal';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Bell, 
  RefreshCw, 
  ChevronDown, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes('/super-admin') || window.location.hash.includes('super-admin')) {
      return 'superadmin';
    }
    return 'overview';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()));
  const [verifyStatus, setVerifyStatus] = useState(null); // { type: 'success'|'error', msg: string }
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [widgetConfig, setWidgetConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
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
            display: 'flex', alignItems: 'center', gap: '10px', zIndex: 300, fontSize: '14px', fontWeight: 600
          }}>
            {verifyStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {verifyStatus.msg}
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Subtle Background Glow Orbs */}
      <div className="gradient-bg-orb orb-1" />
      <div className="gradient-bg-orb orb-2" />

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
      />

      {/* Right Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Botpress Style Top Header Bar */}
        <header style={{
          height: '64px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '0 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 15
        }}>
          {/* Left Breadcrumb & Workspace Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {company ? company.name : 'Default Workspace'} <ChevronDown size={14} color="var(--text-muted)" />
            </span>
            <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 600 }}>
              {activeTab}
            </span>
          </div>

          {/* Center Search Bar */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search features, leads, products..."
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '36px', fontSize: '13px', borderRadius: '20px' }}
            />
          </div>

          {/* Right Header Action Icons & User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} title="Refresh Workspace" onClick={() => company && refreshData(company.id)}>
              <RefreshCw size={16} />
            </button>
            <button className="btn-secondary" style={{ padding: '6px', borderRadius: '50%' }} title="Notifications">
              <Bell size={16} />
            </button>

            {/* User Profile Avatar with Dropdown Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
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

              {/* Botpress Dropdown Popup Menu */}
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
                  zIndex: 100
                }}>
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--border-glass)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{company?.name || 'Workspace User'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>

                  <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left' }}>
                    <Sparkles size={14} color="#6366f1" /> Appearance ({theme === 'dark' ? 'Dark' : 'Light'})
                  </button>

                  <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fb7185', cursor: 'pointer', textAlign: 'left' }}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', zIndex: 10 }}>
          {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} company={company} />}
          {activeTab === 'leads' && (
            <LeadsTab
              leads={leads}
              companyId={company?.id}
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
              loading={loading}
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
          {activeTab === 'billing' && <BillingTab company={company} />}
          {activeTab === 'settings' && <SettingsTab company={company} onUpdateCompany={handleUpdateCompany} />}
          {activeTab === 'superadmin' && <SuperAdminTab />}
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles,
  Bot,
  MessageSquare,
  Headphones,
  Zap,
  HelpCircle,
  PhoneCall,
  Smile,
  Flame,
  Briefcase,
  Image as ImageIcon
} from 'lucide-react';

export default function WidgetStudioTab({ widgetConfig, onUpdateConfig, onRegenerateKey }) {
  const [botTitle, setBotTitle] = useState('Sales Assistant');
  const [greetingMessage, setGreetingMessage] = useState('Hello! How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [widgetIcon, setWidgetIcon] = useState('Bot');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultIcons = [
    { id: 'Bot', label: 'Robot AI', icon: Bot },
    { id: 'MessageSquare', label: 'Chat Bubble', icon: MessageSquare },
    { id: 'Sparkles', label: 'Magic AI', icon: Sparkles },
    { id: 'Headphones', label: 'Support Agent', icon: Headphones },
    { id: 'Zap', label: 'Fast Sales', icon: Zap },
    { id: 'HelpCircle', label: 'Helpdesk', icon: HelpCircle },
    { id: 'PhoneCall', label: 'Contact Us', icon: PhoneCall },
    { id: 'Smile', label: 'Friendly', icon: Smile },
    { id: 'Flame', label: 'Hot Deals', icon: Flame },
    { id: 'Briefcase', label: 'Business', icon: Briefcase },
  ];

  useEffect(() => {
    if (widgetConfig) {
      setBotTitle(widgetConfig.bot_title || 'Sales Assistant');
      setGreetingMessage(widgetConfig.greeting_message || 'Hello! How can I help you today?');
      setPrimaryColor(widgetConfig.primary_color || '#6366f1');
      setWidgetIcon(widgetConfig.widget_icon || 'Bot');
      setCustomIconUrl(widgetConfig.custom_icon_url || '');
      setAllowedOrigins((widgetConfig.allowed_origins || []).join('\n'));
    }
  }, [widgetConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const origins = allowedOrigins.split('\n').map((s) => s.trim()).filter(Boolean);
      await onUpdateConfig({
        bot_title: botTitle,
        greeting_message: greetingMessage,
        primary_color: primaryColor,
        widget_icon: widgetIcon,
        custom_icon_url: customIconUrl.trim() || null,
        allowed_origins: origins,
      });
    } catch (err) {
      console.error('Failed to update widget config:', err);
    } finally {
      setSaving(false);
    }
  };

  const siteKey = widgetConfig?.site_key || 'sk_live_demo_key';

  const embedCode = `<script 
  src="/api/static/widget.js"
  data-site-key="${siteKey}" 
  async>
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SelectedIconComponent = defaultIcons.find((item) => item.id === widgetIcon)?.icon || Bot;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Widget Studio & Customization</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Customize your widget floating icon, brand logo image, accent color, and security origin domain whitelist.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left Form Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSave} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              Branding & Launcher Icon
            </h3>

            {/* Custom Logo Image URL Input */}
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ImageIcon size={16} color="var(--accent-indigo)" /> Custom Company Logo Image URL (Optional)
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Upload your company logo (e.g. <code>https://mycompany.com/logo.png</code>). If set, this logo will be displayed inside your circular floating chat launcher!
              </p>
              <input
                type="url"
                placeholder="https://example.com/company-logo.png"
                value={customIconUrl}
                onChange={(e) => setCustomIconUrl(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* 10 Default Preset Icons */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Or Choose 1 of 10 Default Preset Icons
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {defaultIcons.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = !customIconUrl && widgetIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setWidgetIcon(item.id);
                        setCustomIconUrl('');
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-primary)',
                        border: isSelected ? '2px solid var(--accent-indigo)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: customIconUrl ? 0.6 : 1
                      }}
                    >
                      <IconComp size={22} color={isSelected ? '#6366f1' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--accent-indigo)' : 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Bot Header Title</label>
              <input type="text" value={botTitle} onChange={(e) => setBotTitle(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Greeting Message</label>
              <textarea rows={3} value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Primary Accent Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '50px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '120px' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Allowed Domain Whitelist (One origin per line)
              </label>
              <textarea rows={3} value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)} placeholder="https://example.com" style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px' }} />
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>

          {/* Embed Script Snippet */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Embed JavaScript Snippet</h3>
              <button onClick={copyToClipboard} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre style={{
              background: 'var(--bg-primary)',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              color: '#6366f1',
              fontSize: '13px',
              overflowX: 'auto',
              fontFamily: 'monospace'
            }}>
              {embedCode}
            </pre>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Public Site Key:</span>
                <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{siteKey}</div>
              </div>
              <button onClick={onRegenerateKey} className="btn-danger" style={{ fontSize: '12px' }}>
                <RefreshCw size={13} /> Regenerate Key
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Preview Mock */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-indigo)" /> Live Widget Mock
          </h3>

          {/* Floating Widget Popup Mock */}
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '380px'
          }}>
            {/* Header */}
            <div style={{ background: primaryColor, padding: '14px 18px', color: '#fff', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {customIconUrl ? (
                <img src={customIconUrl} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', background: '#fff' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <SelectedIconComponent size={20} color="#fff" />
              )}
              {botTitle}
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: '13px', maxWidth: '85%', lineHeight: '1.4' }}>
                {greetingMessage}
              </div>
            </div>

            {/* Footer Input */}
            <div style={{ padding: '12px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Type a message..." disabled style={{ flex: 1, fontSize: '13px' }} />
              <button style={{ background: primaryColor, color: '#fff', padding: '8px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}>Send</button>
            </div>
          </div>

          {/* Launcher Button Preview (Clean Separation below chat window) */}
          <div style={{
            background: 'var(--bg-primary)',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Floating FAB Launcher Badge:</span>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.8)'
            }} title="Circular Floating Launcher Badge">
              {customIconUrl ? (
                <img src={customIconUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <SelectedIconComponent size={22} color="#fff" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

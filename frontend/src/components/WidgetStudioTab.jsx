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
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [widgetIcon, setWidgetIcon] = useState('Bot');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setPrimaryColor(widgetConfig.primary_color || '#2563eb');
      setWidgetIcon(widgetConfig.widget_icon || 'Bot');
      setCustomIconUrl(widgetConfig.custom_icon_url || '');

      const raw = widgetConfig.allowed_domains || widgetConfig.allowed_origins;
      if (Array.isArray(raw)) {
        setAllowedOrigins(raw.join('\n'));
      } else if (typeof raw === 'string') {
        const list = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        setAllowedOrigins(list.join('\n'));
      } else {
        setAllowedOrigins('*');
      }
    }
  }, [widgetConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const list = allowedOrigins
        .split('\n')
        .map(s => {
          let val = s.trim();
          if (!val) return '';
          if (val === '*') return '*';
          try {
            if (val.startsWith('http://') || val.startsWith('https://')) {
              return new URL(val).hostname;
            }
          } catch(e) {}
          return val.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
        })
        .filter(Boolean);

      const domainStr = list.length > 0 ? list.join(',') : '*';

      await onUpdateConfig({
        bot_title: botTitle,
        greeting_message: greetingMessage,
        primary_color: primaryColor,
        widget_icon: widgetIcon,
        custom_icon_url: customIconUrl.trim() || null,
        allowed_domains: domainStr,
        allowed_origins: list,
      });

      setAllowedOrigins(list.length > 0 ? list.join('\n') : '*');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update widget config:', err);
    } finally {
      setSaving(false);
    }
  };

  const siteKey = widgetConfig?.site_key || 'sk_live_demo1234567890abcdef';
  const serverHost = 'https://aichat.dlksoftwaresolutions.co.in';

  const embedCode = `<script 
  src="${serverHost}/api/static/widget.js"
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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Widget Studio & Customization
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Customize your website floating chat widget, colors, launcher icon, and authorized website domains.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left Form Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSave} className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              Branding & Launcher Icon
            </h3>

            {/* Custom Logo Image Upload */}
            <div style={{ background: 'var(--bg-surface-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ImageIcon size={15} color="var(--brand-primary)" /> Custom Brand Logo
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload your company logo or paste an image URL. Displayed inside your circular floating chat button.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCustomIconUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ width: '100%', padding: '10px', border: '1px dashed var(--border-medium)', borderRadius: '8px', background: 'var(--bg-surface)', fontSize: '12.5px', cursor: 'pointer' }}
                />
                
                <input
                  type="text"
                  placeholder="Or paste an image URL: https://example.com/logo.png"
                  value={customIconUrl}
                  onChange={(e) => setCustomIconUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 10 Default Preset Icons */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Or Choose from Preset Icons
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
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
                        padding: '10px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                        border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: customIconUrl ? 0.6 : 1
                      }}
                    >
                      <IconComp size={18} color={isSelected ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '10.5px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Widget Header Title
              </label>
              <input type="text" value={botTitle} onChange={(e) => setBotTitle(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Welcome Greeting Message
              </label>
              <textarea rows={3} value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Brand Accent Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  style={{ width: '42px', height: '38px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '8px' }} 
                />
                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '120px' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Authorized Websites (Domain Whitelist)
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                The widget will only execute on authorized hosts. Enter one URL or hostname per line. (Use * to authorize all).
              </p>
              <textarea rows={3} value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)} placeholder="https://example.com" style={{ width: '100%', fontFamily: 'monospace', fontSize: '12.5px', marginBottom: '10px' }} />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allowedOrigins.split('\n').filter(d => d.trim()).map((domain, idx) => {
                  const cleanDomain = domain.trim();
                  if (!cleanDomain) return null;
                  const isAll = cleanDomain === '*';
                  return (
                    <span key={idx} className={`badge ${isAll ? 'badge-amber' : 'badge-emerald'}`}>
                      {isAll ? '🌐 Allowed on All Websites (*)' : `✓ ${cleanDomain}`}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving Changes...' : saveSuccess ? '✓ Settings Saved!' : 'Save Widget Settings'}
              </button>
              {saveSuccess && (
                <span style={{ fontSize: '13px', color: 'var(--status-emerald-text)', fontWeight: 600 }}>
                  ✓ Live widget updated
                </span>
              )}
            </div>
          </form>

          {/* Embed Script Snippet */}
          <div className="clean-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Embed Code</h3>
              <button onClick={copyToClipboard} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
                {copied ? <Check size={13} color="#047857" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre style={{
              background: 'var(--bg-surface-subtle)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--brand-primary)',
              fontSize: '12.5px',
              overflowX: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.4
            }}>
              {embedCode}
            </pre>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Site Key:</span>
                <div style={{ fontSize: '12.5px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{siteKey}</div>
              </div>
              <button onClick={onRegenerateKey} className="btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <RefreshCw size={12} /> Regenerate Key
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Preview Mock */}
        <div className="clean-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} color="var(--brand-primary)" /> Live Preview
          </h3>

          {/* Floating Widget Popup Mock */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '380px'
          }}>
            {/* Header */}
            <div style={{ background: primaryColor, padding: '14px 18px', color: '#ffffff', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {customIconUrl ? (
                <img src={customIconUrl} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', background: '#fff' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <SelectedIconComponent size={18} color="#ffffff" />
              )}
              {botTitle}
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface-subtle)' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', fontSize: '13px', maxWidth: '85%', lineHeight: '1.4' }}>
                {greetingMessage}
              </div>
            </div>

            {/* Footer Input */}
            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Type a message..." disabled style={{ flex: 1, fontSize: '12.5px' }} />
              <button style={{ background: primaryColor, color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '12.5px', cursor: 'default' }}>
                Send
              </button>
            </div>
          </div>

          {/* Launcher Button Preview */}
          <div style={{
            background: 'var(--bg-surface-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Launcher Badge Preview:
            </span>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}>
              {customIconUrl ? (
                <img src={customIconUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <SelectedIconComponent size={20} color="#ffffff" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Settings, Building2, Shield, Key, Save, Check } from 'lucide-react';
import { api } from '../api/client';

export default function SettingsTab({ company, onUpdateCompany }) {
  const [name, setName] = useState(company?.name || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [description, setDescription] = useState(company?.description || '');
  
  // BYOK Settings
  const [llmProvider, setLlmProvider] = useState(company?.llm_provider || 'openai');
  const [llmModel, setLlmModel] = useState(company?.llm_model || 'gpt-4o-mini');
  const [llmApiKey, setLlmApiKey] = useState(company?.llm_api_key || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company?.id) {
        await api.updateCompany(company.id, { 
          name, 
          website, 
          description,
          llm_provider: llmProvider,
          llm_model: llmModel,
          llm_api_key: llmApiKey ? llmApiKey : null
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      alert('Failed to update company settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Configure your company workspace profile, AI assistant parameters, and security policies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Main Settings Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="var(--accent-indigo)" /> Company Profile Settings
          </h3>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Company Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Company Website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Business Description / Focus</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your products or services..." style={{ width: '100%', resize: 'vertical' }} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="var(--accent-indigo)" /> AI Engine (BYOK)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>AI Provider</label>
              <select value={llmProvider} onChange={(e) => setLlmProvider(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>AI Model</label>
              <input type="text" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} placeholder="e.g. gpt-4o-mini, claude-3-haiku-20240307" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Your API Key</label>
            <input type="password" value={llmApiKey} onChange={(e) => setLlmApiKey(e.target.value)} placeholder="sk-..." style={{ width: '100%' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              We will use this key exclusively for your company's chatbot traffic.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved Successfully!' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Security & Info Box */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} color="var(--accent-emerald)" /> Workspace Security
          </h3>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Your tenant workspace is isolated with strict PostgreSQL row-level company filtering (`company_id`).
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-glass)', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Tenant Verification Status</div>
            <span className="badge badge-emerald">VERIFIED & ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

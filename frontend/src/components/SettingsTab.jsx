import React, { useState } from 'react';
import { Settings, Building2, Key, Save, Check } from 'lucide-react';
import { api } from '../api/client';

export default function SettingsTab({ company, onUpdateCompany }) {
  const [name, setName] = useState(company?.name || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [description, setDescription] = useState(company?.description || '');
  
  // BYOK Multi-Provider Settings
  const PROVIDER_MODELS = {
    openai: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost Effective - Recommended)' },
      { id: 'gpt-4o', label: 'GPT-4o (Most Intelligent)' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      { id: 'o1-mini', label: 'o1 Mini (Reasoning Model)' },
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (State of the Art)' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Lightning Fast)' },
      { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (High Intelligence)' },
    ],
    google: [
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast & Lightweight)' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Context)' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-Gen)' },
    ],
    groq: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Meta - Recommended)' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra-Fast)' },
      { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32k Context)' },
    ],
    deepseek: [
      { id: 'deepseek-chat', label: 'DeepSeek-V3 (Chat Model - Highly Efficient)' },
      { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (Reasoning Model)' },
    ],
    custom: [
      { id: 'custom', label: 'Custom Model ID (Type below)...' },
    ]
  };

  const [llmProvider, setLlmProvider] = useState(company?.llm_provider || 'openai');
  const [llmModel, setLlmModel] = useState(company?.llm_model || 'gpt-4o-mini');
  const [customModelInput, setCustomModelInput] = useState('');
  const [llmApiKey, setLlmApiKey] = useState(company?.llm_api_key || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProviderChange = (newProvider) => {
    setLlmProvider(newProvider);
    const defaultModel = PROVIDER_MODELS[newProvider]?.[0]?.id || 'gpt-4o-mini';
    setLlmModel(defaultModel);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company?.id) {
        const finalModel = llmModel === 'custom' ? customModelInput.trim() : llmModel;
        const updated = await api.updateCompany(company.id, { 
          name, 
          website, 
          description,
          llm_provider: llmProvider,
          llm_model: finalModel || 'gpt-4o-mini',
          llm_api_key: llmApiKey ? llmApiKey.trim() : null
        });
        if (onUpdateCompany) {
          onUpdateCompany(updated);
        }
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

      <div style={{ maxWidth: '850px', width: '100%' }}>
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
              <select 
                value={llmProvider} 
                onChange={(e) => handleProviderChange(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="groq">Groq (Ultra-Fast Llama 3)</option>
                <option value="deepseek">DeepSeek (V3 / R1)</option>
                <option value="custom">Custom / OpenRouter</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>AI Model</label>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {(PROVIDER_MODELS[llmProvider] || PROVIDER_MODELS.openai).map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {llmModel === 'custom' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Custom Model Name / ID *</label>
              <input
                type="text"
                required
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="e.g. meta-llama/llama-3.3-70b-instruct or mistral-large-latest"
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Your {llmProvider.toUpperCase()} API Key
            </label>
            <input 
              type="password" 
              value={llmApiKey} 
              onChange={(e) => setLlmApiKey(e.target.value)} 
              placeholder={
                llmProvider === 'openai' ? 'sk-...' :
                llmProvider === 'anthropic' ? 'sk-ant-api03-...' :
                llmProvider === 'google' ? 'AIzaSy...' :
                llmProvider === 'groq' ? 'gsk_...' :
                llmProvider === 'deepseek' ? 'sk-...' : 'API Key...'
              } 
              style={{ width: '100%' }} 
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              We will use this key exclusively for your company's chatbot traffic. You have full control over your AI costs with zero artificial platform limits.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved Successfully!' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

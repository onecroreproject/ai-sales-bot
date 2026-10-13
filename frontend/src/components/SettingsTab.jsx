import React, { useState } from 'react';
import { Settings, Building2, Key, Save, Check, Eye, EyeOff, Sparkles, Shield, Cpu } from 'lucide-react';
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
    nvidia: [
      { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b (NVIDIA NIM - Recommended)' },
      { id: 'meta/llama-3.3-70b-instruct', label: 'meta/llama-3.3-70b-instruct' },
      { id: 'meta/llama-3.1-405b-instruct', label: 'meta/llama-3.1-405b-instruct (Ultra Intelligence)' },
      { id: 'deepseek-ai/deepseek-r1', label: 'deepseek-ai/deepseek-r1 (Reasoning)' },
      { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'nvidia/llama-3.1-nemotron-70b-instruct' },
      { id: 'mistralai/mistral-large-2-instruct', label: 'mistralai/mistral-large-2-instruct' },
      { id: 'custom', label: 'Custom NVIDIA Model ID (Type below)...' },
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [botPersona, setBotPersona] = useState(company?.bot_persona || 'professional');
  const [customInstructions, setCustomInstructions] = useState(company?.custom_instructions || '');
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
          llm_api_key: llmApiKey ? llmApiKey.trim() : null,
          bot_persona: botPersona,
          custom_instructions: customInstructions ? customInstructions.trim() : null
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '860px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Workspace Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Manage your business profile, connect your AI provider (BYOK), and tailor assistant personality.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Business Profile */}
        <div className="clean-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Company Profile</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Identifies your workspace across widgets and CRM records</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Company Name *
              </label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                style={{ width: '100%' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Company Website URL
              </label>
              <input 
                type="url" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)} 
                placeholder="https://yourcompany.com" 
                style={{ width: '100%' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Business Description & Industry
              </label>
              <textarea 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe your primary services, ideal clients, and key market solutions..." 
                style={{ width: '100%', resize: 'vertical' }} 
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI Engine (BYOK) */}
        <div className="clean-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--status-emerald-bg)', color: 'var(--status-emerald-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Engine & Bring-Your-Own-Key (BYOK)</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose any model: OpenAI, NVIDIA NIM, Claude, DeepSeek, or Gemini</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  AI Provider
                </label>
                <select 
                  value={llmProvider} 
                  onChange={(e) => handleProviderChange(e.target.value)} 
                  style={{ width: '100%' }}
                >
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                  <option value="nvidia">NVIDIA NIM (integrate.api.nvidia.com)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="google">Google (Gemini 1.5 / 2.0)</option>
                  <option value="groq">Groq (Ultra-Fast Llama 3.3)</option>
                  <option value="deepseek">DeepSeek (V3 / R1 Reasoning)</option>
                  <option value="custom">Custom Provider</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Model Selection
                </label>
                <select
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {(PROVIDER_MODELS[llmProvider] || PROVIDER_MODELS.openai).map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {llmModel === 'custom' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Custom Model Name / ID *
                </label>
                <input
                  type="text"
                  required
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder={llmProvider === 'nvidia' ? "meta/llama-3.3-70b-instruct or deepseek-ai/deepseek-r1" : "e.g. mistral-large-latest"}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Your {llmProvider === 'nvidia' ? 'NVIDIA NIM' : llmProvider.toUpperCase()} API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showApiKey ? 'text' : 'password'} 
                  value={llmApiKey} 
                  onChange={(e) => setLlmApiKey(e.target.value)} 
                  placeholder={
                    llmProvider === 'openai' ? 'sk-proj-...' :
                    llmProvider === 'nvidia' ? 'nvapi-...' :
                    llmProvider === 'anthropic' ? 'sk-ant-api03-...' :
                    llmProvider === 'google' ? 'AIzaSy...' :
                    llmProvider === 'groq' ? 'gsk_...' :
                    llmProvider === 'deepseek' ? 'sk-...' : 'API Key...'
                  } 
                  style={{ width: '100%', paddingRight: '40px' }} 
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Endpoint:</span>
                  <code style={{ 
                    background: 'var(--bg-surface-subtle)', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-subtle)', 
                    fontSize: '11.5px', 
                    color: 'var(--brand-primary)',
                    fontFamily: 'monospace'
                  }}>
                    {llmProvider === 'nvidia' 
                      ? 'https://integrate.api.nvidia.com/v1' 
                      : llmProvider === 'groq' 
                      ? 'https://api.groq.com/openai/v1' 
                      : 'https://api.openai.com/v1'}
                  </code>
                  {company?.llm_provider === llmProvider && company?.llm_api_key ? (
                    <span className="badge badge-emerald" style={{ padding: '2px 8px', fontSize: '11px' }}>
                      ✓ Currently Active
                    </span>
                  ) : null}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {llmProvider === 'nvidia' 
                    ? 'Enter your NVIDIA NGC key (starts with nvapi-). Click "Save Workspace Settings" below to apply.' 
                    : 'Your API key is securely encrypted and used exclusively for your live chatbot.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Persona & Business Guardrails */}
        <div className="clean-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Sales Assistant Persona & Instructions</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fine-tune conversational tone and strategic guidance</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Conversation Persona
              </label>
              <select
                value={botPersona}
                onChange={(e) => setBotPersona(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="professional">Professional & Consultative (Polished, courteous, corporate clarity)</option>
                <option value="friendly">Warm & Welcoming (Enthusiastic, approachable, upbeat)</option>
                <option value="sales_closer">Proactive Sales Closer (Creates urgency, pitches value, captures contacts)</option>
                <option value="support">Customer Support Specialist (Patient, analytical, troubleshooting focus)</option>
                <option value="technical">Technical Specialist (Architecture, specifications, accurate facts)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Special Business Guidelines & Rules
              </label>
              <textarea
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Always highlight our 14-day free trial on pricing questions. Direct enterprise queries to enterprise@company.com. Do not give custom quotes above 50 seats."
                style={{ width: '100%', resize: 'vertical' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                These directives are prioritized in the assistant's instruction prompt for every conversation.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Saving Changes...' : saved ? 'Saved Successfully!' : 'Save Workspace Settings'}
          </button>
          {saved && (
            <span style={{ fontSize: '13px', color: 'var(--status-emerald-text)', fontWeight: 600 }}>
              ✓ Settings updated in real-time
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Lock, 
  Building2, 
  Globe, 
  Briefcase, 
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';

export default function LoginModal({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'unverified' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  // Company registration fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);


  // Check URL hash for password reset token
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('reset-password')) {
        const match = hash.match(/token=([^&]+)/);
        if (match && match[1]) {
          setResetToken(match[1]);
          setMode('reset');
          setError('');
          setSuccess('');
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Auto-dismiss alerts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode !== 'reset') {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (mode === 'reset') {
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    } else if (mode !== 'forgot' && mode !== 'unverified' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        if (!companyName.trim()) {
          throw new Error('Please enter your company name.');
        }
        let comp;
        try {
          comp = await onRegister.createCompany(
            companyName.trim(),
            companyWebsite.trim(),
            companyDescription.trim() || 'Company registered via portal'
          );
        } catch (err) {
          throw new Error(`Company registration error: ${err.message}`);
        }

        try {
          await onRegister.registerUser(comp.id, email, password);
          setSuccess(`Registration successful! Verification link sent to ${email}. Please check your inbox and click the link to activate your company workspace.`);
          setMode('login');
          setEmail('');
          setPassword('');
          setCompanyName('');
          setCompanyWebsite('');
          setCompanyDescription('');
        } catch (err) {
          if (err.message.includes('already exists')) {
            throw new Error(`An account with email "${email}" already exists. Please sign in instead.`);
          }
          throw err;
        }

      } else if (mode === 'login') {
        try {
          await onLogin(email, password);
        } catch (err) {
          if (err.message.includes('not verified')) {
            setMode('unverified');
            setError('Your email address is registered but not yet verified. Please verify your email to unlock access.');
          } else {
            throw new Error(err.message || 'Invalid email or password.');
          }
        }
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccess(res.message || 'Password reset instructions sent!');
      } else if (mode === 'reset') {
        const res = await api.resetPassword(resetToken, newPassword);
        setSuccess(res.message || 'Password reset successfully! Please sign in with your new password.');
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        window.location.hash = '';
      } else if (mode === 'unverified') {
        const res = await api.resendVerification(email);
        setSuccess(res.message || 'Verification link resent to your email inbox! Please check your email.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 200,
      overflowY: 'auto'
    }}>
      {/* Main Clean Card Container */}
      <div 
        className="clean-card"
        style={{
          width: '960px',
          maxWidth: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Left Side: Brand & Feature Highlights */}
        <div style={{
          padding: '44px 36px',
          background: 'var(--bg-surface-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '32px'
        }}>
          <div>
            {/* Logo Mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}>
                <Bot size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  SalesBot AI
                </h1>
                <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Autonomous B2B Engagement
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Convert Website Visitors Into Verified Leads 24/7
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
              Engage prospective clients instantly with an embeddable AI sales assistant powered by RAG knowledge search and live human takeover.
            </p>

            {/* Feature Bullets with Pastel Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Autonomous Qualification</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Captures name, email, phone, company & requirements automatically.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>RAG Vector Knowledge Base</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Indexes PDFs, Word docs, Excel spreadsheets, and live URLs.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Live Human Agent Takeover</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transition between AI and human reps smoothly without visitor interruption.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="var(--brand-primary)" /> BYOK Multi-Model: OpenAI, NVIDIA NIM, DeepSeek & Groq
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div style={{ padding: '44px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Mode Switcher Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface-subtle)',
              padding: '4px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'login' ? 700 : 500,
                  background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
                  color: mode === 'login' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: mode === 'login' ? 'var(--shadow-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'register' ? 700 : 500,
                  background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
                  color: mode === 'register' ? 'var(--brand-primary)' : 'var(--text-muted)',
                  boxShadow: mode === 'register' ? 'var(--shadow-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Create Workspace
              </button>
            </div>
          )}




          {/* Clean Alert Banners */}
          {error && (
            <div style={{
              background: 'var(--status-rose-bg)',
              color: 'var(--status-rose-text)',
              border: '1px solid var(--status-rose-border)',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'var(--status-emerald-bg)',
              color: 'var(--status-emerald-text)',
              border: '1px solid var(--status-emerald-border)',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Company Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Company Website
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      style={{ width: '100%', paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              </>
            )}

            {mode !== 'reset' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Work Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            >
              {loading ? 'Please wait...' : (
                mode === 'login' ? 'Sign In to Dashboard' :
                mode === 'register' ? 'Create Company Account' :
                mode === 'forgot' ? 'Send Password Reset Link' :
                mode === 'unverified' ? 'Resend Verification Email' :
                'Update Password'
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
              >
                &larr; Back to Sign In
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}


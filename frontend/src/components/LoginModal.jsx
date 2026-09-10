import React, { useState } from 'react';
import { 
  Bot, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  MailCheck, 
  ExternalLink, 
  Lock, 
  Mail, 
  Building2, 
  Globe, 
  Briefcase, 
  Sparkles,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';
import { api } from '../api/client';

export default function LoginModal({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'unverified'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Company registration fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim());
  };

  // Password strength checker for registration
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: '#f43f5e' };
    if (pass.length < 8) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && pass.length >= 8) {
      return { score: 4, label: 'Strong', color: '#10b981' };
    }
    return { score: 3, label: 'Good', color: '#6366f1' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setVerificationUrl('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode !== 'forgot' && mode !== 'unverified' && password.length < 8) {
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
          throw new Error(`Company creation error: ${err.message}`);
        }

        try {
          const regRes = await onRegister.registerUser(comp.id, email, password);
          setSuccess(`Registration successful! A verification email link has been sent to ${email}.`);
          if (regRes?.verification_url) {
            setVerificationUrl(regRes.verification_url);
          }
          setMode('login');
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
      } else if (mode === 'unverified') {
        const res = await api.resendVerification(email);
        setSuccess(res.message || 'Verification link resent successfully!');
        if (res.verification_url) {
          setVerificationUrl(res.verification_url);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateVerification = async (url) => {
    setVerifying(true);
    setError('');
    try {
      const urlObj = new URL(url);
      const hashParts = urlObj.hash.split('?token=');
      const token = hashParts[1];
      
      const res = await api.verifyEmail(token);
      setSuccess(res.message || 'Email verified successfully! You can now log in.');
      setVerificationUrl('');
      setMode('login');
    } catch (err) {
      setError('Email verification failed: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at top left, #1e1b4b 0%, #0b0f19 50%, #030712 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      zIndex: 200,
      overflowY: 'auto'
    }}>
      {/* Dynamic Background Glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <div style={{
        width: '1000px',
        maxWidth: '100%',
        minHeight: '580px',
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1.15fr' : '1fr',
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Side: Brand & Feature Highlights */}
        <div style={{
          padding: '44px 36px',
          background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.04))',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
              }}>
                <Bot size={28} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  AI Sales Bot
                </h1>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Enterprise Sales Platform
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3, marginBottom: '14px' }}>
              Automate Customer Lead Capture with Conversational AI
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
              Empower your sales team with AI-driven widget chat assistant, real-time RAG knowledge base search, and automated qualified lead pipelines.
            </p>

            {/* Feature Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>24/7 AI Qualification</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Instantly convert web visitors into verified CRM leads.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Layers size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Vector Knowledge Base</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>RAG vector store with product search & doc embeddings.</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Isolated Multi-Tenant Architecture</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Dedicated company data privacy & security standards.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
            <Sparkles size={14} color="#6366f1" /> Powered by OpenAI & Vector RAG Engine
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div style={{ padding: '44px 38px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '28px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); setVerificationUrl(''); }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: mode === 'login' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: mode === 'login' ? '#fff' : '#94a3b8',
                boxShadow: mode === 'login' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); setVerificationUrl(''); }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: mode === 'register' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: mode === 'register' ? '#fff' : '#94a3b8',
                boxShadow: mode === 'register' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            >
              Register Company
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
              {mode === 'login' && 'Sign in to Dashboard'}
              {mode === 'register' && 'Create Company Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'unverified' && 'Verify Email Address'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {mode === 'login' && 'Enter your credentials to access your sales portal.'}
              {mode === 'register' && 'Set up your company workspace and admin profile.'}
              {mode === 'forgot' && 'Enter your account email to receive recovery link.'}
              {mode === 'unverified' && 'Complete email verification to access your workspace.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: '1.4'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: '1.4'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{success}</div>
            </div>
          )}

          {/* Verification Direct Link Banner */}
          {verificationUrl && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                <MailCheck size={18} /> Quick Email Verification Link
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>
                Click below to verify immediately and access your company dashboard:
              </p>
              <button
                type="button"
                onClick={() => handleSimulateVerification(verificationUrl)}
                disabled={verifying}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
              >
                <ExternalLink size={14} /> {verifying ? 'Verifying Email...' : 'Verify Email & Activate Account'}
              </button>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <>
                {/* Company Name */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Company Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. DLK Software Solution"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                {/* Website & Industry grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Website URL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        style={{ width: '100%', paddingLeft: '38px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Industry / Focus
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Software / Training"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        style={{ width: '100%', paddingLeft: '38px' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {mode === 'register' ? 'Admin Email Address *' : 'Email Address *'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot' && mode !== 'unverified' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter for Registration */}
                {mode === 'register' && password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Strength:</span>
                      <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                    </div>
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(strength.score / 4) * 100}%`,
                        background: strength.color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                justify: 'center',
                marginTop: '10px',
                padding: '13px',
                fontSize: '14px',
                borderRadius: '12px'
              }}
            >
              {loading ? 'Processing...' : (
                mode === 'register' ? 'Register Account' :
                mode === 'login' ? 'Sign In to Account' :
                mode === 'unverified' ? 'Resend Email Verification' :
                'Send Reset Password Instructions'
              )}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Footer Back Link */}
          {mode === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Bot, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, MailCheck, ExternalLink, RefreshCw, Mail } from 'lucide-react';
import { api } from '../api/client';

export default function LoginModal({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'unverified'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Detailed company registration fields
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setVerificationUrl('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode !== 'forgot' && mode !== 'unverified' && password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        if (!companyName.trim()) {
          throw new Error('Please enter your company name');
        }
        const comp = await onRegister.createCompany(
          companyName.trim(),
          companyWebsite.trim(),
          companyDescription.trim() || 'Company registered via portal'
        );
        const regRes = await onRegister.registerUser(comp.id, email, password);
        
        setSuccess(`Registration successful! A verification email link has been sent to ${email}.`);
        if (regRes?.verification_url) {
          setVerificationUrl(regRes.verification_url);
        }
        setMode('login');
        setCompanyName('');
        setCompanyWebsite('');
        setCompanyDescription('');
      } else if (mode === 'login') {
        try {
          await onLogin(email, password);
        } catch (err) {
          if (err.message.includes('not verified')) {
            setMode('unverified');
            setError('Your email address is registered but not yet verified. Please verify your email to unlock dashboard access.');
          } else {
            throw err;
          }
        }
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccess(res.message || 'Password reset instructions sent!');
      } else if (mode === 'unverified') {
        const res = await api.resendVerification(email);
        setSuccess(res.message || 'Verification email link resent!');
        if (res.verification_url) {
          setVerificationUrl(res.verification_url);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
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
      background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.95), rgba(11, 15, 25, 0.98))',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200
    }}>
      <div className="glass-card" style={{ width: '480px', padding: '36px', maxWidth: '90%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)', marginBottom: '14px'
          }}>
            <Bot size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Register Company Account'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'unverified' && 'Email Verification Required'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>
            {mode === 'login' && 'Sign in to access your AI Sales Bot management portal.'}
            {mode === 'register' && 'Register your company and verify your email to access the dashboard.'}
            {mode === 'forgot' && 'Enter your registered email to receive password instructions.'}
            {mode === 'unverified' && 'Verify your email address to unlock your company dashboard.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Verification Link Box */}
        {verificationUrl && (
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <MailCheck size={18} /> Direct Email Verification Link
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
              A verification email has been dispatched via SMTP. You can also click below to verify immediately:
            </p>
            <button
              onClick={() => handleSimulateVerification(verificationUrl)}
              disabled={verifying}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
            >
              <ExternalLink size={14} /> {verifying ? 'Verifying Email...' : 'Click to Verify Email & Unlock Dashboard'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Company Name *</label>
                <input type="text" required placeholder="e.g. Acme Tech Solutions" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Website URL</label>
                  <input type="url" placeholder="https://acme.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Industry / Focus</label>
                  <input type="text" placeholder="B2B Software" value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Admin Email Address *</label>
            <input type="email" required placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
          </div>

          {mode !== 'forgot' && mode !== 'unverified' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Password *</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} style={{ background: 'none', color: 'var(--accent-indigo)', fontSize: '12px', fontWeight: 500 }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
            {loading ? 'Processing...' : (
              mode === 'register' ? 'Register Account' :
              mode === 'login' ? 'Sign In to Portal' :
              mode === 'unverified' ? 'Resend Email Verification Link' :
              'Send Reset Password Instructions'
            )}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'login' && (
            <div>
              Don't have a company account?{' '}
              <button onClick={() => { setMode('register'); setError(''); setSuccess(''); setVerificationUrl(''); }} style={{ background: 'none', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                Register Company Account
              </button>
            </div>
          )}
          {mode !== 'login' && (
            <div>
              Already registered?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); setVerificationUrl(''); }} style={{ background: 'none', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                Sign In to Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

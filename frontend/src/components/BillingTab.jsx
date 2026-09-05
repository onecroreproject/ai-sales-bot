import React from 'react';
import { CreditCard, CheckCircle2, Zap, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function BillingTab({ company }) {
  const plans = [
    {
      name: 'Starter Plan',
      price: '$0',
      period: 'Forever Free',
      description: 'Ideal for small websites starting out with basic lead capture.',
      features: ['Up to 500 Messages/mo', '10 Product Catalog Items', 'Standard Web Widget', 'Email Support'],
      current: false,
    },
    {
      name: 'Pro Platform Plan',
      price: '$49',
      period: 'per month',
      description: 'Best for growing businesses requiring custom branding & AI knowledge vector search.',
      features: ['10,000 Messages/mo', 'Unlimited Products & Knowledge', 'Custom Logo & 10 Icon Picker', 'Vector Embedding RAG Engine', 'Domain Whitelist Security', 'Priority SLA Support'],
      current: true,
      popular: true,
    },
    {
      name: 'Enterprise Plan',
      price: '$199',
      period: 'per month',
      description: 'Dedicated high-concurrency infrastructure & custom LLM fine-tuning.',
      features: ['Unlimited Messages/mo', 'Dedicated PostgreSQL Pool', 'Custom CRM Integrations', 'Custom Domain SSL', 'Dedicated Account Manager'],
      current: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Billing & Subscription</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Manage your subscription tier, active plan features, payment methods, and invoices.
        </p>
      </div>

      {/* Active Subscription Overview Banner */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> ACTIVE SUBSCRIPTION
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Renews on Oct 1, 2026</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {company?.name || 'Company Account'} &mdash; Pro Platform Plan ($49/mo)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Includes 10,000 monthly AI messages, custom branding launcher, and vector embedding RAG engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary">
            <CreditCard size={16} /> Manage Payment Method
          </button>
        </div>
      </div>

      {/* Subscription Tier Selection Grid */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Available Platform Plans
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: plan.current ? '2px solid var(--accent-indigo)' : '1px solid var(--border-glass)',
                position: 'relative'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', right: '20px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                  fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  MOST POPULAR
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '12px 0 6px 0' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ {plan.period}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '20px' }}>
                  {plan.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={16} color="#10b981" /> {feat}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={plan.current ? 'btn-secondary' : 'btn-primary'}
                disabled={plan.current}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {plan.current ? 'Current Plan' : 'Upgrade Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Loader, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { getPortalConfig, isRoleAllowedOnPortal, getLoginRedirect } from '../utils/portalConfig';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const portal = getPortalConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });

      // Check if this user's role is allowed on this portal
      if (!isRoleAllowedOnPortal(data.user.role, portal)) {
        toast.error('Access denied for this portal');
        setLoading(false);
        return;
      }

      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate(getLoginRedirect(data.user.role, portal));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Portal-specific gradient colors
  const gradientBg = `radial-gradient(at 20% 20%, ${portal.gradientFrom}55 0px, transparent 50%),
    radial-gradient(at 80% 80%, ${portal.gradientTo}40 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(6,182,212,0.15) 0px, transparent 50%)`;

  const accentGradient = `linear-gradient(135deg, ${portal.gradientFrom}, ${portal.gradientTo})`;

  const portalFeatures: Record<string, string[]> = {
    staff:    ['New Orders', 'Manage Orders', 'Track Delivery', 'Customer History'],
    dispatch: ['Ready Orders', 'Dispatch Items', 'Hold Management', 'Dispatch History'],
    billing:  ['Generate Bills', 'GST Invoices', 'Payment Tracking', 'Customer Ledger'],
    stock:    ['Stock Levels', 'Add Products', 'Categories', 'Low Stock Alerts'],
    all:      ['Real-time stock', 'Multi-role access', 'GST billing', 'Paper orders'],
  };
  const features = portalFeatures[portal.type] ?? portalFeatures['all'];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#0B0F1A',
      position: 'relative',
      overflow: 'hidden',
    }} className="login-root">

      {/* LEFT — Brand panel */}
      <div className="login-brand-panel" style={{
        position: 'relative',
        padding: '3rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0B0F1A',
        backgroundImage: gradientBg,
        overflow: 'hidden',
      }}>
        {/* Floating orbs */}
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${portal.gradientFrom}50 0%, transparent 70%)`,
          top: '-150px', right: '-150px',
          animation: 'float 8s ease-in-out infinite',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${portal.gradientTo}40 0%, transparent 70%)`,
          bottom: '-100px', left: '-100px',
          animation: 'float 10s ease-in-out infinite reverse',
          filter: 'blur(40px)',
        }} />

        {/* Logo + Brand */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 54, height: 54,
            background: 'white',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px -6px rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <img
              src="https://ik.imagekit.io/rishii/bafnatoys/Copy%20of%20Super_Car___05_vrkphh.webp?updatedAt=1775309336739"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              alt="Logo"
            />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em' }}>
            Stock<span style={{ background: accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.85rem',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)',
            fontWeight: 600, marginBottom: '1.5rem', backdropFilter: 'blur(8px)',
          }}>
            <Sparkles size={13} color={portal.accentColor} />
            {portal.label}
          </div>
          <h1 style={{
            fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 800,
            color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.25rem',
          }}>
            Manage stock<br />
            <span style={{ background: accentGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              smarter, not harder.
            </span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 460 }}>
            {portal.subtitle} — designed for your workflow.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {features.map(t => (
            <span key={t} style={{
              padding: '0.45rem 0.9rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999, fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)',
              fontWeight: 500, backdropFilter: 'blur(8px)',
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div style={{
        background: '#F7F8FA', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2rem', position: 'relative',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Portal badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.85rem', borderRadius: 999, marginBottom: '1.5rem',
            background: `${portal.accentColor}15`, border: `1px solid ${portal.accentColor}30`,
            fontSize: '0.75rem', fontWeight: 700, color: portal.accentColor,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: portal.accentColor }} />
            {portal.label}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 800,
              letterSpacing: '-0.03em', marginBottom: '0.5rem', color: 'var(--text)',
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Sign in to your {portal.label} account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: '2.75rem', height: 48 }}
                  type="text"
                  placeholder="Enter your Email ID"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  id="login-username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem', height: 48 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-lg"
              disabled={loading}
              id="login-submit"
              style={{
                width: '100%', marginTop: '1rem', height: 50, fontSize: '0.95rem',
                background: accentGradient, color: 'white', border: 'none',
                boxShadow: `0 8px 24px -8px ${portal.accentColor}80`,
              }}
            >
              {loading ? <><Loader size={18} className="spin-icon" /> Signing in...</> : <>Sign In <ArrowRight size={17} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            StockPro v2.0 · 2026 Edition
          </p>
        </div>
      </div>

      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .login-root { grid-template-columns: 1fr !important; }
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;

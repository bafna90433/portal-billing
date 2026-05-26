import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPortalConfig } from '../utils/portalConfig';

interface HeroAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary';
}

interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  actions?: HeroAction[];
  onRefresh?: () => void;
  refreshing?: boolean;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
}

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
}

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const DashboardHero: React.FC<DashboardHeroProps> = ({
  title, subtitle, actions = [], onRefresh, refreshing = false, stats,
}) => {
  const { user } = useAuthStore();
  const portal = getPortalConfig();
  const now = useLiveClock();
  const { text: greeting, emoji } = getGreeting();

  const gradientBg = `linear-gradient(135deg, ${portal.gradientFrom}22 0%, ${portal.gradientTo}18 100%)`;
  const accentGradient = `linear-gradient(135deg, ${portal.gradientFrom}, ${portal.gradientTo})`;

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div style={{
      position: 'relative',
      borderRadius: 'var(--radius-lg)',
      background: gradientBg,
      border: `1px solid ${portal.accentColor}25`,
      padding: '1.5rem 1.75rem',
      marginBottom: '1.5rem',
      overflow: 'hidden',
      boxShadow: `0 4px 24px -8px ${portal.accentColor}30`,
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: `radial-gradient(circle, ${portal.gradientFrom}30 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, right: 120,
        width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${portal.gradientTo}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentGradient, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>

        {/* LEFT: Greeting + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Greeting row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1rem' }}>{emoji}</span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: portal.accentColor,
              background: `${portal.accentColor}15`,
              border: `1px solid ${portal.accentColor}30`,
              borderRadius: 999, padding: '0.15rem 0.65rem',
              letterSpacing: '0.02em',
            }}>
              {greeting}, {user?.name?.split(' ')[0]}!
            </span>
            {/* Live clock pill */}
            <span style={{
              fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid var(--border)',
              borderRadius: 999, padding: '0.15rem 0.65rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              backdropFilter: 'blur(8px)',
            }}>
              <Clock size={10} style={{ color: portal.accentColor }} />
              {timeStr}
            </span>
          </div>

          {/* Main title */}
          <h1 style={{
            fontSize: '1.55rem', fontWeight: 800, margin: 0,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em', color: 'var(--text)',
            lineHeight: 1.15,
          }}>
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}

          {/* Date badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            marginTop: '0.65rem',
            fontSize: '0.7rem', fontWeight: 600,
            color: 'var(--text-dim)',
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid var(--border-soft)',
            borderRadius: 999, padding: '0.2rem 0.7rem',
            backdropFilter: 'blur(8px)',
          }}>
            <Calendar size={10} style={{ color: portal.accentColor }} />
            {dateStr}
          </div>

          {/* Inline mini stats */}
          {stats && stats.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                    color: s.color || portal.accentColor, letterSpacing: '-0.03em',
                  }}>{s.value ?? '—'}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh"
              style={{
                width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--border)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.18s', backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.7)'; }}
            >
              <RefreshCw size={14} style={{
                color: portal.accentColor,
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }} />
            </button>
          )}

          {actions.map((action, i) => {
            const isPrimary = action.variant !== 'secondary';
            const btnStyle: React.CSSProperties = isPrimary ? {
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              background: accentGradient,
              color: 'white', border: 'none',
              borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem',
              boxShadow: `0 4px 14px -4px ${portal.accentColor}60`,
              textDecoration: 'none', fontFamily: 'var(--font-sans)',
              transition: 'all 0.18s',
            } : {
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              background: 'rgba(255,255,255,0.7)',
              color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', fontFamily: 'var(--font-sans)',
              backdropFilter: 'blur(8px)', transition: 'all 0.18s',
            };

            if (action.to) {
              return (
                <Link key={i} to={action.to} style={btnStyle}>
                  {action.icon}{action.label}
                </Link>
              );
            }
            return (
              <button key={i} onClick={action.onClick} style={btnStyle as React.CSSProperties}>
                {action.icon}{action.label}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DashboardHero;

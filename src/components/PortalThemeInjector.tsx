import React, { useEffect } from 'react';
import { getPortalConfig, type PortalType } from '../utils/portalConfig';

/** Per-portal CSS variable overrides — applied once on mount */
const PORTAL_THEMES: Record<PortalType, Record<string, string>> = {
  staff: {
    '--primary':            '#EF4444',
    '--primary-50':         '#FEF2F2',
    '--primary-100':        '#FEE2E2',
    '--primary-500':        '#EF4444',
    '--primary-600':        '#DC2626',
    '--primary-700':        '#B91C1C',
    '--primary-light':      '#FCA5A5',
    '--primary-subtle':     'rgba(239,68,68,0.08)',
    '--primary-glow':       'rgba(239,68,68,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#EF4444 0%,#F97316 60%,#FB923C 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(239,68,68,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(239,68,68,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(249,115,22,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(239,68,68,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(249,115,22,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(251,146,60,0.10) 0px,transparent 50%)',
  },
  dispatch: {
    '--primary':            '#06B6D4',
    '--primary-50':         '#ECFEFF',
    '--primary-100':        '#CFFAFE',
    '--primary-500':        '#06B6D4',
    '--primary-600':        '#0891B2',
    '--primary-700':        '#0E7490',
    '--primary-light':      '#67E8F9',
    '--primary-subtle':     'rgba(6,182,212,0.08)',
    '--primary-glow':       'rgba(6,182,212,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#06B6D4 0%,#10B981 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(6,182,212,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(6,182,212,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(6,182,212,0.18),rgba(16,185,129,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(6,182,212,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(16,185,129,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(5,150,105,0.10) 0px,transparent 50%)',
  },
  billing: {
    '--primary':            '#F59E0B',
    '--primary-50':         '#FFFBEB',
    '--primary-100':        '#FEF3C7',
    '--primary-500':        '#F59E0B',
    '--primary-600':        '#D97706',
    '--primary-700':        '#B45309',
    '--primary-light':      '#FCD34D',
    '--primary-subtle':     'rgba(245,158,11,0.08)',
    '--primary-glow':       'rgba(245,158,11,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(245,158,11,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(245,158,11,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(239,68,68,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(245,158,11,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(239,68,68,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(217,119,6,0.10) 0px,transparent 50%)',
  },
  stock: {
    '--primary':            '#10B981',
    '--primary-50':         '#ECFDF5',
    '--primary-100':        '#D1FAE5',
    '--primary-500':        '#10B981',
    '--primary-600':        '#059669',
    '--primary-700':        '#047857',
    '--primary-light':      '#6EE7B7',
    '--primary-subtle':     'rgba(16,185,129,0.08)',
    '--primary-glow':       'rgba(16,185,129,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#10B981 0%,#3B82F6 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(16,185,129,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(16,185,129,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(59,130,246,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(16,185,129,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(59,130,246,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(5,150,105,0.10) 0px,transparent 50%)',
  },
  admin: {
    // keep CSS defaults (indigo)
    '--primary':            '#6366F1',
    '--primary-50':         '#EEF2FF',
    '--primary-100':        '#E0E7FF',
    '--primary-500':        '#6366F1',
    '--primary-600':        '#4F46E5',
    '--primary-700':        '#4338CA',
    '--primary-light':      '#A5B4FC',
    '--primary-subtle':     'rgba(99,102,241,0.08)',
    '--primary-glow':       'rgba(99,102,241,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#6366F1 0%,#8B5CF6 60%,#A855F7 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(99,102,241,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(99,102,241,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(99,102,241,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(168,85,247,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(6,182,212,0.10) 0px,transparent 50%)',
  },
  all: {
    '--primary':            '#6366F1',
    '--primary-50':         '#EEF2FF',
    '--primary-100':        '#E0E7FF',
    '--primary-500':        '#6366F1',
    '--primary-600':        '#4F46E5',
    '--primary-700':        '#4338CA',
    '--primary-light':      '#A5B4FC',
    '--primary-subtle':     'rgba(99,102,241,0.08)',
    '--primary-glow':       'rgba(99,102,241,0.18)',
    '--grad-primary':       'linear-gradient(135deg,#6366F1 0%,#8B5CF6 60%,#A855F7 100%)',
    '--shadow-primary':     '0 8px 24px -8px rgba(99,102,241,0.45)',
    '--shadow-glow':        '0 0 0 4px rgba(99,102,241,0.12)',
    '--sidebar-active-bg':  'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.10))',
    '--grad-mesh':
      'radial-gradient(at 20% 0%,rgba(99,102,241,0.18) 0px,transparent 50%),' +
      'radial-gradient(at 80% 0%,rgba(168,85,247,0.12) 0px,transparent 50%),' +
      'radial-gradient(at 50% 100%,rgba(6,182,212,0.10) 0px,transparent 50%)',
  },
};

/** Injects portal-specific CSS variables into :root once on mount */
const PortalThemeInjector: React.FC = () => {
  useEffect(() => {
    const portal = getPortalConfig();
    const theme = PORTAL_THEMES[portal.type] ?? PORTAL_THEMES['all'];
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  return null;
};

export default PortalThemeInjector;

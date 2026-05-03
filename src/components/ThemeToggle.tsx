'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const t = getStoredTheme()
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return { theme, toggle }
}

interface Props {
  /** Apparence : 'pill' (défaut) ou 'icon' */
  variant?: 'pill' | 'icon'
}

export default function ThemeToggle({ variant = 'icon' }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  if (variant === 'pill') {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
        style={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.12)',
          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)',
        }}
      >
        {isDark ? '☀️' : '🌙'}
        <span className="hidden sm:inline">{isDark ? 'Clair' : 'Sombre'}</span>
      </button>
    )
  }

  /* variant === 'icon' */
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      {isDark ? (
        /* Soleil */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Lune */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

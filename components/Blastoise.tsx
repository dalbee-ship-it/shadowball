'use client'
import Link from 'next/link'
import { useTheme } from '@/lib/theme'

export function BlastoiseHeader() {
  const { theme, toggle } = useTheme()

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/692.png"
          alt="clauncher"
          width={48}
          height={48}
          style={{ imageRendering: 'auto' }}
        />
        <div className="flex-1">
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.6rem',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: 'var(--text-primary)',
            }}
          >Mega Launcher</h1>
          <p className="text-xs tracking-widest" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--text-muted)', marginTop: '2px' }}>
            Active Agent Monitor
          </p>
        </div>
        <button
          onClick={toggle}
          className="text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0"
          style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? '☀︎' : '☽'}
        </button>
      </div>
    </header>
  )
}

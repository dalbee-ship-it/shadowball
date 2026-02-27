'use client'
import { useEffect, useRef, useState } from 'react'

const STATUS_GROUPS = [
  {
    label: '할 일',
    options: [
      { status: 'waiting', label: '대기', dot: '#9ca3af' },
    ],
  },
  {
    label: '진행 중',
    options: [
      { status: 'active', label: '진행', dot: '#22d3ee' },
      { status: 'issue',  label: '이슈', dot: '#f97316' },
    ],
  },
  {
    label: '완료',
    options: [
      { status: 'done',     label: '완료', dot: '#4ade80' },
      { status: 'archived', label: '보관', dot: '#6b7280' },
    ],
  },
]

const STATUS_OPTIONS = STATUS_GROUPS.flatMap(g => g.options)

const BADGE_COLOR: Record<string, string> = {
  waiting:  'bg-gray-500/20 text-gray-400',
  active:   'bg-cyan-500/20 text-cyan-400',
  issue:    'bg-orange-500/20 text-orange-400',
  done:     'bg-green-500/20 text-green-400',
  archived: 'bg-gray-700/30 text-gray-500',
}

interface Props {
  current: string
  onChange: (status: string) => Promise<void>
}

export function StatusPicker({ current, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function select(status: string) {
    if (status === current) { setOpen(false); return }
    setLoading(status)
    await onChange(status)
    setLoading(null)
    setOpen(false)
  }

  const badge = BADGE_COLOR[current] ?? ''
  const currentLabel = STATUS_OPTIONS.find(o => o.status === current)?.label ?? current

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      {/* 현재 상태 뱃지 — 클릭하면 드롭다운 */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`ui-sans text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-opacity hover:opacity-80 ${badge}`}
      >
        {currentLabel}
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl py-1.5 min-w-[120px] shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {STATUS_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* 그룹 구분선 (첫 번째 제외) */}
              {gi > 0 && (
                <div className="my-1 mx-2" style={{ borderTop: '1px solid var(--border)' }} />
              )}
              {/* 그룹 라벨 */}
              <div className="px-3 py-1 ui-sans text-xs" style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </div>
              {/* 옵션들 */}
              {group.options.map(opt => (
                <button
                  key={opt.status}
                  onClick={() => select(opt.status)}
                  disabled={loading !== null}
                  className="ui-sans w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer disabled:opacity-50"
                  style={{
                    color: opt.status === current ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: opt.status === current ? 600 : 400,
                    background: opt.status === current ? 'var(--bg-input)' : 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
                  onMouseLeave={e => (e.currentTarget.style.background = opt.status === current ? 'var(--bg-input)' : 'transparent')}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                  {loading === opt.status ? '...' : opt.label}
                  {opt.status === current && <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

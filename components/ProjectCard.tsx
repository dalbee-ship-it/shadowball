'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PokemonSprite } from './PokemonSprite'
import { StatusPicker } from './StatusPicker'

interface Task {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  agent_label: string
}

interface Log {
  id: string
  type: 'system' | 'agent' | 'user'
  message: string
  created_at: string
}

interface Project {
  id: string
  name: string
  progress: number
  pokemon_id: number
  status: string
  last_updated_at: string
  tasks: Task[]
}

const TASK_STATUS_COLOR: Record<string, string> = {
  queued:  'text-gray-500',
  running: 'text-cyan-400 animate-pulse',
  done:    'text-green-400',
  failed:  'text-red-400',
}
const TASK_STATUS_ICON: Record<string, string> = {
  queued: '○', running: '▶', done: '✓', failed: '✗',
}

const LOG_COLOR: Record<string, string> = {
  system: 'var(--text-muted)',
  agent:  '#22d3ee',
  user:   'var(--text-primary)',
}
const LOG_PREFIX: Record<string, string> = { system: '·', agent: '▶', user: '›' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function ProjectCard({
  project, expandedId, onToggle, onUpdate,
}: {
  project: Project
  expandedId: string | null
  onToggle: (id: string | null) => void
  onUpdate: () => void
}) {
  const expanded = expandedId === project.id
  const [hovered, setHovered] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const runningCount = project.tasks.filter(t => t.status === 'running').length

  useEffect(() => {
    if (!expanded) return
    fetch(`/api/logs?project_id=${project.id}`)
      .then(r => r.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))

    const channel = supabase
      .channel(`log-${project.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'logs',
        filter: `project_id=eq.${project.id}`,
      }, payload => setLogs(prev => [...prev, payload.new as Log]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [expanded, project.id])

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, expanded])

  async function changeStatus(status: string) {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
  }

  async function sendLog(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSending(true)
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, message: input.trim(), type: 'user' }),
    })
    setInput('')
    setSending(false)
  }

  return (
    <div
      className={`card ${expanded ? 'expanded' : ''}`}
      style={{ boxShadow: hovered && !expanded ? '0 0 0 1px var(--border-hover)' : undefined }}
    >
      {/* 카드 헤더 */}
      <div
        className="p-4 cursor-pointer select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onToggle(expanded ? null : project.id)}
      >
        {/* 상태 + 토글 */}
        <div className="flex items-center justify-between mb-3">
          <StatusPicker current={project.status} onChange={changeStatus} />
          <div className="flex items-center gap-2 ui-sans">
            {runningCount > 0 && (
              <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>
            )}
            <span className="text-muted text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* 포켓몬 — 중앙 크게 */}
        <div className="flex justify-center mb-2">
          <PokemonSprite
            pokemonId={project.pokemon_id}
            progress={project.progress}
            lastUpdatedAt={project.last_updated_at}
            size={128}
          />
        </div>

        {/* 프로젝트 이름 — 중앙 */}
        <h3 className="font-bold text-primary leading-tight mb-3 text-center" style={{ fontSize: '1.1rem' }}>
          {project.name}
        </h3>

        {/* 진행도 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 progress-track rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="ui-sans text-xs text-muted flex-shrink-0">{project.progress}%</span>
        </div>

        {/* 태스크 미리보기 */}
        {!expanded && project.tasks.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {project.tasks.slice(0, 2).map(task => (
              <li key={task.id} className="flex items-center gap-1.5 ui-sans" style={{ fontSize: '0.8rem' }}>
                <span className={`flex-shrink-0 ${TASK_STATUS_COLOR[task.status]}`}>{TASK_STATUS_ICON[task.status]}</span>
                <span className="text-secondary truncate">{task.title}</span>
              </li>
            ))}
            {project.tasks.length > 2 && (
              <li className="text-muted ui-sans" style={{ fontSize: '0.75rem' }}>+{project.tasks.length - 2} more</li>
            )}
          </ul>
        )}
      </div>

      {/* 펼쳐진 영역 */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* 로그 타임라인 */}
          <div className="px-4 py-3 space-y-2 max-h-56 overflow-y-auto">
            {logs.length === 0
              ? <p className="ui-sans text-xs text-muted italic">아직 기록이 없어요.</p>
              : logs.map(log => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="ui-sans text-xs flex-shrink-0 mt-0.5" style={{ color: LOG_COLOR[log.type] }}>
                    {LOG_PREFIX[log.type]}
                  </span>
                  <span className="ui-sans text-xs text-muted flex-shrink-0 w-10">{formatTime(log.created_at)}</span>
                  <span className="ui-sans text-sm leading-snug" style={{ color: LOG_COLOR[log.type] }}>
                    {log.message}
                  </span>
                </div>
              ))
            }
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <form onSubmit={sendLog} className="flex gap-2 px-4 pb-3">
            <input
              className="input flex-1"
              placeholder="메모 또는 명령..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="ui-sans bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm"
            >→</button>
          </form>


        </div>
      )}
    </div>
  )
}

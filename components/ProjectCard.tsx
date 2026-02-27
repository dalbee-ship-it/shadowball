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
  due_date: string | null
  tasks: Task[]
}

function formatDue(due: string | null) {
  if (!due) return null
  const d = new Date(due)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { text: `${Math.abs(diff)}일 초과`, color: 'text-red-400' }
  if (diff === 0) return { text: '오늘 마감', color: 'text-red-400' }
  if (diff <= 3) return { text: `D-${diff}`, color: 'text-orange-400' }
  return { text: `D-${diff}`, color: 'text-muted' }
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

function formatRelativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff === 0) return '오늘'
  if (daysDiff === 1) return '어제'
  if (daysDiff === 2) return '그저께'
  return `${daysDiff}일 전`
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



  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'queued' : 'done'
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    onUpdate()
  }

  async function changeStatus(status: string) {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdate()
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
        <div className="flex gap-3 items-center">
          {/* 포켓몬 */}
          <div className="flex-shrink-0">
            <PokemonSprite
              pokemonId={project.pokemon_id}
              progress={project.progress}
              lastUpdatedAt={project.last_updated_at}
              size={72}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <StatusPicker current={project.status} onChange={changeStatus} />
              <div className="flex items-center gap-2 ui-sans">
                {runningCount > 0 && <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>}
                <span className="text-muted text-sm">{expanded ? '▲' : '▼'}</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-1 mb-2">
              <h3 className="font-bold text-primary leading-tight" style={{ fontSize: '1rem' }}>
                {project.name}
              </h3>
              {(() => {
                const due = formatDue(project.due_date)
                return due ? (
                  <span className={`ui-sans text-xs flex-shrink-0 mt-0.5 ${due.color}`}>{due.text}</span>
                ) : null
              })()}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 progress-track rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${project.progress}%` }} />
              </div>
              <span className="ui-sans text-xs text-muted flex-shrink-0">{project.progress}%</span>
            </div>

            {!expanded && project.tasks.length > 0 && (() => {
              const sorted = [...project.tasks].sort((a, b) => {
                const order = { running: 0, queued: 1, failed: 2, done: 3 }
                return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9)
              })
              const topTask = sorted[0]
              return (
                <ul className="mt-1.5 space-y-0.5">
                  <li className="flex items-center gap-1.5 ui-sans" style={{ fontSize: '0.75rem' }}>
                    {topTask.status === 'running' ? (
                      <span className="flex-shrink-0 text-cyan-400 animate-pulse text-xs">▶</span>
                    ) : (
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center rounded-[3px] border"
                        style={{
                          width: '12px', height: '12px', fontSize: '9px', lineHeight: 1,
                          borderColor: topTask.status === 'done' ? '#4ade80' : 'var(--border-hover)',
                          background: topTask.status === 'done' ? '#4ade80' : 'transparent',
                          color: topTask.status === 'done' ? '#000' : 'transparent',
                        }}
                      >
                        {topTask.status === 'done' ? '✓' : ''}
                      </span>
                    )}
                    <span className={`truncate ${topTask.status === 'done' ? 'text-muted line-through' : 'text-secondary'}`}>
                      {topTask.title}
                    </span>
                  </li>
                </ul>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 펼쳐진 영역 — 스크롤 통합 */}
      {expanded && (
        <div className="max-h-72 overflow-y-auto" style={{ borderTop: '1px solid var(--border)' }}>
          {/* 태스크 전체 */}
          {project.tasks.length > 0 && (() => {
            const sorted = [...project.tasks].sort((a, b) => {
              const order = { running: 0, queued: 1, failed: 2, done: 3 }
              return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9)
            })
            return (
              <ul className="px-4 pt-3 pb-2 space-y-1.5">
                {sorted.map(task => (
                  <li key={task.id} className="flex items-center gap-2 ui-sans" style={{ fontSize: '0.8rem' }}>
                    {task.status === 'running' ? (
                      <span className="flex-shrink-0 text-cyan-400 animate-pulse" style={{ fontSize: '0.7rem' }}>▶</span>
                    ) : (
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center rounded-[3px] border"
                        style={{
                          width: '13px', height: '13px', fontSize: '9px', lineHeight: 1,
                          borderColor: task.status === 'done' ? '#4ade80' : 'var(--border-hover)',
                          background: task.status === 'done' ? '#4ade80' : 'transparent',
                          color: task.status === 'done' ? '#000' : 'transparent',
                        }}
                      >
                        {task.status === 'done' ? '✓' : ''}
                      </span>
                    )}
                    <span className={`${task.status === 'done' ? 'text-muted line-through' : 'text-secondary'}`}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )
          })()}

          {/* 구분선 */}
          {logs.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', margin: '0 16px' }} />
          )}

          {/* 로그 타임라인 */}
          <div className="px-4 pt-2 pb-3 space-y-1">
            {logs.length === 0
              ? <p className="ui-sans text-xs text-muted italic">아직 기록이 없어요.</p>
              : (() => {
                  const groups: { label: string; items: Log[] }[] = []
                  let lastLabel = ''
                  for (const log of logs) {
                    const label = formatRelativeDate(log.created_at)
                    if (label !== lastLabel) {
                      groups.push({ label, items: [log] })
                      lastLabel = label
                    } else {
                      groups[groups.length - 1].items.push(log)
                    }
                  }
                  return groups.map(g => (
                    <div key={g.label}>
                      <div className="ui-sans text-muted mb-1 mt-2 first:mt-0 select-none" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                        — {g.label}
                      </div>
                      {g.items.map(log => (
                        <div key={log.id} className="flex items-start gap-2 mb-1">
                          <span className="ui-sans text-xs flex-shrink-0 mt-0.5" style={{ color: LOG_COLOR[log.type] }}>
                            {LOG_PREFIX[log.type]}
                          </span>
                          <span className="ui-sans text-sm leading-snug" style={{ color: LOG_COLOR[log.type] }}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                })()
            }
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  )
}

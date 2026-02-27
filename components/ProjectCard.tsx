'use client'
import { useState } from 'react'
import { PokemonSprite } from './PokemonSprite'

interface Task {
  id: string
  title: string
  status: 'queued' | 'running' | 'done' | 'failed'
  agent_label: string
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

const STATUS_ICON: Record<string, string> = {
  queued: '○',
  running: '▶',
  done: '✓',
  failed: '✗',
}
const STATUS_COLOR: Record<string, string> = {
  queued: 'text-gray-500',
  running: 'text-cyan-400 animate-pulse',
  done: 'text-green-400',
  failed: 'text-red-400',
}

const ACTION_BUTTONS = [
  { status: 'done',     label: '완료',  color: 'bg-green-500 hover:bg-green-400 text-black' },
  { status: 'paused',   label: '보류',  color: 'bg-yellow-500 hover:bg-yellow-400 text-black' },
  { status: 'archived', label: '보관',  color: 'bg-gray-600 hover:bg-gray-500 text-white' },
  { status: 'abandoned',label: '폐기',  color: 'bg-red-600 hover:bg-red-500 text-white' },
]

export function ProjectCard({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const runningCount = project.tasks.filter(t => t.status === 'running').length

  async function changeStatus(status: string) {
    setLoading(status)
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    setHovered(false)
    onUpdate()
  }

  const availableActions = ACTION_BUTTONS.filter(a => a.status !== project.status)

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 transition-colors"
      style={{ borderColor: hovered ? '#4B5563' : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(v => !v)}
    >
      <div className="flex-shrink-0 flex items-center">
        <PokemonSprite
          pokemonId={project.pokemon_id}
          progress={project.progress}
          lastUpdatedAt={project.last_updated_at}
          size={56}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* 상단: 이름 + 진행도 */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-white font-bold text-sm truncate">{project.name}</h3>
          <div className="flex items-center gap-2 flex-shrink-0 ui-sans">
            {runningCount > 0 && (
              <span className="text-xs text-cyan-400 animate-pulse">{runningCount} running</span>
            )}
            <span className="text-xs text-gray-500">{project.progress}%</span>
          </div>
        </div>

        {/* 진행도 바 */}
        <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${project.progress}%` }}
          />
        </div>

        {/* 호버 시 액션 버튼 / 평소엔 태스크 목록 */}
        <div className="mt-2 min-h-[1.5rem]">
          {hovered ? (
            <div className="flex flex-wrap gap-1.5">
              {availableActions.map(action => (
                <button
                  key={action.status}
                  onClick={() => changeStatus(action.status)}
                  disabled={loading !== null}
                  className={`ui-sans text-xs font-semibold px-3 py-1 rounded-md cursor-pointer transition-colors ${action.color} disabled:opacity-50`}
                >
                  {loading === action.status ? '...' : action.label}
                </button>
              ))}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {project.tasks.slice(0, 3).map(task => (
                <li key={task.id} className="flex items-center gap-1.5 text-xs ui-sans">
                  <span className={`flex-shrink-0 ${STATUS_COLOR[task.status]}`}>{STATUS_ICON[task.status]}</span>
                  <span className="text-gray-400 truncate">{task.title}</span>
                  <span className="text-gray-600 ml-auto flex-shrink-0">{task.agent_label}</span>
                </li>
              ))}
              {project.tasks.length > 3 && (
                <li className="text-xs text-gray-600 ui-sans">+{project.tasks.length - 3} more</li>
              )}
              {project.tasks.length === 0 && (
                <li className="text-xs text-gray-700 ui-sans italic">No tasks yet</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

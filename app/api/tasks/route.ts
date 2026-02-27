import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  // { project_id, agent_label, title, status, result? }

  // 기존 태스크 있으면 업데이트, 없으면 생성
  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', body.project_id)
    .eq('agent_label', body.agent_label)
    .single()

  let data, error
  if (existing) {
    ;({ data, error } = await supabase.from('tasks').update({ status: body.status }).eq('id', existing.id).select().single())
  } else {
    ;({ data, error } = await supabase.from('tasks').insert({
      project_id: body.project_id,
      agent_label: body.agent_label,
      title: body.title,
      status: body.status,
    }).select().single())
  }

  if (error) return NextResponse.json({ error }, { status: 500 })

  // 진행도 자동 계산
  const { data: tasks } = await supabase.from('tasks').select('status').eq('project_id', body.project_id)
  const total = tasks?.length ?? 0
  const done = tasks?.filter((t: { status: string }) => t.status === 'done').length ?? 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const projectUpdate: Record<string, unknown> = { progress, last_updated_at: new Date().toISOString() }
  if (progress === 100) projectUpdate.status = 'done'

  await supabase.from('projects').update(projectUpdate).eq('id', body.project_id)

  return NextResponse.json(data)
}

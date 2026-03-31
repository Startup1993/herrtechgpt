import { notFound } from 'next/navigation'
import { getWorkflow } from '@/lib/workflows'
import WorkflowSteps from './WorkflowSteps'

export default async function WorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params
  const workflow = getWorkflow(workflowId)
  if (!workflow) notFound()

  const difficultyColor = {
    Einfach: 'text-green-600 bg-green-50 border-green-200',
    Mittel: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Fortgeschritten: 'text-purple-600 bg-purple-50 border-purple-200',
  }[workflow.difficulty]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl">{workflow.emoji}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{workflow.name}</h1>
            <p className="text-muted mt-1">{workflow.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${difficultyColor}`}>
            {workflow.difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {workflow.duration}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {workflow.techStack.map((tech) => (
              <span key={tech} className="text-xs bg-surface-secondary border border-border text-muted px-2 py-0.5 rounded-md">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <WorkflowSteps steps={workflow.steps} />
    </div>
  )
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { QuickAddBar } from '@/components/quickadd/QuickAddBar';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { useProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const { data: tasks = [], isLoading } = useTasks(projectId!);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!projectId) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs text-slate-400 hover:underline">
              ← All projects
            </Link>
            <h1 className="text-xl font-bold text-slate-900">{project?.name}</h1>
          </div>
          <Link
            to={`/projects/${projectId}/templates`}
            className="text-sm text-indigo-600 hover:underline"
          >
            Templates
          </Link>
        </div>

        <QuickAddBar projectId={projectId} />

        {isLoading ? (
          <p className="text-slate-500">Loading tasks...</p>
        ) : (
          <KanbanBoard projectId={projectId} tasks={tasks} onTaskClick={setSelectedTask} />
        )}
      </div>

      <TaskDetailModal
        projectId={projectId}
        task={
          selectedTask ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask : null
        }
        onClose={() => setSelectedTask(null)}
      />
    </AppShell>
  );
}

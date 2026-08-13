import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { QuickAddBar } from '@/components/quickadd/QuickAddBar';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { FilterBar } from '@/components/board/FilterBar';
import { TaskDetailModal } from '@/components/task/TaskDetailModal';
import { useProject, useTags } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const { data: tasks = [], isLoading } = useTasks(projectId!);
  const { data: projectTags = [] } = useTags(projectId!);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [activeTagIds, setActiveTagIds] = useState<Set<string>>(new Set());

  const toggleTag = (tagId: string) => {
    setActiveTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        (task.description ?? '').toLowerCase().includes(q);
      const matchesTags =
        activeTagIds.size === 0 || task.tags.some((tag) => activeTagIds.has(tag.id));
      return matchesSearch && matchesTags;
    });
  }, [tasks, search, activeTagIds]);

  if (!projectId) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="text-xs text-slate-400 hover:underline">
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

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          tags={projectTags}
          activeTagIds={activeTagIds}
          onToggleTag={toggleTag}
        />

        {isLoading ? (
          <p className="text-slate-500">Loading tasks...</p>
        ) : (
          <KanbanBoard projectId={projectId} tasks={filteredTasks} onTaskClick={setSelectedTask} />
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

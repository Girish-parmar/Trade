import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Task, TaskStatus } from '@/types';
import { useMoveTask } from '@/hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ projectId, tasks, onTaskClick }: KanbanBoardProps) {
  const moveTask = useMoveTask(projectId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columns = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of tasks) {
      byStatus[task.status].push(task);
    }
    for (const status of STATUSES) {
      byStatus[status].sort((a, b) => a.position - b.position);
    }
    return byStatus;
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overIsColumn = STATUSES.includes(over.id as TaskStatus);
    const targetStatus: TaskStatus = overIsColumn
      ? (over.id as TaskStatus)
      : (tasks.find((t) => t.id === over.id)?.status ?? activeTask.status);

    if (overIsColumn) {
      if (activeTask.status === targetStatus) return;
      moveTask.mutate({ taskId: activeTask.id, status: targetStatus });
      return;
    }

    if (active.id === over.id) return;

    moveTask.mutate({ taskId: activeTask.id, status: targetStatus, afterId: over.id as string });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DndContext>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { TagBadge } from '@/components/common/TagBadge';
import { Avatar } from '@/components/common/Avatar';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab space-y-2 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm hover:shadow active:cursor-grabbing"
    >
      <p className="font-medium text-slate-900">{task.title}</p>
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-slate-400">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assignee && <Avatar user={task.assignee} size={20} />}
      </div>
    </div>
  );
}

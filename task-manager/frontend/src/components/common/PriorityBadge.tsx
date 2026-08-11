import type { TaskPriority } from '@/types';

const styles: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}

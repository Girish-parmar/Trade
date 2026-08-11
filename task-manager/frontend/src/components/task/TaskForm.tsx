import { useState } from 'react';
import type { Task, TaskPriority, User } from '@/types';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { AssigneePicker } from './AssigneePicker';
import { useDeleteTask, useUpdateTask } from '@/hooks/useTasks';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function TaskForm({
  projectId,
  task,
  onDeleted,
}: {
  projectId: string;
  task: Task;
  onDeleted: () => void;
}) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [assignee, setAssignee] = useState<User | null>(task.assignee);

  const save = (patch: Record<string, unknown>) => {
    updateTask.mutate({ taskId: task.id, input: patch });
  };

  return (
    <div className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== task.title && save({ title: title.trim() })}
        className="text-base font-medium"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== (task.description ?? '') && save({ description })}
        placeholder="Description..."
        rows={3}
        className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
          <select
            value={priority}
            onChange={(e) => {
              const value = e.target.value as TaskPriority;
              setPriority(value);
              save({ priority: value });
            }}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              save({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
            }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Assignee</label>
        <AssigneePicker
          assignee={assignee}
          onChange={(user) => {
            setAssignee(user);
            save({ assigneeId: user?.id ?? null });
          }}
        />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-3">
        <Button
          variant="danger"
          onClick={async () => {
            await deleteTask.mutateAsync(task.id);
            onDeleted();
          }}
        >
          Delete task
        </Button>
      </div>
    </div>
  );
}

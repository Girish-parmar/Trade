import { useState } from 'react';
import type { Tag, Task, TaskPriority, User } from '@/types';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { AssigneePicker } from './AssigneePicker';
import { TagPicker } from './TagPicker';
import { useDeleteTask, useUpdateTask } from '@/hooks/useTasks';
import { useMembers } from '@/hooks/useProjects';

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function toDateInputValue(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function extractErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return message ?? 'Something went wrong saving that change.';
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
  const { data: members = [] } = useMembers(projectId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [assignee, setAssignee] = useState<User | null>(task.assignee);
  const [tags, setTags] = useState<Tag[]>(task.tags);
  const [error, setError] = useState<string | null>(null);

  // Fields are set optimistically before the request resolves; on failure
  // we roll each one back to the last known-good server value (the `task`
  // prop, which only changes once a save actually succeeds) so the form
  // never keeps displaying a change that was never persisted.
  const save = async (patch: Record<string, unknown>, revert: () => void) => {
    setError(null);
    try {
      await updateTask.mutateAsync({ taskId: task.id, input: patch });
    } catch (err) {
      setError(extractErrorMessage(err));
      revert();
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="rounded-md bg-red-50 px-2 py-1.5 text-sm text-red-600">{error}</p>}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() =>
          title.trim() &&
          title !== task.title &&
          save({ title: title.trim() }, () => setTitle(task.title))
        }
        className="text-base font-medium"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() =>
          description !== (task.description ?? '') &&
          save({ description }, () => setDescription(task.description ?? ''))
        }
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
              save({ priority: value }, () => setPriority(task.priority));
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
              const value = e.target.value;
              setDueDate(value);
              save({ dueDate: value ? new Date(value).toISOString() : null }, () =>
                setDueDate(toDateInputValue(task.dueDate)),
              );
            }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Assignee</label>
        <AssigneePicker
          assignee={assignee}
          members={members}
          onChange={(user) => {
            setAssignee(user);
            save({ assigneeId: user?.id ?? null }, () => setAssignee(task.assignee));
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tags</label>
        <TagPicker
          projectId={projectId}
          selected={tags}
          onChange={(nextTags) => {
            setTags(nextTags);
            save({ tagIds: nextTags.map((t) => t.id) }, () => setTags(task.tags));
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

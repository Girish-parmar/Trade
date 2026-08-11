import { FormEvent, useRef, useState } from 'react';
import { DATE_SHORTCUTS } from '@/lib/dateShortcuts';
import { DateChip } from './DateChip';
import { useCreateTask } from '@/hooks/useTasks';

export function QuickAddBar({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask(projectId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({
      title: trimmed,
      dueDate: dueDate ?? undefined,
    });
    setTitle('');
    setDueDate(null);
    setActiveChip(null);
    inputRef.current?.focus();
  };

  const toggleChip = (label: string, compute: () => string) => {
    if (activeChip === label) {
      setActiveChip(null);
      setDueDate(null);
    } else {
      setActiveChip(label);
      setDueDate(compute());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task and press Enter..."
        className="w-full border-none text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {DATE_SHORTCUTS.map((shortcut) => (
          <DateChip
            key={shortcut.label}
            label={shortcut.label}
            active={activeChip === shortcut.label}
            onClick={() => toggleChip(shortcut.label, shortcut.compute)}
          />
        ))}
        {dueDate && (
          <span className="ml-1 text-xs text-slate-400">
            Due {new Date(dueDate).toLocaleDateString()}
          </span>
        )}
        <button
          type="submit"
          disabled={!title.trim() || createTask.isPending}
          className="ml-auto rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}

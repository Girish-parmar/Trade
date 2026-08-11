import { useMemo, useState } from 'react';
import type { ProjectMember, User } from '@/types';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';

interface AssigneePickerProps {
  assignee: User | null;
  members: ProjectMember[];
  onChange: (user: User | null) => void;
}

// Only project members are valid assignees - the backend rejects
// assigning to anyone who isn't a member of the project, so this only
// ever offers members rather than searching all registered users.
export function AssigneePicker({ assignee, members, onChange }: AssigneePickerProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .map((m) => m.user)
      .filter((user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
  }, [members, query]);

  if (assignee) {
    return (
      <div className="flex items-center gap-2">
        <Avatar user={assignee} size={22} />
        <span className="text-sm text-slate-700">{assignee.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-slate-400 hover:text-red-500"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search project members..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-md">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(user);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <Avatar user={user} size={20} />
                {user.name} <span className="text-xs text-slate-400">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && results.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">No matching project members.</p>
      )}
    </div>
  );
}

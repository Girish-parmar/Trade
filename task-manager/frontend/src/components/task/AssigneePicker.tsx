import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { searchUsers } from '@/api/users';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';

interface AssigneePickerProps {
  assignee: User | null;
  onChange: (user: User | null) => void;
}

export function AssigneePicker({ assignee, onChange }: AssigneePickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.trim()) {
        setResults(await searchUsers(query));
      } else {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

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
        placeholder="Search by name or email..."
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
                  setResults([]);
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
    </div>
  );
}

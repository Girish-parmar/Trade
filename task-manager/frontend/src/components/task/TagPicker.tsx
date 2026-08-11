import { FormEvent, useState } from 'react';
import type { Tag } from '@/types';
import { TagBadge } from '@/components/common/TagBadge';
import { Input } from '@/components/common/Input';
import { useCreateTag, useTags } from '@/hooks/useProjects';

const SWATCHES = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

interface TagPickerProps {
  projectId: string;
  selected: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagPicker({ projectId, selected, onChange }: TagPickerProps) {
  const { data: projectTags = [] } = useTags(projectId);
  const createTag = useCreateTag(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedIds = new Set(selected.map((t) => t.id));

  const toggle = (tag: Tag) => {
    const next = selectedIds.has(tag.id)
      ? selected.filter((t) => t.id !== tag.id)
      : [...selected, tag];
    onChange(next);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreateError(null);
    try {
      const tag = await createTag.mutateAsync({ name: name.trim(), color });
      onChange([...selected, tag]);
      setName('');
      setShowCreate(false);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not create tag.';
      setCreateError(message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {projectTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag)}
            className={selectedIds.has(tag.id) ? '' : 'opacity-40 hover:opacity-70'}
          >
            <TagBadge tag={tag} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
        >
          + Tag
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-2 flex items-center gap-2">
          <Input
            autoFocus
            placeholder="Tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-32"
          />
          <div className="flex gap-1">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-5 w-5 rounded-full border-2 ${color === swatch ? 'border-slate-700' : 'border-transparent'}`}
                style={{ backgroundColor: swatch }}
                aria-label={`Choose color ${swatch}`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!name.trim() || createTag.isPending}
            className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}
      {createError && <p className="mt-1 text-xs text-red-500">{createError}</p>}
    </div>
  );
}

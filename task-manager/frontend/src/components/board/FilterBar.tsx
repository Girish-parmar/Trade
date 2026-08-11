import type { Tag } from '@/types';
import { Input } from '@/components/common/Input';
import { TagBadge } from '@/components/common/TagBadge';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  tags: Tag[];
  activeTagIds: Set<string>;
  onToggleTag: (tagId: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  tags,
  activeTagIds,
  onToggleTag,
}: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              className={activeTagIds.has(tag.id) ? 'ring-2 ring-offset-1 ring-indigo-400 rounded-full' : 'opacity-50 hover:opacity-80'}
            >
              <TagBadge tag={tag} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

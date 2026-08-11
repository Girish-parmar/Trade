import { FormEvent, useState } from 'react';
import type { TemplateItemInput } from '@/api/templates';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useCreateTemplate } from '@/hooks/useTemplates';

interface DraftItem extends TemplateItemInput {
  key: string;
}

export function TemplateEditor({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [items, setItems] = useState<DraftItem[]>([
    { key: crypto.randomUUID(), title: '', priority: 'MEDIUM', dueOffsetDays: undefined },
  ]);
  const createTemplate = useCreateTemplate(projectId);

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), title: '', priority: 'MEDIUM', dueOffsetDays: undefined },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validItems = items
      .filter((item) => item.title.trim())
      .map(({ title, priority, dueOffsetDays }) => ({ title: title.trim(), priority, dueOffsetDays }));
    if (!name.trim() || validItems.length === 0) return;
    await createTemplate.mutateAsync({ name: name.trim(), items: validItems });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Template name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint Kickoff" />
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.key} className="flex items-center gap-2">
            <Input
              placeholder={`Task ${idx + 1} title`}
              value={item.title}
              onChange={(e) => updateItem(item.key, { title: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              placeholder="Due +days"
              className="w-28"
              value={item.dueOffsetDays ?? ''}
              onChange={(e) =>
                updateItem(item.key, {
                  dueOffsetDays: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={addItem}>
        + Add item
      </Button>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createTemplate.isPending}>
          Save template
        </Button>
      </div>
    </form>
  );
}

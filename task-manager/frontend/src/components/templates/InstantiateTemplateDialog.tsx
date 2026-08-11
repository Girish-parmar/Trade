import { useState } from 'react';
import type { TaskTemplate } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useInstantiateTemplate } from '@/hooks/useTemplates';

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function InstantiateTemplateDialog({
  projectId,
  template,
  onClose,
}: {
  projectId: string;
  template: TaskTemplate | null;
  onClose: () => void;
}) {
  const [baseDate, setBaseDate] = useState(toDateInputValue(new Date()));
  const instantiate = useInstantiateTemplate(projectId);

  if (!template) return null;

  const base = new Date(baseDate);
  const preview = template.items.map((item) => ({
    ...item,
    previewDate:
      item.dueOffsetDays != null
        ? new Date(base.getTime() + item.dueOffsetDays * 86_400_000)
        : null,
  }));

  const handleConfirm = async () => {
    await instantiate.mutateAsync({
      templateId: template.id,
      dueDateBase: new Date(baseDate).toISOString(),
    });
    onClose();
  };

  return (
    <Modal open={!!template} onClose={onClose} title={`Use "${template.name}"`}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Base date</label>
          <Input type="date" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} />
        </div>
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {preview.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{item.title}</span>
              <span className="text-xs text-slate-400">
                {item.previewDate ? item.previewDate.toLocaleDateString() : 'No due date'}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={instantiate.isPending}>
            Create {preview.length} task{preview.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import type { TaskTemplate } from '@/types';
import { Button } from '@/components/common/Button';
import { useDeleteTemplate } from '@/hooks/useTemplates';

export function TemplateList({
  projectId,
  templates,
  onUse,
}: {
  projectId: string;
  templates: TaskTemplate[];
  onUse: (template: TaskTemplate) => void;
}) {
  const deleteTemplate = useDeleteTemplate(projectId);

  if (templates.length === 0) {
    return <p className="text-sm text-slate-500">No templates yet. Create one to get started.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {templates.map((template) => (
        <li key={template.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">{template.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{template.items.length} task(s)</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => deleteTemplate.mutate(template.id)}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              Delete
            </button>
            <Button onClick={() => onUse(template)}>Use Template</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

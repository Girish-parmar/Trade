import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/common/Button';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { InstantiateTemplateDialog } from '@/components/templates/InstantiateTemplateDialog';
import { useTemplates } from '@/hooks/useTemplates';
import type { TaskTemplate } from '@/types';

export function TemplatesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: templates = [], isLoading } = useTemplates(projectId!);
  const [showEditor, setShowEditor] = useState(false);
  const [instantiating, setInstantiating] = useState<TaskTemplate | null>(null);

  if (!projectId) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link to={`/projects/${projectId}`} className="text-xs text-slate-400 hover:underline">
          ← Back to board
        </Link>
        <div className="mb-4 mt-1 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Task Templates</h1>
          <Button onClick={() => setShowEditor((s) => !s)}>+ New Template</Button>
        </div>

        {showEditor && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <TemplateEditor projectId={projectId} onDone={() => setShowEditor(false)} />
          </div>
        )}

        {isLoading ? (
          <p className="text-slate-500">Loading templates...</p>
        ) : (
          <TemplateList projectId={projectId} templates={templates} onUse={setInstantiating} />
        )}
      </div>

      <InstantiateTemplateDialog
        projectId={projectId}
        template={instantiating}
        onClose={() => setInstantiating(null)}
      />
    </AppShell>
  );
}

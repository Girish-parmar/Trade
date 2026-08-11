import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useCreateProject, useProjects } from '@/hooks/useProjects';

export function DashboardPage() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createProject.mutateAsync({ name });
    setName('');
    setShowForm(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
          <Button onClick={() => setShowForm((s) => !s)}>+ New Project</Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 flex gap-2 rounded-lg bg-white p-4 shadow-sm">
            <Input
              autoFocus
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" disabled={createProject.isPending}>
              Create
            </Button>
          </form>
        )}

        {isLoading && <p className="text-slate-500">Loading projects...</p>}

        {!isLoading && projects.length === 0 && (
          <p className="text-slate-500">No projects yet. Create your first one above.</p>
        )}

        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="font-semibold text-slate-900">{project.name}</h2>
                {project.description && (
                  <p className="mt-1 text-sm text-slate-500">{project.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

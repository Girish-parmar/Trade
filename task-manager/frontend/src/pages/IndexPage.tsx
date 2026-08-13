import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';

const FEATURES = [
  {
    title: 'Kanban board',
    body: 'Drag tasks between To Do, In Progress, and Done with instant, persisted ordering.',
  },
  {
    title: 'Quick-add with smart dates',
    body: 'Add a task and set its due date in one click with Today / Tomorrow / Next Week chips.',
  },
  {
    title: 'Reusable templates',
    body: 'Turn a recurring set of tasks into a template and instantiate the whole group in one click.',
  },
  {
    title: 'Collaboration',
    body: 'Assign tasks to teammates, comment, and get notified on assignments and due dates.',
  },
];

export function IndexPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold text-indigo-600">Task Manager</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Organize work that actually gets done
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Projects, a drag-and-drop board, quick-add with smart due dates, and reusable task
          templates — everything a small team needs, nothing it doesn't.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register">
            <Button className="px-5 py-2 text-base">Create a free account</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="px-5 py-2 text-base">
              Log in
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-6 text-left sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

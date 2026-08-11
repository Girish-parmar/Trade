import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAddBar } from './QuickAddBar';
import * as tasksApi from '@/api/tasks';

vi.mock('@/api/tasks', async () => {
  const actual = await vi.importActual<typeof tasksApi>('@/api/tasks');
  return { ...actual, createTask: vi.fn() };
});

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('QuickAddBar', () => {
  it('creates a task with the typed title on Enter', async () => {
    const mockCreate = vi.mocked(tasksApi.createTask).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderWithClient(<QuickAddBar projectId="project-1" />);

    const input = screen.getByPlaceholderText(/add a task/i);
    await user.type(input, 'Buy milk{enter}');

    expect(mockCreate).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({ title: 'Buy milk' }),
    );
  });

  it('sets a due date badge when a date chip is clicked', async () => {
    vi.mocked(tasksApi.createTask).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderWithClient(<QuickAddBar projectId="project-1" />);

    await user.click(screen.getByText('Today'));
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });
});

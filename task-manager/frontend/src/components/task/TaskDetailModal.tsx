import type { Task } from '@/types';
import { Modal } from '@/components/common/Modal';
import { TaskForm } from './TaskForm';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '@/hooks/useComments';

export function TaskDetailModal({
  projectId,
  task,
  onClose,
}: {
  projectId: string;
  task: Task | null;
  onClose: () => void;
}) {
  const { data: comments = [] } = useComments(task?.id ?? '');

  return (
    <Modal open={!!task} onClose={onClose} title="Task">
      {task && (
        <div className="space-y-5">
          <TaskForm projectId={projectId} task={task} onDeleted={onClose} />
          <div className="border-t border-slate-100 pt-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Comments</h3>
            <CommentList taskId={task.id} comments={comments} />
            <CommentForm taskId={task.id} />
          </div>
        </div>
      )}
    </Modal>
  );
}

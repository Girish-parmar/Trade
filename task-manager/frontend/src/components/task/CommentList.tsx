import type { Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/common/Avatar';
import { useDeleteComment } from '@/hooks/useComments';

export function CommentList({ taskId, comments }: { taskId: string; comments: Comment[] }) {
  const { user } = useAuth();
  const deleteComment = useDeleteComment(taskId);

  if (comments.length === 0) {
    return <p className="text-sm text-slate-400">No comments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-2">
          <Avatar user={comment.author} size={24} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{comment.author.name}</span>
              <span className="text-xs text-slate-400">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-700">{comment.body}</p>
          </div>
          {user?.id === comment.authorId && (
            <button
              onClick={() => deleteComment.mutate(comment.id)}
              className="text-xs text-slate-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

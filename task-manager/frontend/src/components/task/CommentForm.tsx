import { FormEvent, useState } from 'react';
import { useCreateComment } from '@/hooks/useComments';
import { Button } from '@/components/common/Button';

export function CommentForm({ taskId }: { taskId: string }) {
  const [body, setBody] = useState('');
  const createComment = useCreateComment(taskId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await createComment.mutateAsync(body.trim());
    setBody('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment..."
        rows={2}
        className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <Button type="submit" disabled={!body.trim() || createComment.isPending}>
        Post
      </Button>
    </form>
  );
}

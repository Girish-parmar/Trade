import type { Notification } from '@/types';
import { useMarkNotificationRead } from '@/hooks/useNotifications';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const markRead = useMarkNotificationRead();

  if (notifications.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No notifications yet.</p>;
  }

  return (
    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`cursor-pointer px-4 py-2 text-sm hover:bg-slate-50 ${
            n.readAt ? 'text-slate-500' : 'bg-indigo-50/50 font-medium text-slate-800'
          }`}
          onClick={() => !n.readAt && markRead.mutate(n.id)}
        >
          <p>{n.message}</p>
          <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}

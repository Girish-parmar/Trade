import type { User } from '@/types';

export function Avatar({ user, size = 24 }: { user: User; size?: number }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      title={user.name}
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-500 font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

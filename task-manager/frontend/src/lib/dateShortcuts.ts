function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeToday(now: Date = new Date()): string {
  return startOfDay(now).toISOString();
}

export function computeTomorrow(now: Date = new Date()): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export function computeNextWeek(now: Date = new Date()): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export interface DateShortcut {
  label: string;
  compute: (now?: Date) => string;
}

export const DATE_SHORTCUTS: DateShortcut[] = [
  { label: 'Today', compute: computeToday },
  { label: 'Tomorrow', compute: computeTomorrow },
  { label: 'Next Week', compute: computeNextWeek },
];

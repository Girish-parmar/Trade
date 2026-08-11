interface DateChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function DateChip({ label, active, onClick }: DateChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

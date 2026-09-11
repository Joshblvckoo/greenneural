export default function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      <span className="eco-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {label}
    </span>
  );
}

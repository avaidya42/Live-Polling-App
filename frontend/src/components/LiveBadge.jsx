export default function LiveBadge({ active = true, label = 'Live' }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-textMuted">
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-ink-amber animate-pulseDot" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            active ? 'bg-ink-amber' : 'bg-ink-textMuted'
          }`}
        />
      </span>
      {active ? label : 'Closed'}
    </div>
  )
}

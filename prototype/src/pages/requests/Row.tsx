
export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5">
      <dt className="text-meta text-ink-secondary">{k}</dt>
      <dd className="text-right text-body font-medium">{v}</dd>
    </div>
  )
}

/* ---------- Q02 Detail permintaan ---------- */

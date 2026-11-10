import { MagnifyingGlass, X } from '@phosphor-icons/react'

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <MagnifyingGlass size={22} aria-hidden="true" className="shrink-0 text-ink-secondary" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-3 text-body outline-none placeholder:text-ink-secondary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Hapus pencarian" onClick={() => onChange('')} className="tap -mr-2 flex h-12 w-12 items-center justify-center rounded-full text-ink-secondary hover:bg-page">
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/* ---------- D06 Cari pangan + D07 filter (penerima) ---------- */

/**
 * Tipe resep (R02–R06). Isi resep dimuat dari tabel `contents` (services/engagement.ts).
 * Inspirasi olahan, bukan penilaian keamanan pangan; `uses` dipakai untuk mencocokkan bahan.
 */

export interface RecipeStep {
  title: string
  minutes: number
  body: string
  tip?: string
}

export interface Recipe {
  id: string
  title: string
  summary: string
  category: string
  minutes: number
  portions: string
  level: 'Mudah' | 'Sedang'
  tool: string
  uses: string[]
  have: { name: string; amount: string }[]
  extra: string[]
  steps: RecipeStep[]
  safety: string
  status: 'Tersedia' | 'Ditinjau ulang'
  /** Sampul dari contents.photo_path; tanpa sampul tampil ikon. */
  photo?: string
}


/** Skor cocok sederhana: berapa banyak bahan resep yang dimiliki pengguna. */
export function matchRecipes(items: string[], tools: string[], list: Recipe[]) {
  const have = items.map((i) => i.toLowerCase())
  return list
    .filter((r) => r.status === 'Tersedia' && tools.includes(r.tool))
    .map((r) => {
      const hits = r.uses.filter((u) => have.some((h) => h.includes(u)))
      return { recipe: r, hits, score: Math.round((hits.length / r.uses.length) * 100) }
    })
    .filter((m) => m.hits.length > 0)
    .sort((a, b) => b.score - a.score)
}

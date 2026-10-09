const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Tanggal absolut gaya Indonesia, mis. "10 Okt 2026, 14.05 WIB". */
export function nowLabel(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}.${mm} WIB`
}

/** "2026-10-10" → "10 Okt 2026" */
export function isoToLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "16:00" → "16.00" */
export function timeLabel(t: string) {
  return t.replace(':', '.')
}

export function qty(n: number, unit: string) {
  return `${n.toLocaleString('id-ID')} ${unit}`
}

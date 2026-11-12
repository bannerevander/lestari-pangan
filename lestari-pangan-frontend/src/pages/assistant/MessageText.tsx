import type { ReactNode } from 'react'

/** Format ringan jawaban AI: paragraf, daftar "-" / bernomor, dan **tebal**. Tanpa HTML mentah. */
const bold = (line: string): ReactNode[] =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part))

export function MessageText({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    blocks.push(
      <Tag key={blocks.length} className={`flex flex-col gap-1 pl-5 ${list.ordered ? 'list-decimal' : 'list-disc'}`}>
        {list.items.map((it, i) => <li key={i}>{bold(it)}</li>)}
      </Tag>,
    )
    list = null
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const bullet = line.match(/^[-*]\s+(.*)/)
    const numbered = line.match(/^\d+[.)]\s+(.*)/)
    if (bullet || numbered) {
      const ordered = !!numbered
      if (list && list.ordered !== ordered) flush()
      list ??= { ordered, items: [] }
      list.items.push((bullet ?? numbered)![1])
      continue
    }
    flush()
    if (line) blocks.push(<p key={blocks.length}>{bold(line)}</p>)
  }
  flush()
  return <div className="flex flex-col gap-2 break-words">{blocks}</div>
}

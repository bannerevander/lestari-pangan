import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import { mediaUrl } from './promotions'
import type { Role, Tip } from '../data/types'
import type { Recipe } from '../data/recipes'
import { METRIC_UNIT, type Challenge, type ChallengeEntry, type ChallengeMetric, type RewardPack } from '../data/engagement'
import { dateLabel, idFromCode } from './mappers'

/** Modul engagement: konten, simpanan, challenge, reward, apresiasi (RPC engagement_*). */

interface ContentRow {
  slug: string
  kind: 'Tips' | 'Resep'
  title: string
  category: string
  summary: string
  body: unknown
  minutes: number | null
  photo_path: string | null
  reviewed_at: string | null
}

const toTip = (c: ContentRow): Tip => ({
  id: c.slug,
  title: c.title,
  summary: c.summary,
  category: c.category,
  minutes: c.minutes ?? 1,
  photo: c.photo_path ? mediaUrl(c.photo_path) : undefined,
  body: Array.isArray(c.body) ? (c.body as string[]) : [],
  reviewed: c.reviewed_at ? `Ditinjau tim konten, ${dateLabel(c.reviewed_at)}` : 'Ditinjau tim konten',
})

const toRecipe = (c: ContentRow): Recipe => ({
  portions: '',
  level: 'Mudah',
  tool: '',
  uses: [],
  have: [],
  extra: [],
  steps: [],
  safety: '',
  ...(c.body as Partial<Recipe>),
  id: c.slug,
  title: c.title,
  summary: c.summary,
  category: c.category,
  minutes: c.minutes ?? 1,
  status: 'Tersedia',
})

export interface EngagementData {
  tips: Tip[]
  recipes: Recipe[]
  savedTips: string[]
  savedRecipes: string[]
  challenges: Challenge[]
  challengeEntries: Record<string, ChallengeEntry>
  joinedChallenges: string[]
  rewardPacks: RewardPack[]
  /** Paket pada klaim aktif terakhir dan statusnya. */
  rewardClaim: string | null
  claimStatus: string | null
  /** Saldo poin: poin challenge yang lolos dikurangi klaim yang tidak ditolak (server memeriksa ulang saat klaim). */
  points: number
  /** 'Draf' juga bila belum ada materi (appreciationId null). */
  appreciation: 'Draf' | 'Disetujui' | 'Revisi diminta'
  appreciationId: number | null
  appreciationCaption: string | null
  appreciationImage: string | null
}

export async function loadEngagement(): Promise<EngagementData> {
  const [contents, saved, challenges, progress, packs, claims, material] = await Promise.all([
    supabase.from('contents').select('slug, kind, title, category, summary, body, minutes, photo_path, reviewed_at').eq('status', 'Terbit').order('id'),
    supabase.from('saved_contents').select('content:contents(slug, kind)'),
    supabase.from('challenges').select('id, code, title, description, period_start, period_end, roles, metric, target_count, points').eq('status', 'Aktif').order('id'),
    supabase.from('v_challenge_progress').select('participant_id, code, challenge_id, status, progress, period_start, points').order('participant_id'),
    supabase.from('reward_packs').select('code, title, detail, sponsor, cost').eq('active', true).order('id'),
    supabase.from('reward_claims').select('status, points, pack:reward_packs(code)').order('created_at', { ascending: false }),
    supabase.from('appreciation_materials').select('id, status, caption, image_path').order('version', { ascending: false }).limit(1),
  ])
  for (const r of [contents, saved, challenges, progress, packs, claims, material]) if (r.error) throw toAppError(r.error)

  const rows = (contents.data ?? []) as unknown as ContentRow[]
  const savedRows = (saved.data ?? []) as unknown as { content: { slug: string; kind: string } | null }[]
  const chRows = challenges.data ?? []
  const byId = new Map(chRows.map((c) => [c.id, c]))
  const entries: Record<string, ChallengeEntry> = {}
  let earned = 0
  for (const p of progress.data ?? []) {
    if (p.status === 'Lolos') earned += p.points ?? 0
    const c = byId.get(p.challenge_id as number)
    // Hanya keikutsertaan periode berjalan; periode lalu tetap dihitung poinnya.
    if (c && p.period_start === c.period_start) entries[c.code as string] = { participant: p.code as string, status: p.status as ChallengeEntry['status'], progress: p.progress ?? 0 }
  }
  const claimRows = (claims.data ?? []) as unknown as { status: string; points: number; pack: { code: string } | null }[]
  const live = claimRows.filter((c) => c.status !== 'Ditolak')
  const spent = live.reduce((s, c) => s + c.points, 0)
  const mat = material.data?.[0]

  return {
    tips: rows.filter((c) => c.kind === 'Tips').map(toTip),
    recipes: rows.filter((c) => c.kind === 'Resep').map(toRecipe),
    savedTips: savedRows.filter((s) => s.content?.kind === 'Tips').map((s) => s.content!.slug),
    savedRecipes: savedRows.filter((s) => s.content?.kind === 'Resep').map((s) => s.content!.slug),
    challenges: chRows.map((c) => ({
      id: c.code as string,
      roles: c.roles as Role[],
      title: c.title,
      desc: c.description,
      target: c.target_count,
      unit: METRIC_UNIT[c.metric as ChallengeMetric] ?? 'kegiatan',
      period: `${dateLabel(c.period_start)} – ${dateLabel(c.period_end)}`,
      metric: c.metric as ChallengeMetric,
      points: c.points,
    })),
    challengeEntries: entries,
    joinedChallenges: Object.keys(entries),
    rewardPacks: (packs.data ?? []).map((p) => ({ id: p.code as string, title: p.title, desc: p.detail, sponsor: p.sponsor, cost: p.cost })),
    rewardClaim: live[0]?.pack?.code ?? null,
    claimStatus: live[0]?.status ?? null,
    points: earned - spent,
    appreciation: (mat?.status as EngagementData['appreciation']) ?? 'Draf',
    appreciationId: mat?.id ?? null,
    appreciationCaption: mat?.caption ?? null,
    appreciationImage: mat?.image_path ? mediaUrl(mat.image_path) : null,
  }
}

/** Simpan/lepas tips atau resep berdasarkan slug-nya. */
export async function toggleSaved(slug: string): Promise<void> {
  const { data, error } = await supabase.from('contents').select('id').eq('slug', slug).single()
  if (error) throw toAppError(error)
  await rpc('engagement_toggle_saved', { p_content_id: data.id })
}

export const joinChallenge = (code: string) => rpc('engagement_join_challenge', { p_challenge_id: idFromCode(code) })
export const finishChallenge = (participant: string) => rpc('engagement_finish_challenge', { p_participant_id: idFromCode(participant) })
export const claimReward = (clientId: string, pack: string) =>
  rpc('engagement_claim_reward', { p_client_id: clientId, p_pack_id: idFromCode(pack) })
export const respondAppreciation = (id: number, decision: 'Disetujui' | 'Revisi diminta', note?: string) =>
  rpc('engagement_respond_appreciation', { p_material_id: id, p_decision: decision, p_note: note })

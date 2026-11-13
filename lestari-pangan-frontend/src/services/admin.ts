import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { METRIC_UNIT, type ChallengeMetric } from '../data/engagement'
import type { AdminData, Chain, Participant } from '../admin/data'
import { dateLabel, stampLabel, timeOf } from './mappers'
import { loadPromotions, mediaUrl } from './promotions'
import { TICKET_SELECT, toTicket } from './support'

/**
 * Konsol admin, mode live: membaca seluruh antrean dari Supabase dalam bentuk yang sama
 * yang dipakai halaman (tipe di admin/data.ts). RLS admin membuka baris lintas pengguna; kolom privat
 * profil tetap tertutup (docs/SECURITY.md). Aksi admin ada di services/adminActions.ts.
 */

const LIMIT = 200 // shortcut: tanpa paginasi; cukup untuk pilot satu wilayah.

const ROLE_LABEL: Record<string, 'Pemberi' | 'Penerima'> = { pemberi: 'Pemberi', penerima: 'Penerima' }
const FUND_LABEL: Record<string, string> = {
  operasional: 'Operasional',
  pengiriman: 'Subsidi ongkir',
  bantuan_langsung: 'Bantuan langsung',
  program: 'Program',
}

/** "3 jam" / "2 hari" sejak waktu tertentu. */
function age(ts: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000))
  if (m < 60) return `${m} mnt`
  if (m < 60 * 24) return `${Math.round(m / 60)} jam`
  return `${Math.round(m / 60 / 24)} hari`
}

const shortStamp = (ts: string) => `${dateLabel(ts).split(' ').slice(0, 2).join(' ')}, ${timeOf(ts)} WIB`

async function q<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await p
  if (error) throw toAppError(error as { message?: string })
  return (data ?? []) as T[]
}

type Name = { org_name: string } | null

export async function loadAdminData(): Promise<AdminData> {
  const db = supabase
  const [profiles, verifications, issues, transfers, contents, challenges, progress, packs, claims, ledger, supports, inKind, programs, audit, offers, requests, materials] =
    await Promise.all([
      q<{ id: number; code: string; role: string; org_name: string; org_type: string; area: string; verification_status: string; created_at: string; contact: { pic: string; phone: string } | null }>(
        db.from('profiles').select('id, code, role, org_name, org_type, area, verification_status, created_at, contact:profile_contacts(pic, phone)').order('created_at', { ascending: false }).limit(LIMIT),
      ),
      q<{ id: number; profile_id: number; doc_path: string; status: string; created_at: string }>(
        db.from('verifications').select('id, profile_id, doc_path, status, created_at').order('created_at', { ascending: false }).limit(LIMIT),
      ),
      q<{ code: string; category: string; description: string; priority: string; status: string; resolution: string | null; photo_path: string | null; created_at: string; reporter: { org_name: string; role: string } | null; transfer: { code: string; offer: { name: string } | null; donor: Name; recipient: Name } | null; events: { label: string; at: string; note: string | null }[] }>(
        db
          .from('issues')
          .select('code, category, description, priority, status, resolution, photo_path, created_at, reporter:profiles!issues_reporter_id_fkey(org_name, role), transfer:transfers!issues_transfer_id_fkey(code, offer:offers!transfers_offer_id_fkey(name), donor:profiles!transfers_donor_id_fkey(org_name), recipient:profiles!transfers_recipient_id_fkey(org_name)), events:issue_events(label, at, note)')
          .order('created_at', { ascending: false })
          .limit(LIMIT),
      ),
      q<{ id: number; code: string; agreed: number; handed_over: number | null; received: number | null; rejected: number | null; distributed: number | null; used: number | null; wasted: number | null; unit: string; method: string; status: string; window_start: string; pending_receipt: { received: number; reason: string } | null; request: { code: string } | null; offer: { code: string; name: string; initial: number } | null; donor: Name; recipient: Name }>(
        db
          .from('transfers')
          .select('id, code, agreed, handed_over, received, rejected, distributed, used, wasted, unit, method, status, window_start, pending_receipt, request:requests!transfers_request_id_fkey(code), offer:offers!transfers_offer_id_fkey(code, name, initial), donor:profiles!transfers_donor_id_fkey(org_name), recipient:profiles!transfers_recipient_id_fkey(org_name)')
          .order('created_at', { ascending: false })
          .limit(LIMIT),
      ),
      q<{ id: number; slug: string; kind: 'Tips' | 'Resep'; title: string; category: string; summary: string; body: unknown; photo_path: string | null; version: number; status: string; author: string; updated_at: string }>(
        db.from('contents').select('id, slug, kind, title, category, summary, body, photo_path, version, status, author, updated_at').order('updated_at', { ascending: false }),
      ),
      q<{ id: number; code: string; title: string; description: string; period_start: string; period_end: string; roles: string[]; metric: string; target_count: number; points: number; status: string }>(
        db.from('challenges').select('id, code, title, description, period_start, period_end, roles, metric, target_count, points, status').order('id', { ascending: false }),
      ),
      q<{ participant_id: number; code: string; challenge_id: number; profile_id: number; status: string; title: string; metric: string; target_count: number; progress: number }>(
        db.from('v_challenge_progress').select('participant_id, code, challenge_id, profile_id, status, title, metric, target_count, progress'),
      ),
      q<{ id: number; code: string; title: string; detail: string; sponsor: string; quota: number; claimed: number; cost: number; active: boolean }>(
        db.from('reward_packs').select('id, code, title, detail, sponsor, quota, claimed, cost, active').order('id'),
      ),
      q<{ code: string; status: string; points: number; created_at: string; pack: { code: string } | null; profile: Name }>(
        db.from('reward_claims').select('code, status, points, created_at, pack:reward_packs(code), profile:profiles!reward_claims_profile_id_fkey(org_name)').order('created_at', { ascending: false }),
      ),
      q<{ id: number; code: string; at: string; kind: 'Masuk' | 'Keluar'; fund: string; program_id: number | null; amount: number; source: string; note: string | null; transfer: { code: string } | null; reverses_id: number | null }>(
        db.from('ledger_entries').select('id, code, at, kind, fund, program_id, amount, source, note, reverses_id, transfer:transfers(code)').order('at', { ascending: false }).limit(LIMIT),
      ),
      q<{ code: string; amount: number; fund: string; allocation: string; status: string; created_at: string; profile: Name }>(
        db.from('supports').select('code, amount, fund, allocation, status, created_at, profile:profiles!supports_profile_id_fkey(org_name)').order('created_at', { ascending: false }).limit(LIMIT),
      ),
      q<{ code: string; kind: string; amount_text: string; status: string; created_at: string; profile: Name }>(
        db.from('in_kind_supports').select('code, kind, amount_text, status, created_at, profile:profiles!in_kind_supports_profile_id_fkey(org_name)').order('created_at', { ascending: false }).limit(LIMIT),
      ),
      q<{ id: number; code: string; title: string; sponsor: string; period_start: string; period_end: string; budget: number; status: string }>(
        db.from('programs').select('id, code, title, sponsor, period_start, period_end, budget, status').order('id', { ascending: false }),
      ),
      q<{ code: string; at: string; target: string; before: string | null; after: string | null; reason: string; actor: Name }>(
        db.from('audit_log').select('code, at, target, before, after, reason, actor:profiles(org_name)').order('at', { ascending: false }).limit(LIMIT),
      ),
      q<{ code: string; name: string; area: string; initial: number; reserved: number; available: number; unit: string; status: string; created_at: string; pickup_end: string; donor: Name }>(
        db.from('offers').select('code, name, area, initial, reserved, available, unit, status, created_at, pickup_end, donor:profiles!offers_donor_id_fkey(org_name)').order('created_at', { ascending: false }).limit(LIMIT),
      ),
      q<{ id: number; code: string; quantity: number; proposal_quantity: number | null; pickup_at: string; method: string; status: string; offer: { code: string } | null; recipient: Name }>(
        db.from('requests').select('id, code, quantity, proposal_quantity, pickup_at, method, status, offer:offers!requests_offer_id_fkey(code), recipient:profiles!requests_recipient_id_fkey(org_name)').order('created_at').limit(LIMIT),
      ),
      q<{ id: number; profile_id: number; version: number; caption: string; status: string; note: string | null; created_at: string }>(
        db.from('appreciation_materials').select('id, profile_id, version, caption, status, note, created_at').order('version', { ascending: false }),
      ),
    ])

  const [promotions, tickets] = await Promise.all([
    loadPromotions(),
    // shortcut: tabel baru belum ada di database.types.ts; perbarui tipe hasil generate lalu hapus cast.
    q<Parameters<typeof toTicket>[0] & { id: number; profile: Name }>(
      db.from('support_tickets' as never).select(`id, ${TICKET_SELECT}, profile:profiles(org_name)`).order('created_at', { ascending: false }).limit(LIMIT),
    ),
  ])
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const transferByRequest = new Map(transfers.filter((t) => t.request).map((t) => [t.request!.code, t.code]))

  const latestVerification = new Map<number, (typeof verifications)[number]>()
  for (const v of verifications) if (!latestVerification.has(v.profile_id)) latestVerification.set(v.profile_id, v)

  const participants: Participant[] = progress.map((p) => ({
    id: p.code,
    dbId: p.participant_id,
    challenge: challenges.find((c) => c.id === p.challenge_id)?.code ?? '',
    title: p.title,
    org: profileById.get(p.profile_id)?.org_name ?? '—',
    profileId: p.profile_id,
    target: p.target_count,
    progress: p.progress ?? 0,
    unit: METRIC_UNIT[p.metric as ChallengeMetric] ?? 'kegiatan',
    status: p.status,
  }))

  const chains: Record<string, Chain> = {}
  for (const t of transfers) {
    const unit = t.unit
    chains[t.code] = {
      id: t.code,
      dbId: t.id,
      offerId: t.offer?.code ?? '',
      status: t.status,
      pendingReceipt: t.pending_receipt
        ? { received: Number(t.pending_receipt.received), reason: t.pending_receipt.reason, base: Number(t.handed_over ?? t.agreed), unit }
        : undefined,
      steps: [
        { title: 'Penawaran awal', value: `${t.offer?.initial ?? '—'} ${unit}`, who: `${t.donor?.org_name ?? 'Pemberi'} (${t.offer?.code ?? ''})`, tone: 'done' },
        { title: 'Permintaan disetujui', value: `${t.agreed} ${unit}`, who: t.recipient?.org_name ?? 'Penerima', tone: 'done' },
        { title: 'Penyerahan fisik', value: t.handed_over === null ? 'Belum' : `${t.handed_over} ${unit}`, who: t.method, tone: t.handed_over === null ? 'wait' : 'done' },
        {
          title: 'Penerimaan aktual',
          value: t.received === null ? 'Belum' : `${t.received} diterima / ${t.rejected ?? 0} tidak`,
          who: 'Konfirmasi penerima',
          tone: t.received === null ? 'wait' : (t.rejected ?? 0) > 0 ? 'warn' : 'done',
        },
        {
          title: 'Pemanfaatan',
          value: t.distributed === null ? 'Belum dilaporkan' : `${t.distributed} dibagikan / ${t.used ?? 0} dipakai`,
          who: t.distributed === null ? 'Menunggu laporan penerima' : `${t.wasted ?? 0} terbuang`,
          tone: t.distributed === null ? 'wait' : 'done',
        },
      ],
      ledger: [
        ['Penawaran awal', `${t.offer?.initial ?? '—'} ${unit}`, `Input ${t.donor?.org_name ?? 'pemberi'} saat menerbitkan penawaran`],
        ['Kesepakatan alokasi', `${t.agreed} ${unit}`, `Disetujui untuk ${t.recipient?.org_name ?? 'penerima'}`],
        ['Diserahkan', t.handed_over === null ? '—' : `${t.handed_over} ${unit}`, 'Catatan penyerahan'],
        ['Diterima layak', t.received === null ? '—' : `${t.received} ${unit}`, 'Konfirmasi penerimaan'],
        ['Tidak diterima', t.rejected === null ? '—' : `${t.rejected} ${unit}`, 'Selisih saat serah terima'],
        ['Dibagikan ke warga', t.distributed === null ? '—' : `${t.distributed} ${unit}`, 'Laporan distribusi penerima'],
        ['Dipakai di posko', t.used === null ? '—' : `${t.used} ${unit}`, 'Laporan distribusi penerima'],
        ['Terbuang', t.wasted === null ? '—' : `${t.wasted} ${unit}`, 'Laporan distribusi penerima'],
      ],
    }
  }

  const programSpend = new Map<number, { masuk: number; keluar: number }>()
  for (const l of ledger) {
    if (l.program_id === null) continue
    const s = programSpend.get(l.program_id) ?? { masuk: 0, keluar: 0 }
    if (l.kind === 'Masuk') s.masuk += l.amount
    else s.keluar += l.amount
    programSpend.set(l.program_id, s)
  }
  const programTitle = new Map(programs.map((p) => [p.id, p.code]))

  return {
    orgs: profiles
      .filter((p) => p.role === 'pemberi' || p.role === 'penerima')
      .map((p) => {
        const v = latestVerification.get(p.id)
        return {
          id: p.code,
          name: p.org_name,
          email: '',
          role: ROLE_LABEL[p.role],
          type: p.org_type,
          area: p.area,
          pic: p.contact?.pic ?? '—',
          phone: p.contact?.phone ?? '—',
          doc: v ? v.doc_path.split('/').pop()! : 'Belum ada berkas',
          docMeta: v ? `${v.status} · diajukan ${dateLabel(v.created_at)}` : 'Belum diajukan',
          docPath: v?.doc_path,
          verificationId: v?.id,
          status: p.verification_status,
          submitted: v ? stampLabel(v.created_at) : stampLabel(p.created_at),
        }
      }),
    issues: issues.map((i) => {
      const reporterIsDonor = i.reporter?.role === 'pemberi'
      return {
        id: i.code,
        transferId: i.transfer?.code ?? '',
        food: i.transfer?.offer?.name ?? '—',
        reporter: i.reporter?.org_name ?? '—',
        reporterRole: i.reporter?.role === 'kurir' ? 'Kurir' : reporterIsDonor ? 'Pemberi' : 'Penerima',
        reported: (reporterIsDonor ? i.transfer?.recipient?.org_name : i.transfer?.donor?.org_name) ?? '—',
        reportedRole: reporterIsDonor ? 'Penerima' : 'Pemberi',
        category: i.category as never,
        summary: i.description,
        age: age(i.created_at),
        priority: i.priority as 'Tinggi' | 'Sedang' | 'Rendah',
        status: i.status === 'Dikirim' ? 'Menunggu peninjauan' : i.status,
        resolution: i.resolution ?? undefined,
        photoPath: i.photo_path ?? undefined,
        timeline: [...i.events].sort((a, b) => a.at.localeCompare(b.at)).map((e) => ({ title: `${timeOf(e.at)} · ${e.label}`, detail: e.note ?? '' })),
      }
    }),
    contents: contents.map((c) => ({
      id: c.slug,
      dbId: c.id,
      kind: c.kind,
      title: c.title,
      category: c.category,
      summary: c.summary,
      body: c.body,
      photo: c.photo_path ? mediaUrl(c.photo_path) : undefined,
      version: `v${c.version}`,
      updated: dateLabel(c.updated_at),
      author: c.author,
      status: c.status,
      points: Array.isArray(c.body) ? (c.body as string[]) : ((c.body as { steps?: { body: string }[] })?.steps ?? []).map((s) => s.body),
    })),
    challenges: challenges.map((c) => ({
      id: c.code,
      dbId: c.id,
      title: c.title,
      description: c.description,
      period: `${dateLabel(c.period_start)} – ${dateLabel(c.period_end)}`,
      periodStart: c.period_start,
      periodEnd: c.period_end,
      roles: c.roles.length === 2 ? 'Pemberi dan penerima' : ROLE_LABEL[c.roles[0]],
      metric: c.metric as ChallengeMetric,
      targetCount: c.target_count,
      points: c.points,
      target: `${c.target_count} ${METRIC_UNIT[c.metric as ChallengeMetric] ?? 'kegiatan'}`,
      participants: progress.filter((p) => p.challenge_id === c.id).length,
      status: c.status as 'Aktif' | 'Draf' | 'Arsip',
    })),
    participants,
    rewardPacks: packs.map((p) => ({ id: p.code, dbId: p.id, title: p.title, detail: p.detail, sponsor: p.sponsor, quota: p.quota, claimed: p.claimed, cost: p.cost })),
    claims: claims.map((c) => ({
      id: c.code,
      org: c.profile?.org_name ?? '—',
      challenge: `${c.points} poin`,
      pack: c.pack?.code ?? '',
      at: stampLabel(c.created_at),
      status: c.status,
    })),
    txns: [
      ...ledger.map((l) => ({
        id: l.code,
        dbId: l.id,
        date: stampLabel(l.at),
        kind: l.kind,
        purpose: l.note ?? (l.program_id ? programTitle.get(l.program_id) ?? FUND_LABEL[l.fund] : FUND_LABEL[l.fund]),
        source: l.source,
        amount: l.amount,
        linked: l.transfer?.code,
        status: l.reverses_id ? 'Pembalik' : 'Tervalidasi',
      })),
      ...supports
        .filter((s) => s.status !== 'Tervalidasi') // yang tervalidasi sudah muncul sebagai entri ledger
        .map((s) => ({ id: s.code, date: stampLabel(s.created_at), kind: 'Masuk' as const, purpose: s.allocation, source: s.profile?.org_name ?? '—', amount: s.amount, status: s.status })),
      ...inKind.map((k) => ({ id: k.code, date: stampLabel(k.created_at), kind: 'Barang' as const, purpose: k.kind, source: k.profile?.org_name ?? '—', amount: 0, goods: k.amount_text, status: k.status })),
    ],
    programs: programs.map((p) => {
      const s = programSpend.get(p.id) ?? { masuk: 0, keluar: 0 }
      return {
        id: p.code,
        dbId: p.id,
        title: p.title,
        sponsor: p.sponsor,
        period: `${dateLabel(p.period_start)} – ${dateLabel(p.period_end)}`,
        budget: p.budget || s.masuk,
        used: s.keluar,
        portions: 0,
        transfers: ledger.filter((l) => l.program_id === p.id && l.transfer).length,
        status: p.status,
      }
    }),
    audit: audit.map((a) => ({ id: a.code, at: stampLabel(a.at), actor: a.actor?.org_name ?? 'Sistem', target: a.target, before: a.before ?? '—', after: a.after ?? '—', reason: a.reason })),
    opOffers: offers.map((o) => ({
      id: o.code,
      name: o.name,
      donor: o.donor?.org_name ?? '—',
      area: o.area,
      published: stampLabel(o.created_at),
      deadline: shortStamp(o.pickup_end),
      initial: o.initial,
      reserved: o.reserved,
      available: o.available,
      unit: o.unit,
      status: o.status === 'Tersedia' ? 'Aktif' : 'Selesai',
      requests: requests
        .filter((r) => r.offer?.code === o.code)
        .map((r) => ({
          id: r.code,
          org: r.recipient?.org_name ?? '—',
          asked: r.quantity,
          proposed: r.proposal_quantity ?? undefined,
          time: shortStamp(r.pickup_at),
          method: r.method,
          status: r.status,
          transferId: transferByRequest.get(r.code),
        })),
    })),
    chains,
    partners: profiles.filter((p) => p.role === 'pemberi' || p.role === 'penerima').map((p) => ({ id: p.id, name: p.org_name, area: p.area })),
    impact: (() => {
      const out: AdminData['impact'] = {}
      const row = (u: string) => (out[u] ??= { offered: 0, received: 0, rejected: 0, distributed: 0 })
      for (const o of offers) row(o.unit).offered += Number(o.initial)
      for (const t of transfers) {
        const r = row(t.unit)
        r.received += Number(t.received ?? 0)
        r.rejected += Number(t.rejected ?? 0)
        r.distributed += Number(t.distributed ?? 0)
      }
      return out
    })(),
    promotions,
    tickets: tickets.map((t) => ({ ...toTicket(t), dbId: t.id, org: t.profile?.org_name ?? '—' })),
    materials: materials.map((m) => ({ id: m.id, profileId: m.profile_id, org: profileById.get(m.profile_id)?.org_name ?? '—', version: m.version, caption: m.caption, status: m.status, note: m.note ?? undefined })),
  }
}

/** Tautan sementara (5 menit) untuk foto kondisi pada laporan kendala (bucket privat issue-photos). */
export async function issuePhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('issue-photos').createSignedUrl(path, 300)
  if (error) throw toAppError(error)
  return data.signedUrl
}

/** Tautan sementara (5 menit) untuk membuka berkas verifikasi privat. */
export async function verificationDocUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 300)
  if (error) throw toAppError(error)
  return data.signedUrl
}

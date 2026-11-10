import { rpc } from '../lib/supabase/rpc'
import { AppError } from '../lib/supabase/errors'
import type { AdminData } from '../admin/data'
import { idFromCode } from './mappers'

/**
 * Aksi konsol admin (RPC admin_*). Setiap RPC menulis audit_log di server dengan nilai
 * sebelum, sesudah, dan alasan; front end tidak menulis audit sendiri.
 * Hak per lingkup (ops / keuangan / konten) ditegakkan server: akun di luar lingkup ditolak.
 */

/** Keputusan dari DecisionPanel: entitas ditentukan dari awalan kodenya. */
export async function decide(data: AdminData, target: string, after: string, reason: string): Promise<void> {
  const prefix = target.slice(0, target.indexOf('-'))
  switch (prefix) {
    case 'USR': {
      const org = data.orgs.find((o) => o.id === target)
      if (!org?.verificationId) throw new AppError('STATUS_TIDAK_SESUAI', 'Organisasi ini belum mengunggah berkas verifikasi.')
      // "Perlu perbaikan" = ditolak dengan alasan; pengguna mengunggah ulang dari aplikasi.
      await rpc('admin_decide_verification', { p_id: org.verificationId, p_decision: after === 'Terverifikasi' ? 'Terverifikasi' : 'Ditolak', p_reason: after === 'Perlu perbaikan' ? `Perlu perbaikan: ${reason}` : reason })
      return
    }
    case 'ISS':
      await rpc('admin_update_issue', {
        p_id: idFromCode(target),
        p_status: after === 'Sedang ditinjau' ? 'Sedang ditinjau' : 'Selesai',
        p_resolution: after === 'Ditolak' ? `Laporan tidak didukung data serah terima: ${reason}` : reason,
      })
      return
    case 'CHK': {
      const p = data.participants.find((x) => x.id === target)
      await rpc('admin_decide_participant', { p_id: p?.dbId ?? idFromCode(target), p_decision: after === 'Valid' ? 'Lolos' : 'Tidak lolos', p_reason: reason })
      return
    }
    case 'CLM':
      await rpc('admin_update_claim', { p_id: idFromCode(target), p_status: after, p_reason: reason })
      return
    case 'DKG':
      await rpc('admin_decide_support', { p_id: idFromCode(target), p_decision: after, p_reason: reason })
      return
    case 'INK':
      await rpc('admin_decide_in_kind', { p_id: idFromCode(target), p_status: after, p_reason: reason })
      return
    case 'TRX': {
      const t = data.txns.find((x) => x.id === target)
      await rpc('admin_reverse_ledger', { p_id: t?.dbId, p_reason: reason })
      return
    }
    default:
      throw new AppError('DATA_TIDAK_VALID', `Keputusan untuk ${target} belum didukung.`)
  }
}

/** Pembayar ongkir diambil server dari kesepakatan penyaluran (penerima/pemberi); Rp0 = relawan. */
export const assignCourier = (transferDbId: number, courierId: number, cost: number) =>
  rpc('admin_assign_courier', { p_transfer_id: transferDbId, p_courier_id: courierId, p_cost: cost })

export const verifyReceipt = (transferDbId: number, approve: boolean, note: string) =>
  rpc('admin_verify_receipt', { p_id: transferDbId, p_approve: approve, p_note: note })

/** p_id null = konten baru. submit = ajukan ke antrean review. */
export const saveContent = (dbId: number | null, fields: Record<string, unknown>, submit: boolean) =>
  rpc<{ id: number }>('admin_save_content', { p_id: dbId, p_fields: fields, p_submit: submit })

export const publishContent = (dbId: number) => rpc('admin_publish_content', { p_id: dbId })

export const saveChallenge = (dbId: number | null, fields: Record<string, unknown>) => rpc('admin_save_challenge', { p_id: dbId, p_fields: fields })

export const saveRewardPack = (dbId: number | null, fields: Record<string, unknown>) => rpc('admin_save_reward_pack', { p_id: dbId, p_fields: fields })

export const proposeAppreciation = (profileId: number, caption: string, imagePath?: string) =>
  rpc('admin_propose_appreciation', { p_profile_id: profileId, p_caption: caption, p_image_path: imagePath })

export const recordLedger = (i: { kind: 'Masuk' | 'Keluar'; fund: string; amount: number; source: string; note: string; programId?: number }) =>
  rpc('admin_record_ledger', { p_kind: i.kind, p_fund: i.fund, p_amount: i.amount, p_source: i.source, p_note: i.note, p_program_id: i.programId })

export const saveProgram = (dbId: number | null, fields: Record<string, unknown>) => rpc('admin_save_program', { p_id: dbId, p_fields: fields })

export const replyTicket = (dbId: number, status: 'Ditangani' | 'Selesai', reply: string) => rpc('admin_reply_ticket', { p_id: dbId, p_status: status, p_reply: reply })

/** p_id null = promosi baru. Kolom: title, placement, image_path, link, area, starts_on, ends_on, active, sort. */
export const savePromotion = (dbId: number | null, fields: Record<string, unknown>) => rpc('admin_save_promotion', { p_id: dbId, p_fields: fields })

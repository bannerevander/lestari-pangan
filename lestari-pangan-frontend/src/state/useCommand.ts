import { useCallback } from 'react'
import { useApp, type OfferChanges } from './AppState'
import { useLiveData } from './LiveData'
import { AppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import { fromLabels as at } from '../services/mappers'
import * as donation from '../services/donation'
import * as fulfillment from '../services/fulfillment'
import * as inventory from '../services/inventory'
import * as issues from '../services/issues'
import * as notify from '../services/notify'
import * as engagement from '../services/engagement'
import * as funding from '../services/funding'
import type { Transfer } from '../data/types'

/** Perintah yang dikirim ke server (RPC). ID = kode tampil (mis. "PGR-17"). */
export type Command =
  | { type: 'closeOffer'; id: string }
  | { type: 'updateOffer'; id: string; changes: OfferChanges; reason?: string }
  | { type: 'decideRequest'; id: string; decision: 'approve' | 'reject'; reason?: string }
  | { type: 'cancelRequest'; id: string; reason: string }
  | { type: 'proposeAdjustment'; id: string; quantity: number; reason: string }
  | { type: 'respondAdjustment'; id: string; accept: boolean }
  | { type: 'handover'; id: string; quantity: number; note?: string }
  | { type: 'receive'; id: string; received: number; reason?: string; note?: string }
  | { type: 'reportDistribution'; id: string; distributed: number; used: number; wasted: number }
  | { type: 'respondSchedule'; id: string; accept: boolean }
  | { type: 'setMethod'; id: string; method: Transfer['method'] }
  | { type: 'setPrep'; id: string; checks: string[] }
  | { type: 'taskPickup'; id: string; quantity: number }
  | { type: 'taskDeliver'; id: string; quantity: number }
  | { type: 'taskFail'; id: string; reason: string }
  | { type: 'addRecord'; record: { name: string; category: string; quantity: number; unit: string; storage: string; estimate: boolean }; clientId?: string }
  | { type: 'moveRecord'; id: string; kind: 'Digunakan' | 'Didistribusikan' | 'Terbuang'; quantity: number; note?: string; clientId?: string }
  | { type: 'correctRecord'; id: string; quantity: number; reason: string; clientId?: string }
  | { type: 'reportIssue'; transferId: string; category: string; description: string; clientId?: string }
  | { type: 'objectIssue'; id: string; note: string }
  | { type: 'readNotification'; id: string }
  | { type: 'readAllNotifications' }
  | { type: 'toggleTip'; id: string }
  | { type: 'toggleRecipe'; id: string }
  | { type: 'joinChallenge'; id: string }
  | { type: 'finishChallenge'; id: string }
  | { type: 'claimReward'; id: string; participant?: string }
  | { type: 'setAppreciation'; value: 'Disetujui' | 'Revisi diminta'; note?: string; materialId?: number | null }
  | { type: 'addSupport'; amount: number; allocation: string; fund?: 'operasional' | 'pengiriman'; clientId?: string }
  | { type: 'setRecurring'; value: { amount: number; day: number } | null }
  | { type: 'addInKind'; kind: string; amount: string; clientId?: string }
  | { type: 'setPref'; key: string; value: boolean }

async function toServer(a: Command): Promise<void> {
  switch (a.type) {
    case 'closeOffer':
      await donation.closeOffer(a.id)
      return
    case 'updateOffer':
      await donation.updateOffer(a.id, {
        pickupStart: at(a.changes.pickupDate, a.changes.pickupStart),
        pickupEnd: at(a.changes.pickupDate, a.changes.pickupEnd),
        available: a.changes.available,
        storage: a.changes.storage,
        description: a.changes.description,
        reason: a.reason,
      })
      return
    case 'decideRequest':
      await donation.decideRequest(a.id, a.decision, a.reason)
      return
    case 'cancelRequest':
      await donation.cancelRequest(a.id, a.reason)
      return
    case 'proposeAdjustment':
      await donation.proposeAdjustment(a.id, a.quantity, a.reason)
      return
    case 'respondAdjustment':
      await donation.respondAdjustment(a.id, a.accept)
      return
    case 'handover':
      await fulfillment.handover(a.id, a.quantity, a.note)
      return
    case 'receive':
      await fulfillment.receive(a.id, a.received, a.reason, a.note)
      return
    case 'reportDistribution':
      await fulfillment.reportDistribution(a.id, a.distributed, a.used, a.wasted)
      return
    case 'respondSchedule':
      await fulfillment.respondSchedule(a.id, a.accept)
      return
    case 'setMethod':
      await fulfillment.setMethod(a.id, a.method)
      return
    case 'setPrep':
      await fulfillment.setPrep(a.id, a.checks)
      return
    case 'taskPickup':
      await fulfillment.taskPickup(a.id, a.quantity)
      return
    case 'taskDeliver':
      await fulfillment.taskDeliver(a.id, a.quantity)
      return
    case 'taskFail':
      await fulfillment.taskFail(a.id, a.reason)
      return
    case 'addRecord':
      await inventory.addRecord(a.clientId ?? crypto.randomUUID(), a.record)
      return
    case 'moveRecord':
      await inventory.moveRecord(a.clientId ?? crypto.randomUUID(), a.id, a.kind, a.quantity, a.note)
      return
    case 'correctRecord':
      await inventory.correctRecord(a.clientId ?? crypto.randomUUID(), a.id, a.quantity, a.reason)
      return
    case 'reportIssue':
      await issues.reportIssue(a.clientId ?? crypto.randomUUID(), a.transferId, a.category, a.description)
      return
    case 'objectIssue':
      await issues.objectIssue(a.id, a.note)
      return
    case 'readNotification':
      await notify.markRead(a.id)
      return
    case 'readAllNotifications':
      await notify.markRead()
      return
    case 'toggleTip':
    case 'toggleRecipe':
      await engagement.toggleSaved(a.id)
      return
    case 'joinChallenge':
      await engagement.joinChallenge(a.id)
      return
    case 'finishChallenge':
      await engagement.finishChallenge(a.id)
      return
    case 'claimReward':
      if (!a.participant) throw new AppError('STATUS_TIDAK_SESUAI', 'Belum ada challenge terverifikasi untuk diklaim.')
      await engagement.claimReward(a.participant, a.id)
      return
    case 'setAppreciation':
      if (!a.materialId) throw new AppError('STATUS_TIDAK_SESUAI', 'Belum ada materi apresiasi dari tim program.')
      await engagement.respondAppreciation(a.materialId, a.value === 'Disetujui' ? 'Disetujui' : 'Revisi diminta', a.note)
      return
    case 'addSupport':
      await funding.addSupport(a.clientId ?? crypto.randomUUID(), a.amount, a.fund ?? 'operasional', a.allocation)
      return
    case 'setRecurring':
      await funding.setRecurring(a.value)
      return
    case 'addInKind':
      await funding.addInKind(a.clientId ?? crypto.randomUUID(), a.kind, a.amount)
      return
    case 'setPref':
      await rpc('identity_set_pref', { p_key: a.key, p_value: a.value })
      return
  }
}

/**
 * Jalankan perintah: RPC lalu muat ulang data. Melempar AppError bila server menolak;
 * layar menampilkan messageOf(err).
 */
export function useCommand() {
  const { dispatch } = useApp()
  const { refresh } = useLiveData()
  return useCallback(
    async (c: Command) => {
      await toServer(c)
      // Preferensi cukup diperbarui lokal; perintah lain memuat ulang data akun.
      if (c.type === 'setPref') dispatch(c)
      else await refresh()
    },
    [dispatch, refresh],
  )
}

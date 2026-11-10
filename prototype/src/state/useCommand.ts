import { useCallback } from 'react'
import { useApp, type Action } from './AppState'
import { useLiveData } from './LiveData'
import { isLive } from '../lib/supabase/client'
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

/** Aksi yang di mode live dijalankan sebagai RPC. Aksi lain tetap lokal (fitur belum tersambung). */
async function toServer(a: Action): Promise<boolean> {
  switch (a.type) {
    case 'closeOffer':
      await donation.closeOffer(a.id)
      return true
    case 'updateOffer':
      await donation.updateOffer(a.id, {
        pickupStart: at(a.changes.pickupDate, a.changes.pickupStart),
        pickupEnd: at(a.changes.pickupDate, a.changes.pickupEnd),
        available: a.changes.available,
        storage: a.changes.storage,
        description: a.changes.description,
        reason: a.reason,
      })
      return true
    case 'decideRequest':
      await donation.decideRequest(a.id, a.decision, a.reason)
      return true
    case 'cancelRequest':
      await donation.cancelRequest(a.id, a.reason)
      return true
    case 'proposeAdjustment':
      await donation.proposeAdjustment(a.id, a.quantity, a.reason)
      return true
    case 'respondAdjustment':
      await donation.respondAdjustment(a.id, a.accept)
      return true
    case 'handover':
      await fulfillment.handover(a.id, a.quantity, a.note)
      return true
    case 'receive':
      await fulfillment.receive(a.id, a.received, a.reason, a.note)
      return true
    case 'reportDistribution':
      await fulfillment.reportDistribution(a.id, a.distributed, a.used, a.wasted)
      return true
    case 'respondSchedule':
      await fulfillment.respondSchedule(a.id, a.accept)
      return true
    case 'setMethod':
      await fulfillment.setMethod(a.id, a.method)
      return true
    case 'setPrep':
      await fulfillment.setPrep(a.id, a.checks)
      return true
    case 'taskPickup':
      await fulfillment.taskPickup(a.id, a.quantity)
      return true
    case 'taskDeliver':
      await fulfillment.taskDeliver(a.id, a.quantity)
      return true
    case 'taskFail':
      await fulfillment.taskFail(a.id, a.reason)
      return true
    case 'addRecord':
      await inventory.addRecord(a.clientId ?? crypto.randomUUID(), a.record)
      return true
    case 'moveRecord':
      await inventory.moveRecord(a.clientId ?? crypto.randomUUID(), a.id, a.kind, a.quantity, a.note)
      return true
    case 'correctRecord':
      await inventory.correctRecord(a.clientId ?? crypto.randomUUID(), a.id, a.quantity, a.reason)
      return true
    case 'reportIssue':
      await issues.reportIssue(a.clientId ?? crypto.randomUUID(), a.transferId, a.category, a.description)
      return true
    case 'objectIssue':
      await issues.objectIssue(a.id, a.note)
      return true
    case 'readNotification':
      await notify.markRead(a.id)
      return true
    case 'readAllNotifications':
      await notify.markRead()
      return true
    case 'toggleTip':
    case 'toggleRecipe':
      await engagement.toggleSaved(a.id)
      return true
    case 'joinChallenge':
      await engagement.joinChallenge(a.id)
      return true
    case 'finishChallenge':
      await engagement.finishChallenge(a.id)
      return true
    case 'claimReward':
      if (!a.participant) throw new AppError('STATUS_TIDAK_SESUAI', 'Belum ada challenge terverifikasi untuk diklaim.')
      await engagement.claimReward(a.participant, a.id)
      return true
    case 'setAppreciation':
      if (!a.materialId) throw new AppError('STATUS_TIDAK_SESUAI', 'Belum ada materi apresiasi dari tim program.')
      await engagement.respondAppreciation(a.materialId, a.value === 'Disetujui' ? 'Disetujui' : 'Revisi diminta', a.note)
      return true
    case 'addSupport':
      await funding.addSupport(a.clientId ?? crypto.randomUUID(), a.amount, a.fund ?? 'operasional', a.allocation)
      return true
    case 'setRecurring':
      await funding.setRecurring(a.value)
      return true
    case 'addInKind':
      await funding.addInKind(a.clientId ?? crypto.randomUUID(), a.kind, a.amount)
      return true
    case 'setPref':
      await rpc('identity_set_pref', { p_key: a.key, p_value: a.value })
      return false // tersimpan di server; state lokal tetap diperbarui reducer tanpa muat ulang semua data
    default:
      return false
  }
}

/**
 * Jalankan aksi: mode demo → reducer lokal; mode live → RPC lalu muat ulang data.
 * Melempar AppError bila server menolak; layar menampilkan messageOf(err).
 */
export function useCommand() {
  const { dispatch } = useApp()
  const { refresh } = useLiveData()
  return useCallback(
    async (a: Action) => {
      if (isLive && (await toServer(a))) return refresh()
      dispatch(a)
    },
    [dispatch, refresh],
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowCounterClockwise, ArrowUp, CircleNotch, Keyboard, Microphone, NotePencil, SpeakerHigh, Sparkle, Waveform, X } from '@phosphor-icons/react'
import { AppBar, Button, IconButton, Notice, reduceMotion, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import { messageOf } from '../../lib/supabase/errors'
import { asset } from '../../lib/format'
import { askAssistant, type ChatTurn } from '../../services/assistant'
import { canListen, canSpeak, listen, speak } from './speech'
import { MessageText } from './MessageText'

/* ---------- R10 Asisten Dapur AI: chat teks + mode suara (FR-RS-01 s.d. 06, AR-21) ---------- */

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking'

const SUGGESTIONS = ['Nasi sisa semalam enaknya diolah jadi apa?', 'Cara menyimpan sayur hijau agar awet seminggu', 'Roti hampir kedaluwarsa, bisa dibuat apa?']

// Riwayat hanya di perangkat ini (OD-06): server tidak menyimpan isi percakapan.
const storeKey = (owner: string) => `lp-asisten-v1:${owner}`
const load = (key: string): ChatTurn[] => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as ChatTurn[]
  } catch {
    return []
  }
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Ketuk lingkaran untuk bicara',
  listening: 'Mendengarkan… silakan bicara',
  thinking: 'Asisten menyiapkan jawaban…',
  speaking: 'Asisten berbicara. Ketuk untuk menyela.',
}

export function AssistantChat() {
  const { state } = useApp()
  const profile = useProfile()
  const key = storeKey(profile.name || state.role)
  const [turns, setTurns] = useState<ChatTurn[]>(() => load(key))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; text: string } | null>(null)
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')
  const [hint, setHint] = useState('')
  const [dictating, setDictating] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const [reading, setReading] = useState<number | null>(null)

  const turnsRef = useRef(turns)
  const voiceRef = useRef(false)
  const heardRef = useRef('')
  const stopRef = useRef<(() => void) | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  turnsRef.current = turns

  const pantry = state.records
    .filter((r) => r.owner === state.role && r.status === 'Masih tersedia')
    .slice(0, 30)
    .map((r) => `${r.name} ${r.quantity} ${r.unit}`)

  // Efek memakai kurung kurawal: scrollIntoView di Chromium baru mengembalikan Promise, bukan fungsi pembersih.
  useEffect(() => {
    setTurns(load(key))
  }, [key])
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(turns.slice(-40)))
    } catch {
      /* penyimpanan perangkat penuh atau diblokir: obrolan tetap jalan */
    }
  }, [key, turns])
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'end' })
  }, [turns, busy, voice])
  useEffect(() => () => stopAll(), [])

  function stopAll() {
    stopRef.current?.()
    stopRef.current = null
    if (canSpeak) window.speechSynthesis.cancel()
    setReading(null)
  }

  async function send(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    const before = turnsRef.current
    const next: ChatTurn[] = [...before, { role: 'user', text }]
    setTurns(next)
    setInput('')
    setError(null)
    setBusy(true)
    if (voiceRef.current) setPhase('thinking')
    try {
      const { reply, onTopic } = await askAssistant(next, pantry)
      setTurns([...next, { role: 'assistant', text: reply, onTopic }])
      if (voiceRef.current) speakReply(reply)
    } catch (e) {
      // Pesan gagal dikeluarkan dari riwayat agar "Coba lagi" tidak menggandakannya.
      setTurns(before)
      setError({ message: messageOf(e), text })
      if (voiceRef.current) setPhase('idle')
    } finally {
      setBusy(false)
    }
  }

  function startListening() {
    stopAll()
    setPhase('listening')
    setHeard('')
    setHint('')
    heardRef.current = ''
    stopRef.current = listen(
      (t) => {
        heardRef.current = t
        setHeard(t)
      },
      (err) => {
        stopRef.current = null
        if (!voiceRef.current) return
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setMicDenied(true)
          endVoice()
          return
        }
        if (heardRef.current) return void send(heardRef.current)
        setPhase('idle')
        setHint(err === 'network' ? 'Pengenalan suara butuh koneksi internet.' : 'Tidak terdengar suara. Ketuk lingkaran untuk mencoba lagi.')
      },
    )
  }

  function speakReply(text: string) {
    stopAll()
    setPhase('speaking')
    stopRef.current = speak(text, () => {
      stopRef.current = null
      if (voiceRef.current) startListening()
    })
  }

  function startVoice() {
    voiceRef.current = true
    setVoice(true)
    startListening()
  }

  function endVoice() {
    voiceRef.current = false
    setVoice(false)
    stopAll()
    setPhase('idle')
  }

  const tapOrb = () => {
    if (phase === 'listening') stopRef.current?.() // berhenti mendengar → yang terdengar dikirim
    else if (phase !== 'thinking') startListening()
  }

  const dictate = () => {
    if (dictating) return stopRef.current?.()
    stopAll()
    setDictating(true)
    const base = input ? `${input.trim()} ` : ''
    stopRef.current = listen(
      (t) => setInput(base + t),
      (err) => {
        stopRef.current = null
        setDictating(false)
        if (err === 'not-allowed' || err === 'service-not-allowed') setMicDenied(true)
        inputRef.current?.focus()
      },
    )
  }

  const readAloud = (i: number) => {
    if (reading === i) return stopAll()
    stopAll()
    setReading(i)
    stopRef.current = speak(turns[i].text, () => setReading(null))
  }

  const lastReply = [...turns].reverse().find((t) => t.role === 'assistant')?.text

  return (
    <>
      <AppBar
        title="Asisten Dapur AI"
        actions={
          turns.length > 0 && (
            <IconButton
              label="Obrolan baru"
              onClick={() => {
                endVoice()
                setTurns([])
                setError(null)
                toast('Obrolan baru dimulai.', 'info')
              }}
            >
              <NotePencil size={22} aria-hidden="true" />
            </IconButton>
          )
        }
      />
      <main className={`mx-auto flex max-w-[560px] flex-col gap-4 px-4 pt-4 ${voice ? 'pb-[380px]' : 'pb-44'}`}>
        {turns.length === 0 && (
          <section className="animate-rise-in flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-greet bg-primary-container px-5 py-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-card">
                <img src={asset('img/logo-mark.png')} alt="" className="h-11 w-11" />
              </span>
              <h2 className="text-section-title">Halo! Aku Asisten Dapur.</h2>
              <p className="max-w-[34ch] text-body text-ink-secondary">
                Sebutkan bahan yang ada, aku bantu cari ide masakan supaya tidak terbuang. Bisa ketik atau ngobrol pakai suara.
              </p>
              <span className="rounded-full bg-surface px-3 py-1 text-caption text-primary">Khusus seputar makanan</span>
              {canListen && (
                <Button icon={<Waveform size={20} weight="bold" />} onClick={startVoice}>
                  Mulai ngobrol pakai suara
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-label text-ink-secondary">Coba tanyakan</h2>
              {[...(pantry.length ? [`Masak apa dari ${pantry.length} bahan di Catat Pangan saya?`] : []), ...SUGGESTIONS].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="tap card flex min-h-12 items-center gap-3 px-4 py-3 text-left text-[0.9375rem] hover:bg-page"
                >
                  <Sparkle size={18} weight="fill" aria-hidden="true" className="shrink-0 text-accent-ink" />
                  {s}
                </button>
              ))}
            </div>
            <p className="text-caption text-ink-secondary">
              Pesan diproses Google Gemini. Ucapan diubah jadi teks oleh browser Anda. Riwayat obrolan hanya disimpan di perangkat ini. AI bisa keliru, jadi periksa sendiri kondisi pangan sebelum dikonsumsi.
            </p>
          </section>
        )}

        {!canListen && <Notice tone="info">Browser ini belum mendukung input suara. Pakai Chrome di Android untuk ngobrol dengan suara; mengetik tetap bisa.</Notice>}
        {micDenied && <Notice tone="warning" title="Izin mikrofon ditolak">Izinkan mikrofon di pengaturan browser, atau lanjutkan dengan mengetik.</Notice>}

        <div role="log" aria-live="polite" aria-label="Percakapan dengan Asisten Dapur" className="flex flex-col gap-3">
          {turns.map((t, i) =>
            t.role === 'user' ? (
              <p key={i} className="ml-auto max-w-[85%] animate-rise-in whitespace-pre-wrap break-words rounded-card rounded-br-md bg-primary px-4 py-3 text-body text-white">
                <span className="sr-only">Anda: </span>
                {t.text}
              </p>
            ) : (
              <div key={i} className="flex max-w-[92%] animate-rise-in gap-2">
                <span aria-hidden="true" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                  <Sparkle size={16} weight="fill" />
                </span>
                <div className={`min-w-0 rounded-card rounded-tl-md border px-4 py-3 text-body ${t.onTopic === false ? 'border-info/30 bg-info-container' : 'border-line bg-surface'}`}>
                  <span className="sr-only">Asisten: </span>
                  <MessageText text={t.text} />
                  {canSpeak && (
                    <button
                      type="button"
                      onClick={() => readAloud(i)}
                      aria-pressed={reading === i}
                      className="tap -mb-2 -ml-2 mt-1 inline-flex min-h-12 items-center gap-1.5 rounded-control px-2 text-[0.875rem] font-semibold text-primary hover:bg-primary-container"
                    >
                      <SpeakerHigh size={18} aria-hidden="true" />
                      {reading === i ? 'Berhenti' : 'Dengarkan'}
                    </button>
                  )}
                </div>
              </div>
            ),
          )}
          {busy && (
            <p role="status" className="flex items-center gap-2 text-meta text-ink-secondary">
              <CircleNotch size={18} aria-hidden="true" className="animate-spin text-primary" />
              Asisten menyiapkan jawaban…
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="flex flex-col gap-2 rounded-control bg-danger-container p-3 text-meta">
            <p>{error.message}</p>
            <Button variant="secondary" icon={<ArrowCounterClockwise size={18} />} onClick={() => send(error.text)}>
              Coba lagi
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </main>

      {createPortal(
        voice ? (
          <section
            aria-label="Mode suara"
            className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 animate-footer-in flex-col items-center gap-3 rounded-t-sheet border-t border-line bg-primary-container px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-5 shadow-overlay"
          >
            <p aria-live="polite" className="text-label text-primary-pressed">{PHASE_LABEL[phase]}</p>
            <button
              type="button"
              onClick={tapOrb}
              disabled={phase === 'thinking'}
              aria-label={phase === 'listening' ? 'Selesai bicara' : phase === 'speaking' ? 'Sela dan bicara' : 'Mulai bicara'}
              className="tap relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-white shadow-overlay disabled:opacity-90"
            >
              {phase === 'listening' && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
              {phase === 'speaking' && <span aria-hidden="true" className="absolute -inset-2 animate-pulse rounded-full bg-primary/25" />}
              {phase === 'thinking' ? (
                <CircleNotch size={44} aria-hidden="true" className="animate-spin" />
              ) : phase === 'speaking' ? (
                <SpeakerHigh size={44} weight="fill" aria-hidden="true" className="relative" />
              ) : (
                <Microphone size={44} weight="fill" aria-hidden="true" className="relative" />
              )}
            </button>
            <p className="min-h-12 max-w-[36ch] text-center text-body text-ink">{heard || hint || (phase === 'listening' ? 'Contoh: “Ada nasi dan telur, masak apa?”' : '')}</p>
            <div className="grid w-full grid-cols-3 gap-2">
              <Button variant="secondary" icon={<ArrowCounterClockwise size={18} />} disabled={!lastReply || phase === 'thinking'} onClick={() => lastReply && speakReply(lastReply)}>
                Ulangi
              </Button>
              <Button variant="secondary" icon={<Keyboard size={18} />} onClick={() => (endVoice(), inputRef.current?.focus())}>
                Ketik
              </Button>
              <Button variant="danger" icon={<X size={18} weight="bold" />} onClick={endVoice}>
                Selesai
              </Button>
            </div>
          </section>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
            className="fixed bottom-0 left-1/2 z-30 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-3 shadow-nav backdrop-blur"
          >
            <div className="flex items-end gap-2">
              {canListen && (
                <button
                  type="button"
                  onClick={dictate}
                  aria-pressed={dictating}
                  aria-label={dictating ? 'Berhenti mendikte' : 'Dikte dengan suara'}
                  className={`tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${dictating ? 'animate-pulse bg-danger text-white' : 'text-ink hover:bg-page'}`}
                >
                  <Microphone size={24} weight={dictating ? 'fill' : 'regular'} aria-hidden="true" />
                </button>
              )}
              <label htmlFor="asisten-input" className="sr-only">Tulis pesan untuk Asisten Dapur</label>
              <textarea
                id="asisten-input"
                ref={inputRef}
                rows={1}
                maxLength={2000}
                enterKeyHint="send"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send(input)
                  }
                }}
                placeholder={dictating ? 'Mendengarkan…' : 'Tanya di sini…'}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-[24px] border border-line-control bg-surface px-4 py-3 text-body leading-6 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {input.trim() ? (
                <button type="submit" disabled={busy} aria-label="Kirim pesan" className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50">
                  <ArrowUp size={22} weight="bold" aria-hidden="true" />
                </button>
              ) : (
                canListen && (
                  <button type="button" onClick={startVoice} disabled={busy} className="tap flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 font-semibold text-white disabled:opacity-50">
                    <Waveform size={20} weight="bold" aria-hidden="true" />
                    Bicara
                  </button>
                )
              )}
            </div>
            <p className="mt-1.5 text-center text-caption text-ink-secondary">Khusus seputar makanan · AI bisa keliru</p>
          </form>
        ),
        document.body,
      )}
    </>
  )
}

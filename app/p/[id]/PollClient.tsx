'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '../../../lib/supabase'

type Poll = { id: string; question: string }
type Option = { id: string; poll_id: string; text: string; votes: number }

const GOAL = 10

function getFingerprint() {
  const key = 'lv_fp'
  let fp = localStorage.getItem(key)
  if (!fp) {
    fp = `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`
    localStorage.setItem(key, fp)
  }
  return fp
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white/90 shadow-sm backdrop-blur px-5 py-6 sm:px-7">
      {children}
    </div>
  )
}

export default function PollClient({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)

  const [copiedVote, setCopiedVote] = useState(false)
  const [copiedResults, setCopiedResults] = useState(false)

  const totalVotes = useMemo(() => options.reduce((sum, o) => sum + (o.votes ?? 0), 0), [options])
  const missing = Math.max(0, GOAL - totalVotes)
  const progressPct = Math.min(100, Math.round((totalVotes / GOAL) * 100))

  useEffect(() => {
    setHasVoted(!!localStorage.getItem(`voted_${pollId}`))
  }, [pollId])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const supabase = supabaseClient()

      const { data: p, error: pErr } = await supabase
        .from('polls')
        .select('id, question')
        .eq('id', pollId)
        .single()
      if (pErr) throw pErr
      setPoll(p)

      const { data: opts, error: oErr } = await supabase
        .from('options')
        .select('id, poll_id, text, votes')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: true })
      if (oErr) throw oErr
      setOptions((opts ?? []) as Option[])
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const supabase = supabaseClient()
    const channel = supabase
      .channel(`opts-${pollId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options', filter: `poll_id=eq.${pollId}` }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  function markVoted() {
    localStorage.setItem(`voted_${pollId}`, '1')
    setHasVoted(true)
  }

  async function vote(optionId: string) {
    if (hasVoted) return
    setVoting(optionId)
    setError(null)

    try {
      const supabase = supabaseClient()
      const fingerprint = getFingerprint()

      const { error: vErr } = await supabase.from('votes').insert({
        poll_id: pollId,
        option_id: optionId,
        fingerprint,
      })

      if (vErr) {
        const msg = (vErr as any)?.message?.toLowerCase?.() ?? ''
        if (msg.includes('duplicate') || msg.includes('unique')) {
          markVoted()
          await load()
          return
        }
        throw vErr
      }

      const { error: incErr } = await supabase.rpc('increment_option_vote', { option_id: optionId })
      if (incErr) throw incErr

      markVoted()
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il voto')
    } finally {
      setVoting(null)
    }
  }

  const voteUrl = typeof window !== 'undefined' ? window.location.href : ''
  const resultsUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${pollId}` : ''

  const waVote = `https://wa.me/?text=${encodeURIComponent(`Vota qui 👇 (1 click)\n${voteUrl}`)}`
  const tgVote = `https://t.me/share/url?url=${encodeURIComponent(voteUrl)}&text=${encodeURIComponent('Vota qui 👇 (1 click)')}`

  const waResults = `https://wa.me/?text=${encodeURIComponent(`Risultati in tempo reale 👇\n${resultsUrl}`)}`
  const tgResults = `https://t.me/share/url?url=${encodeURIComponent(resultsUrl)}&text=${encodeURIComponent('Risultati in tempo reale 👇')}`

  async function copy(text: string, which: 'vote' | 'results') {
    await navigator.clipboard.writeText(text)
    if (which === 'vote') {
      setCopiedVote(true); setTimeout(() => setCopiedVote(false), 1200)
    } else {
      setCopiedResults(true); setTimeout(() => setCopiedResults(false), 1200)
    }
  }

  if (loading) return <main className="p-6 text-center text-zinc-600">Caricamento…</main>
  if (!poll) return <main className="p-6">Sondaggio non trovato.</main>

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto max-w-2xl py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/r/${pollId}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
              Risultati
            </Link>
            <Link href="/create" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
              + Nuovo
            </Link>
          </div>
        </header>

        <div className="mt-7 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{poll.question}</h1>
            <p className="mt-2 text-zinc-600">
              {hasVoted ? 'Hai votato ✅ Ora condividi per far votare gli altri.' : 'Scegli un’opzione (1 click).'}
            </p>
          </div>

          <Card>
            {/* D1: Goal + progress */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Totale voti</div>
              <div className="text-xl font-bold">{totalVotes}</div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Obiettivo: {GOAL} voti</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {missing > 0 ? `Mancano ${missing} voti per un risultato più affidabile.` : 'Risultato stabile ✅'}
              </div>
            </div>

            {/* Opzioni */}
            <div className="mt-5 space-y-3">
              {options.map((o) => {
                const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
                const disabled = hasVoted || voting !== null
                return (
                  <button
                    key={o.id}
                    className={`w-full rounded-3xl border border-zinc-200 bg-white p-4 text-left transition active:scale-[0.99]
                      ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-zinc-50 hover:border-zinc-300'}`}
                    onClick={() => vote(o.id)}
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold">{o.text}</div>
                      <div className="text-sm text-zinc-600">{o.votes} • {pct}%</div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* D2 + D3: Share blocks */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                onClick={() => copy(voteUrl, 'vote')}
              >
                {copiedVote ? '✅ Link voto copiato!' : '📎 Copia link voto'}
              </button>

              <a
                className="rounded-2xl bg-zinc-900 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition shadow-sm"
                href={waVote}
                target="_blank"
                rel="noreferrer"
              >
                📤 Condividi voto (WhatsApp)
              </a>

              <a
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-center text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                href={tgVote}
                target="_blank"
                rel="noreferrer"
              >
                ✈️ Condividi voto (Telegram)
              </a>

              <button
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                onClick={() => copy(resultsUrl, 'results')}
              >
                {copiedResults ? '✅ Link risultati copiato!' : '📎 Copia link risultati'}
              </button>
            </div>

            {/* After vote: push results */}
            {hasVoted && (
              <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-4">
                <div className="font-semibold">Ora fai girare il sondaggio 🔥</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Invia il link voto nel gruppo. Quando arrivi a {GOAL} voti, manda anche i risultati.
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <a className="rounded-2xl bg-zinc-900 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
                     href={waResults} target="_blank" rel="noreferrer">
                    📊 Condividi risultati (WA)
                  </a>
                  <a className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-center text-sm font-semibold hover:bg-zinc-50"
                     href={tgResults} target="_blank" rel="noreferrer">
                    📊 Condividi risultati (TG)
                  </a>
                </div>
              </div>
            )}

            {/* D4 mini guidance */}
            <div className="mt-4 text-center text-xs text-zinc-500">
              Suggerimento: manda prima <span className="font-semibold">link voto</span>, poi dopo {GOAL} voti manda <span className="font-semibold">link risultati</span>.
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

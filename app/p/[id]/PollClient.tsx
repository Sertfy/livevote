'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '../../../lib/supabase'

type Poll = { id: string; question: string }
type Option = { id: string; poll_id: string; text: string; votes: number }

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
  const [copied, setCopied] = useState(false)

  const totalVotes = useMemo(() => options.reduce((sum, o) => sum + (o.votes ?? 0), 0), [options])

  function markVoted() {
    localStorage.setItem(`voted_${pollId}`, '1')
    setHasVoted(true)
  }

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
    setHasVoted(!!localStorage.getItem(`voted_${pollId}`))
  }, [pollId])

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

  async function copyLink() {
    setCopied(false)
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const wa = `https://wa.me/?text=${encodeURIComponent(`Vota qui: ${shareUrl}`)}`

  if (loading) return <main className="p-6 text-center text-zinc-600">Caricamento sondaggio…</main>
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
              {hasVoted ? 'Hai già votato 👍' : 'Scegli un’opzione (1 click).'}
            </p>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Totale voti</div>
              <div className="text-xl font-bold">{totalVotes}</div>
            </div>

            <div className="mt-5 space-y-3">
              {options.map((o) => {
                const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
                const disabled = hasVoted || voting !== null
                const isLoading = voting === o.id

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

                    {isLoading && <div className="mt-3 text-sm text-zinc-500">Invio voto…</div>}
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                onClick={copyLink}
              >
                {copied ? '✅ Link copiato!' : '📎 Copia link'}
              </button>

              <a
                className="rounded-2xl bg-zinc-900 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition shadow-sm"
                href={wa}
                target="_blank"
                rel="noreferrer"
              >
                📤 Condividi su WhatsApp
              </a>
            </div>

            <div className="mt-4 text-center text-xs text-zinc-500">
              Tip: dopo che tutti hanno votato, condividi la pagina <span className="font-semibold">Risultati</span>.
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '../../../lib/supabase'

type Poll = { id: string; question: string }
type Option = { id: string; poll_id: string; text: string; votes: number }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white/90 shadow-sm backdrop-blur px-5 py-6 sm:px-7">
      {children}
    </div>
  )
}

export default function ResultsClient({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [copied, setCopied] = useState(false)

  const totalVotes = useMemo(() => options.reduce((s, o) => s + (o.votes ?? 0), 0), [options])

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
        .order('votes', { ascending: false })
      if (oErr) throw oErr
      setOptions((opts ?? []) as Option[])
    } catch (e: any) {
      setError(e?.message ?? 'Errore')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const supabase = supabaseClient()
    const channel = supabase
      .channel(`res-${pollId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options', filter: `poll_id=eq.${pollId}` }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  const resultsUrl = typeof window !== 'undefined' ? window.location.href : ''
  const voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${pollId}` : ''

  const waResults = `https://wa.me/?text=${encodeURIComponent(`Risultati in tempo reale 👇\n${resultsUrl}`)}`
  const tgResults = `https://t.me/share/url?url=${encodeURIComponent(resultsUrl)}&text=${encodeURIComponent('Risultati in tempo reale 👇')}`

  async function copyLink() {
    await navigator.clipboard.writeText(resultsUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  if (loading) return <main className="p-6 text-center text-zinc-600">Caricamento risultati…</main>
  if (!poll) return <main className="p-6">Sondaggio non trovato.</main>

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto max-w-2xl py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/p/${pollId}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
              Torna al voto
            </Link>
            <Link href="/create" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition">
              + Nuovo
            </Link>
          </div>
        </header>

        <div className="mt-7 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{poll.question}</h1>
            <p className="mt-2 text-zinc-600">Risultati in tempo reale (condividibili).</p>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">Totale voti</div>
              <div className="text-xl font-bold">{totalVotes}</div>
            </div>

            <div className="mt-5 space-y-3">
              {options.map((o) => {
                const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
                return (
                  <div key={o.id} className="rounded-3xl border border-zinc-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold">{o.text}</div>
                      <div className="text-sm text-zinc-600">{o.votes} • {pct}%</div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* D2 share */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                onClick={copyLink}
              >
                {copied ? '✅ Copiato!' : '📎 Copia link risultati'}
              </button>

              <a
                className="rounded-2xl bg-zinc-900 px-5 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition shadow-sm"
                href={waResults}
                target="_blank"
                rel="noreferrer"
              >
                📤 Condividi risultati (WA)
              </a>

              <a
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-center text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                href={tgResults}
                target="_blank"
                rel="noreferrer"
              >
                ✈️ Condividi risultati (TG)
              </a>

              {/* D3 loop: rimanda al voto */}
              <a
                className="rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-center text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                href={voteUrl}
              >
                🗳️ Rimanda al voto
              </a>
            </div>

            {/* D3 spiegazione */}
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="font-semibold">Vuoi più voti?</div>
              <div className="mt-1 text-sm text-zinc-600">
                Rimanda il link voto nel gruppo: più persone votano, più il risultato è credibile.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}



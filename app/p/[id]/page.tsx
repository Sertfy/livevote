'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function PollPage() {
  const params = useParams()
  const pollId = params?.id as string | undefined

  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hasVoted, setHasVoted] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + (o.votes ?? 0), 0),
    [options]
  )

  function markVoted() {
    if (!pollId) return
    localStorage.setItem(`voted_${pollId}`, '1')
    setHasVoted(true)
  }

  async function load(pollIdSafe: string) {
    setError(null)
    setLoading(true)

    try {
      const supabase = supabaseClient()

      const { data: p, error: pErr } = await supabase
        .from('polls')
        .select('id, question')
        .eq('id', pollIdSafe)
        .single()

      if (pErr) throw pErr
      setPoll(p)

      const { data: opts, error: oErr } = await supabase
        .from('options')
        .select('id, poll_id, text, votes')
        .eq('poll_id', pollIdSafe)
        .order('created_at', { ascending: true })

      if (oErr) throw oErr
      setOptions((opts ?? []) as Option[])
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  // 1) Legge subito se ha già votato (browser)
  useEffect(() => {
    if (!pollId) return
    setHasVoted(!!localStorage.getItem(`voted_${pollId}`))
  }, [pollId])

  // 2) Load + realtime
  useEffect(() => {
    if (!pollId) return

    load(pollId)

    const supabase = supabaseClient()
    const channel = supabase
      .channel(`opts-${pollId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'options', filter: `poll_id=eq.${pollId}` },
        () => load(pollId)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  async function vote(optionId: string) {
    if (!pollId) return
    if (hasVoted) return

    setVoting(optionId)
    setError(null)

    try {
      const supabase = supabaseClient()
      const fingerprint = getFingerprint()

      // A) Prova a registrare il voto (DB blocca doppioni via unique poll_id+fingerprint)
      const { error: vErr } = await supabase.from('votes').insert({
        poll_id: pollId,
        option_id: optionId,
        fingerprint,
      })

      if (vErr) {
        const msg = (vErr as any)?.message?.toLowerCase?.() ?? ''
        if (msg.includes('duplicate') || msg.includes('unique')) {
          // ha già votato (anche se localStorage non era settato)
          markVoted()
          await load(pollId)
          return
        }
        throw vErr
      }

      // B) Incremento atomico del contatore (nessun "current+1")
      const { error: incErr } = await supabase.rpc('increment_option_vote', {
        option_id: optionId,
      })
      if (incErr) throw incErr

      // C) Segna come votato lato browser
      markVoted()

      await load(pollId)
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il voto')
    } finally {
      setVoting(null)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    alert('Link copiato!')
  }

  if (!pollId) return <main className="p-6">Link non valido.</main>
  if (loading) return <main className="p-6">Caricamento...</main>
  if (error) return <main className="p-6">Errore: {error}</main>
  if (!poll) return <main className="p-6">Votazione non trovata.</main>

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">{poll.question}</h1>

      <p className="mt-2 text-sm text-gray-600">
        Totale voti: {totalVotes}
      </p>

      {hasVoted && (
        <p className="mt-4 text-sm text-gray-700">
          Hai già votato 👍
        </p>
      )}

      <div className="mt-6 space-y-3">
        {options.map(o => {
          const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
          const disabled = hasVoted || voting !== null

          return (
            <button
              key={o.id}
              className={`w-full border rounded-md p-3 text-left ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => vote(o.id)}
              disabled={disabled}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{o.text}</span>
                <span className="text-sm text-gray-600">
                  {o.votes} • {pct}%
                </span>
              </div>

              <div className="mt-2 h-2 w-full bg-gray-100 rounded">
                <div className="h-2 bg-gray-300 rounded" style={{ width: `${pct}%` }} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <button className="border rounded-md px-4 py-2" onClick={copyLink}>
          Copia link
        </button>
        <a className="border rounded-md px-4 py-2" href="/create">
          Crea nuova
        </a>
      </div>
    </main>
  )
}


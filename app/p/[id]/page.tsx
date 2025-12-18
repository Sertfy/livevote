'use client'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

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
  const [voting, setVoting] = useState<string | null>(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + (o.votes ?? 0), 0),
    [options]
  )
  if (!pollId) {
    return <main className="p-6">Link non valido (id mancante).</main>
  }

  async function load() {
    setError(null)
    setLoading(true)
    try {
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
      setOptions(opts ?? [])

      // check se ha già votato
      const fp = getFingerprint()
      const { data: v, error: vErr } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('fingerprint', fp)
        .limit(1)

      if (vErr) throw vErr
      setAlreadyVoted((v ?? []).length > 0)
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // realtime: aggiorna i voti quando cambiano le options
    const channel = supabase
      .channel(`opts-${pollId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'options', filter: `poll_id=eq.${pollId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId])

  async function vote(optionId: string) {
    if (alreadyVoted) return
    setVoting(optionId)
    setError(null)
    try {
      const fp = getFingerprint()

      // 1) registra voto (unique su poll_id+fingerprint)
      const { error: vErr } = await supabase.from('votes').insert({
        poll_id: pollId,
        option_id: optionId,
        fingerprint: fp,
      })
      if (vErr) throw vErr

      // 2) incrementa contatore voti opzione
      const current = options.find(o => o.id === optionId)?.votes ?? 0
      const { error: uErr } = await supabase
        .from('options')
        .update({ votes: current + 1 })
        .eq('id', optionId)

      if (uErr) throw uErr

      setAlreadyVoted(true)
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante il voto')
    } finally {
      setVoting(null)
    }
  }

  async function copyLink() {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    alert('Link copiato!')
  }

  if (loading) return <main className="p-6">Caricamento...</main>
  if (error) return <main className="p-6">Errore: {error}</main>
  if (!poll) return <main className="p-6">Non trovata.</main>

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">{poll.question}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Totale voti: {totalVotes}
      </p>

      <div className="mt-6 space-y-3">
        {options.map(o => {
          const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
          return (
            <button
              key={o.id}
              className="w-full border rounded-md p-3 text-left"
              onClick={() => vote(o.id)}
              disabled={alreadyVoted || voting !== null}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{o.text}</span>
                <span className="text-sm text-gray-600">{o.votes} • {pct}%</span>
              </div>
              <div className="mt-2 h-2 w-full bg-gray-100 rounded">
                <div
                  className="h-2 bg-gray-300 rounded"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {alreadyVoted && (
        <p className="mt-4 text-sm text-gray-700">
          Hai già votato su questa votazione ✅
        </p>
      )}

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

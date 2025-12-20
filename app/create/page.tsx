'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '../../lib/supabase'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white/90 shadow-sm backdrop-blur px-5 py-6 sm:px-7">
      {children}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
      {children}
    </span>
  )
}

export default function CreatePage() {
  const [question, setQuestion] = useState('')
  const [opts, setOpts] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleaned = useMemo(() => opts.map(o => o.trim()).filter(Boolean), [opts])

  const validation = useMemo(() => {
    const q = question.trim()
    if (q.length < 3) return { ok: false, msg: 'La domanda è troppo corta.' }

    if (cleaned.length < 2) return { ok: false, msg: 'Inserisci almeno 2 opzioni.' }

    const unique = new Set(cleaned)
    if (unique.size !== cleaned.length) return { ok: false, msg: 'Le opzioni devono essere diverse.' }

    return { ok: true, msg: '' }
  }, [question, cleaned])

  function setOpt(i: number, value: string) {
    setOpts(prev => prev.map((x, idx) => (idx === i ? value : x)))
  }

  function addOpt() {
    setOpts(prev => [...prev, ''])
  }

  function removeOpt(i: number) {
    setOpts(prev => prev.filter((_, idx) => idx !== i))
  }

  async function onCreate() {
    setError(null)
    if (!validation.ok) {
      setError(validation.msg)
      return
    }

    setLoading(true)
    try {
      const supabase = supabaseClient()

      // Insert poll (robusto: select senza single)
      const { data: polls, error: pErr } = await supabase
        .from('polls')
        .insert({ question: question.trim() })
        .select('id')

      if (pErr) throw pErr

      const pollId = polls?.[0]?.id
      if (!pollId) throw new Error('Poll id mancante (insert non ha restituito id)')

      const toInsert = cleaned.map((text) => ({ poll_id: pollId, text, votes: 0 }))
      const { error: oErr } = await supabase.from('options').insert(toInsert)
      if (oErr) throw oErr

      window.location.href = `/p/${pollId}`
    } catch (e: any) {
      setError(e?.message ?? 'Errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto max-w-2xl py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <Pill>Zero login</Pill>
            <Pill>Realtime</Pill>
          </div>
        </header>

        <div className="mt-7 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Crea la tua votazione
            </h1>
            <p className="mt-2 text-zinc-600">
              Domanda chiara + opzioni semplici = più risposte.
            </p>
          </div>

          <Card>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-zinc-800">Domanda</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-base outline-none focus:ring-4 focus:ring-zinc-200"
                  placeholder="Es. Dove andiamo a cena?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Tip: massimo impatto se sta in 1 riga.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-800">Opzioni</label>
                  <button
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
                    type="button"
                    onClick={addOpt}
                  >
                    + Aggiungi
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {opts.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 outline-none focus:ring-4 focus:ring-zinc-200"
                        placeholder={`Opzione ${i + 1}`}
                        value={o}
                        onChange={(e) => setOpt(i, e.target.value)}
                      />
                      <button
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 font-bold hover:bg-zinc-50 active:scale-[0.99] transition disabled:opacity-40"
                        type="button"
                        onClick={() => removeOpt(i)}
                        disabled={opts.length <= 2}
                        title={opts.length <= 2 ? 'Minimo 2 opzioni' : 'Rimuovi'}
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-zinc-500">
                  Le opzioni vuote vengono ignorate. Duplicate non valide.
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                className={`w-full rounded-2xl px-5 py-4 text-base font-semibold transition active:scale-[0.99]
                ${validation.ok ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm' : 'border border-zinc-200 bg-white text-zinc-400'}`}
                onClick={onCreate}
                disabled={!validation.ok || loading}
              >
                {loading ? 'Creo…' : 'Crea e genera link'}
              </button>

              <div className="text-center text-xs text-zinc-500">
                Dopo la creazione puoi condividere il link in un click.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

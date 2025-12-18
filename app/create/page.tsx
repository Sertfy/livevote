'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CreatePage() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setOption(i: number, value: string) {
    setOptions(prev => prev.map((v, idx) => (idx === i ? value : v)))
  }

  function addOption() {
    setOptions(prev => (prev.length >= 6 ? prev : [...prev, '']))
  }

  function removeOption(i: number) {
    setOptions(prev => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)))
  }

  async function onCreate() {
    setError(null)

    const q = question.trim()
    const opts = options.map(o => o.trim()).filter(Boolean)

    if (q.length < 3) return setError('Scrivi una domanda (min 3 caratteri).')
    if (opts.length < 2) return setError('Inserisci almeno 2 opzioni.')

    setLoading(true)
    try {
     // 1) crea poll
    const { data: pollsRows, error: pollErr } = await supabase
    .from('polls')
    .insert({ question: q })
    .select('id')

    if (pollErr) throw pollErr

    const pollId = pollsRows?.[0]?.id
    if (!pollId) throw new Error('ID poll non ricevuto')


      // 2) crea opzioni
      const rows = opts.map(text => ({ poll_id: pollId, text }))
      const { error: optErr } = await supabase.from('options').insert(rows)
      if (optErr) throw optErr

      // 3) vai alla pagina della poll
      window.location.href = `/p/${pollId}`
    } catch (e: any) {
      setError(e?.message ?? 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Crea una votazione</h1>

      <label className="block mt-6 text-sm font-medium">Domanda</label>
      <input
        className="mt-2 w-full border rounded-md p-2"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Es: Dove andiamo stasera?"
      />

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Opzioni (2–6)</label>
          <button
            className="text-sm underline"
            onClick={addOption}
            type="button"
            disabled={options.length >= 6}
          >
            + aggiungi
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {options.map((val, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="w-full border rounded-md p-2"
                value={val}
                onChange={e => setOption(i, e.target.value)}
                placeholder={`Opzione ${i + 1}`}
              />
              <button
                className="border rounded-md px-3"
                onClick={() => removeOption(i)}
                type="button"
                disabled={options.length <= 2}
                title="Rimuovi"
              >
                −
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        className="mt-6 w-full border rounded-md p-3 font-medium"
        onClick={onCreate}
        disabled={loading}
      >
        {loading ? 'Creazione...' : 'Crea e genera link'}
      </button>

      <p className="mt-4 text-xs text-gray-600">
        Nessun login. Ti esce un link condivisibile.
      </p>
    </main>
  )
}

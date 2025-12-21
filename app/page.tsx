'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseClient } from '../lib/supabase'

export default function Home() {
  const [kpi, setKpi] = useState<{ polls_created: number; votes_cast: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = supabaseClient()
        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        const { data } = await supabase
          .from('kpi_daily')
          .select('polls_created, votes_cast')
          .eq('day', today)
          .maybeSingle()

        if (data) setKpi(data)
        else setKpi({ polls_created: 0, votes_cast: 0 })
      } catch {
        // se KPI non disponibile, non bloccare la home
      }
    })()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto max-w-5xl py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-white font-bold">
              LV
            </div>
            <div>
              <div className="font-semibold leading-none">LiveVote</div>
              <div className="text-xs text-zinc-600">Sondaggi istantanei</div>
            </div>
          </Link>

          <Link
            href="/create"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
          >
            Crea sondaggio
          </Link>
        </header>

        {/* KPI */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-zinc-700">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold">
            Oggi: {kpi ? `${kpi.polls_created} sondaggi` : '…'}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-semibold">
            Oggi: {kpi ? `${kpi.votes_cast} voti` : '…'}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
            Zero login
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
            Realtime
          </span>
        </div>

        {/* HERO */}
        <section className="mt-10 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Crea un sondaggio in <span className="underline decoration-zinc-300">10 secondi</span>.
              <br />
              Condividi un link.
              <br />
              Risultati in tempo reale.
            </h1>

            <p className="mt-5 text-lg text-zinc-600">
              Perfetto per classe, gruppo amici, squadra, chat.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="rounded-2xl bg-zinc-900 px-6 py-3.5 text-center text-base font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition shadow-sm"
              >
                ✨ Crea ora
              </Link>

              <a
                href="#come-funziona"
                className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-center text-base font-semibold hover:bg-zinc-50 active:scale-[0.99] transition"
              >
                Come funziona
              </a>
            </div>

            {/* D4: mini distribution in-app */}
            <div className="mt-7 rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
              <div className="font-semibold">Dove condividerlo (gratis)</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600 space-y-1">
                <li>WhatsApp (gruppo classe / amici)</li>
                <li>Telegram / Discord</li>
                <li>Story IG con screenshot</li>
              </ul>
              <div className="mt-3 text-xs text-zinc-500">
                Tip: manda prima il link <span className="font-semibold">voto</span>, poi dopo 10 voti manda il link <span className="font-semibold">risultati</span>.
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-[28px] border border-zinc-200 bg-white/90 shadow-sm px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Esempio</div>
              <div className="text-xs text-zinc-500">livevote</div>
            </div>
            <div className="mt-4">
              <div className="text-xl font-bold">Dove andiamo a cena?</div>
              <div className="mt-1 text-sm text-zinc-600">Vota con un click e condividi.</div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { label: '🍕 Pizza', pct: 52 },
                { label: '🍣 Sushi', pct: 31 },
                { label: '🥗 Healthy', pct: 17 },
              ].map((x) => (
                <div key={x.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{x.label}</div>
                    <div className="text-sm text-zinc-600">{x.pct}%</div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-2 rounded-full bg-zinc-300" style={{ width: `${x.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="come-funziona" className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { t: '1) Crea', d: 'Scrivi domanda + opzioni. Nessun account.' },
            { t: '2) Condividi', d: 'Copia il link e invialo ovunque.' },
            { t: '3) Guarda', d: 'Risultati in tempo reale.' },
          ].map((x) => (
            <div key={x.t} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold">{x.t}</div>
              <p className="mt-2 text-zinc-600">{x.d}</p>
            </div>
          ))}
        </section>

        <footer className="mt-12 text-center text-xs text-zinc-500">
          LiveVote • Nessun login • Realtime
        </footer>
      </div>
    </main>
  )
}

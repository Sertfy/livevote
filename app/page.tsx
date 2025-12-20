import Link from 'next/link'
import Shell from './components/Shell'

export default function Home() {
  return (
    <Shell
      right={
        <Link
          href="/create"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50"
        >
          Crea sondaggio
        </Link>
      }
    >
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Crea un sondaggio in <span className="underline decoration-zinc-300">10 secondi</span>.
            <br />
            Condividi un link.
            <br />
            Risultati in tempo reale.
          </h1>

          <p className="mt-5 text-lg text-zinc-600">
            Zero login. Perfetto per classe, gruppo amici, squadra, chat.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="rounded-2xl bg-zinc-900 px-6 py-3.5 text-center text-base font-semibold text-white hover:bg-zinc-800 shadow-sm"
            >
              ✨ Crea ora
            </Link>

            <a
              href="#come-funziona"
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-center text-base font-semibold hover:bg-zinc-50"
            >
              Come funziona
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {['Gratis', 'Mobile-first', 'Condivisibile', 'Realtime'].map((t) => (
              <span key={t} className="rounded-full border border-zinc-200 bg-white px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="relative">
          <div className="absolute -inset-6 blur-3xl opacity-40 bg-gradient-to-r from-zinc-200 via-white to-zinc-200 rounded-[2.5rem]" />
          <div className="relative rounded-[2.25rem] border border-zinc-200 bg-white/90 p-6 shadow-sm">
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

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-500" disabled>
                Copia link
              </button>
              <button className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white opacity-60" disabled>
                Vota
              </button>
            </div>
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
    </Shell>
  )
}



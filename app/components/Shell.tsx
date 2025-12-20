import Link from 'next/link'

export default function Shell({
  children,
  right,
}: {
  children: React.ReactNode
  right?: React.ReactNode
}) {
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

          <div className="flex items-center gap-2">{right}</div>
        </header>

        <div className="mt-8">{children}</div>

        <footer className="mt-10 text-center text-xs text-zinc-500">
          LiveVote • Nessun login • Realtime
        </footer>
      </div>
    </main>
  )
}

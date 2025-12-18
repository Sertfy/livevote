export default function Home() {
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold">LiveVote</h1>
      <p className="mt-3 text-gray-700">
        Crea una votazione in 10 secondi e condividi il link.
      </p>

      <a
        href="/create"
        className="inline-block mt-6 border rounded-md px-4 py-3 font-medium"
      >
        Crea votazione
      </a>

      <p className="mt-6 text-xs text-gray-600">
        Nessun login. Gratis.
      </p>
    </main>
  )
}


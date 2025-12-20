import type { Metadata } from 'next'
import { supabaseServer } from '../../../lib/supabaseServer'
import ResultsClient from './ResultsClient'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  const supabase = supabaseServer()
  const { data } = await supabase.from('polls').select('question').eq('id', id).single()

  const q = data?.question?.trim() || 'Risultati LiveVote'
  return {
    title: `Risultati: ${q} – LiveVote`,
    description: 'Guarda i risultati in tempo reale e condividili.',
    openGraph: {
      title: `Risultati: ${q} – LiveVote`,
      description: 'Guarda i risultati in tempo reale e condividili.',
      images: ['/og.png'],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <ResultsClient pollId={id} />
}

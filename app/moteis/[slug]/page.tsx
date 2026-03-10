import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Motel, Suite, SuitePhoto, SuitePrice } from '@/lib/types'
import MotelSite from '@/components/MotelSite/MotelSite'

export const revalidate = 60 // ISR: revalida a cada 60s

type FullMotel = Motel & {
  suites: (Suite & { suite_photos: SuitePhoto[]; suite_prices: SuitePrice[] })[]
}

export default async function MotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('motels')
    .select(`*, suites(*, suite_photos(*), suite_prices(*))`)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) notFound()

  // Ordenar fotos e preços por position
  const motel = data as FullMotel
  motel.suites = (motel.suites ?? []).map(s => ({
    ...s,
    suite_photos: [...(s.suite_photos ?? [])].sort((a, b) => a.position - b.position),
    suite_prices: [...(s.suite_prices ?? [])].sort((a, b) => a.position - b.position),
  }))

  return <MotelSite motel={motel} />
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('motels').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return {
    title: data.name,
    description: data.description,
    openGraph: { title: data.name, description: data.description },
  }
}

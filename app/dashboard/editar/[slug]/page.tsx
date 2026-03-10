import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Builder from '@/components/Builder/Builder'
import { Motel, Suite, SuitePhoto, SuitePrice } from '@/lib/types'

export default async function EditarMotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: motel } = await supabase
    .from('motels')
    .select(`*, suites(*, suite_photos(*), suite_prices(*))`)
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single()

  if (!motel) notFound()

  return <Builder mode="edit" initialData={motel as Motel & { suites: (Suite & { suite_photos: SuitePhoto[], suite_prices: SuitePrice[] })[] }} />
}

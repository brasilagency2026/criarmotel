import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const filePath = `${Date.now()}_${file.name}`
  const { data, error } = await supabase.storage.from('motel-photos').upload(filePath, file)
  if (error) {
    console.error('Supabase Storage Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const url = supabase.storage.from('motel-photos').getPublicUrl(filePath).data.publicUrl
  return NextResponse.json({ url })
}

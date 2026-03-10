import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PhotoUploader({ onUpload }: { onUpload?: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    const filePath = `${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('motel-photos').upload(filePath, file)
    setUploading(false)
    if (error) {
      setError(error.message)
    } else {
      const url = supabase.storage.from('motel-photos').getPublicUrl(filePath).data.publicUrl
      onUpload?.(url)
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Envoi...' : 'Uploader'}
      </button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </div>
  )
}

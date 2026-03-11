'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, slugify } from '@/lib/supabase'
import { MotelFormData, SuiteLocal, Motel, Suite, SuitePhoto, SuitePrice } from '@/lib/types'
import styles from './Builder.module.css'

interface BuilderProps {
  mode: 'create' | 'edit'
  initialData?: Motel & { suites: (Suite & { suite_photos: SuitePhoto[], suite_prices: SuitePrice[] })[] }
}

let localIdCounter = 0

function makeEmptySuite(): SuiteLocal {
  return {
    localId: localIdCounter++,
    name: '', description: '', services: '',
    photos: [],
    prices: [
      { period: '2h', value: '' },
      { period: '4h', value: '' },
      { period: '12h', value: '' },
      { period: 'Diária', value: '' },
    ],
  }
}

export default function Builder({ mode, initialData }: BuilderProps) {
  const router = useRouter()
  const supabase = createClient()

  // ── Form state ──────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? '')
  const [slogan, setSlogan] = useState(initialData?.slogan ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? '')
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string>(initialData?.hero_photo ?? '')

  const [suites, setSuites] = useState<SuiteLocal[]>(() => {
    if (initialData?.suites?.length) {
      return initialData.suites.map(s => ({
        localId: localIdCounter++,
        name: s.name,
        description: s.description ?? '',
        services: s.services ?? '',
        photos: (s.suite_photos ?? [])
          .sort((a, b) => a.position - b.position)
          .map(p => ({ url: p.url, preview: p.url })),
        prices: (s.suite_prices ?? [])
          .sort((a, b) => a.position - b.position)
          .map(p => ({ period: p.period, value: p.value })),
      }))
    }
    return [makeEmptySuite()]
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successUrl, setSuccessUrl] = useState('')

  // ── Hero photo ───────────────────────────────────────
  function onHeroChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroFile(file)
    setHeroPreview(URL.createObjectURL(file))
  }

  // ── Suite helpers ────────────────────────────────────
  function addSuite() { setSuites(prev => [...prev, makeEmptySuite()]) }
  function removeSuite(localId: number) { setSuites(prev => prev.filter(s => s.localId !== localId)) }

  function updateSuite(localId: number, field: keyof SuiteLocal, value: unknown) {
    setSuites(prev => prev.map(s => s.localId === localId ? { ...s, [field]: value } : s))
  }

  function addSuitePhoto(localId: number, files: FileList) {
    setSuites(prev => prev.map(s => {
      if (s.localId !== localId) return s
      const slots = 6 - s.photos.length
      const newPhotos = Array.from(files).slice(0, slots).map(f => ({
        file: f, preview: URL.createObjectURL(f),
      }))
      return { ...s, photos: [...s.photos, ...newPhotos] }
    }))
  }

  function removeSuitePhoto(localId: number, idx: number) {
    setSuites(prev => prev.map(s =>
      s.localId === localId ? { ...s, photos: s.photos.filter((_, i) => i !== idx) } : s
    ))
  }

  function addPrice(localId: number) {
    setSuites(prev => prev.map(s =>
      s.localId === localId ? { ...s, prices: [...s.prices, { period: '', value: '' }] } : s
    ))
  }

  function removePrice(localId: number, idx: number) {
    setSuites(prev => prev.map(s => {
      if (s.localId !== localId || s.prices.length <= 1) return s
      return { ...s, prices: s.prices.filter((_, i) => i !== idx) }
    }))
  }

  function updatePrice(localId: number, idx: number, field: 'period' | 'value', val: string) {
    setSuites(prev => prev.map(s => {
      if (s.localId !== localId) return s
      const prices = s.prices.map((p, i) => i === idx ? { ...p, [field]: val } : p)
      return { ...s, prices }
    }))
  }

  // ── Upload helper ────────────────────────────────────
  async function uploadFile(file: File, path: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file, path)
    const res = await fetch('/api/photos', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || 'Erreur upload photo')
    }
    const { url } = await res.json()
    return url
  }

  // ── Save ─────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim() || !description.trim() || !address.trim() || !phone.trim()) {
      setError('Preencha no mínimo: Nome, Descrição, Endereço e Telefone.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('USER:', user) // DEBUG RLS
      if (!user) throw new Error('Não autenticado')

      const slug = initialData?.slug ?? slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

      // Upload hero photo
      let heroUrl = initialData?.hero_photo ?? ''
      if (heroFile) heroUrl = await uploadFile(heroFile, `${slug}/hero-${Date.now()}`)

      // Upsert motel
      const motelPayload = { user_id: user.id, slug, name, slogan, description, address, phone, whatsapp, hero_photo: heroUrl, published: true }
      const { data: savedMotel, error: motelErr } = initialData
        ? await supabase.from('motels').update(motelPayload).eq('id', initialData.id).select().single()
        : await supabase.from('motels').insert(motelPayload).select().single()
      if (motelErr) throw motelErr

      // Delete old suites if editing (cascade deletes photos/prices)
      if (initialData) {
        await supabase.from('suites').delete().eq('motel_id', savedMotel.id)
      }

      // Insert suites
      for (let si = 0; si < suites.length; si++) {
        const s = suites[si]
        const { data: savedSuite, error: suiteErr } = await supabase
          .from('suites')
          .insert({ motel_id: savedMotel.id, name: s.name, description: s.description, services: s.services, position: si, user_id: user.id })
          .select().single()
        if (suiteErr) throw suiteErr

        // Upload photos
        for (let pi = 0; pi < s.photos.length; pi++) {
          const photo = s.photos[pi]
          let photoUrl = photo.url ?? ''
          if (photo.file) photoUrl = await uploadFile(photo.file, `${slug}/suite-${si}-photo-${pi}-${Date.now()}`)
          if (photoUrl) {
            console.log('INSERT suite_photos:', { suite_id: savedSuite.id, url: photoUrl, position: pi, user_id: user.id }) // DEBUG
            await supabase.from('suite_photos').insert({ suite_id: savedSuite.id, url: photoUrl, position: pi, user_id: user.id })
          }
        }

        // Insert prices
        const validPrices = s.prices.filter(p => p.period && p.value)
        for (let pri = 0; pri < validPrices.length; pri++) {
          await supabase.from('suite_prices').insert({
            suite_id: savedSuite.id, period: validPrices[pri].period, value: validPrices[pri].value, position: pri, user_id: user.id,
          })
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      setSuccessUrl(`${appUrl}/moteis/${slug}`)
      router.refresh()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────
  if (successUrl) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>Site {mode === 'create' ? 'criado' : 'atualizado'} com sucesso!</h2>
          <p>Seu site está disponível em:</p>
          <a href={successUrl} target="_blank" className={styles.successLink}>{successUrl}</a>
          <div className={styles.successActions}>
            <a href={successUrl} target="_blank" className={styles.btnPrimary}>👁 Ver o site</a>
            <button onClick={() => router.push('/dashboard')} className={styles.btnSecondary}>← Voltar ao painel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>← Painel</button>
        <div className={styles.headerTitle}>
          {mode === 'create' ? '✦ Novo Motel' : `✦ Editar — ${initialData?.name}`}
        </div>
        <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
          {saving ? 'Salvando...' : mode === 'create' ? '✦ Publicar site' : '✦ Salvar alterações'}
        </button>
      </header>

      <div className={styles.content}>

        {/* Informações do motel */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🏨 Informações do Motel</h2>
          <p className={styles.cardHint}>Dados principais que aparecerão no site.</p>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Nome do motel *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Motel Paraíso" maxLength={60} />
            </div>
            <div className={styles.field}>
              <label>Slogan (opcional)</label>
              <input value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ex: O requinte no coração da cidade" maxLength={80} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Descrição *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva seu motel..." rows={3} />
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Endereço *</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Av. Paulista, 1234 – São Paulo, SP" />
            </div>
            <div className={styles.field}>
              <label>Telefone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" type="tel" />
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>WhatsApp</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" type="tel" />
            </div>
            <div className={styles.field}>
              <label>Foto principal</label>
              <label className={styles.fileBtn}>
                📷 {heroFile ? heroFile.name : 'Escolher foto'}
                <input type="file" accept="image/*" onChange={onHeroChange} style={{ display: 'none' }} />
              </label>
              {heroPreview && <img src={heroPreview} alt="preview" className={styles.heroPreview} />}
            </div>
          </div>
        </div>

        {/* Suítes */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🛏️ Suítes &amp; Quartos</h2>
          <p className={styles.cardHint}>Adicione quantas suítes quiser.</p>

          {suites.map((suite, si) => (
            <SuiteEditor
              key={suite.localId}
              suite={suite}
              index={si}
              onUpdate={(field, val) => updateSuite(suite.localId, field, val)}
              onRemove={() => removeSuite(suite.localId)}
              onAddPhoto={files => addSuitePhoto(suite.localId, files)}
              onRemovePhoto={idx => removeSuitePhoto(suite.localId, idx)}
              onAddPrice={() => addPrice(suite.localId)}
              onRemovePrice={idx => removePrice(suite.localId, idx)}
              onUpdatePrice={(idx, field, val) => updatePrice(suite.localId, idx, field, val)}
            />
          ))}

          <button onClick={addSuite} className={styles.btnAddSuite}>＋ Adicionar suíte / quarto</button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <button onClick={handleSave} disabled={saving} className={styles.btnGenerate}>
          {saving ? 'Salvando e publicando...' : mode === 'create' ? '✦ Publicar site' : '✦ Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

// ── SuiteEditor sub-component ────────────────────────────────
interface SuiteEditorProps {
  suite: SuiteLocal
  index: number
  onUpdate: (field: keyof SuiteLocal, val: unknown) => void
  onRemove: () => void
  onAddPhoto: (files: FileList) => void
  onRemovePhoto: (idx: number) => void
  onAddPrice: () => void
  onRemovePrice: (idx: number) => void
  onUpdatePrice: (idx: number, field: 'period' | 'value', val: string) => void
}

function SuiteEditor({ suite, index, onUpdate, onRemove, onAddPhoto, onRemovePhoto, onAddPrice, onRemovePrice, onUpdatePrice }: SuiteEditorProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className={styles.suiteCard}>
      <div className={styles.suiteHead} onClick={() => setOpen(o => !o)}>
        <span>🛏 {suite.name || `Suíte ${index + 1}`}</span>
        <div className={styles.suiteHeadActions}>
          <span className={styles.toggleArrow}>{open ? '▲' : '▼'}</span>
          <button onClick={e => { e.stopPropagation(); onRemove() }} className={styles.btnRemoveSuite}>🗑 Remover</button>
        </div>
      </div>

      {open && (
        <div className={styles.suiteBody}>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Nome da suíte *</label>
              <input value={suite.name} placeholder="Ex: Suíte Luxo" maxLength={60}
                onChange={e => onUpdate('name', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Descrição curta</label>
              <input value={suite.description} placeholder="Ex: Suíte ampla com hidromassagem" maxLength={100}
                onChange={e => onUpdate('description', e.target.value)} />
            </div>
          </div>

          {/* Fotos */}
          <div className={styles.photosZone}>
            <label className={styles.uploadBtn}>
              📷 Adicionar fotos
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => e.target.files && onAddPhoto(e.target.files)} />
            </label>
            <span className={styles.photoCount}>{suite.photos.length}/6 foto(s) • A primeira é a capa</span>
            {suite.photos.length > 0 && (
              <div className={styles.photosPreview}>
                {suite.photos.map((p, i) => (
                  <div key={i} className={styles.photoThumb}>
                    <img src={p.preview} alt="" />
                    <button onClick={() => onRemovePhoto(i)} className={styles.removePhoto}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div className={styles.field}>
            <label>Serviços inclusos</label>
            <textarea value={suite.services} rows={2}
              placeholder="Ex: Wi-Fi, Ar-condicionado, Hidromassagem, TV a cabo, Frigobar..."
              onChange={e => onUpdate('services', e.target.value)} />
            <span className={styles.fieldHint}>Separe os serviços por vírgula</span>
          </div>

          {/* Tarifas */}
          <div className={styles.field}>
            <label>Tarifas por período</label>
            <div className={styles.pricesList}>
              {suite.prices.map((p, i) => (
                <div key={i} className={styles.priceRow}>
                  <input value={p.period} placeholder="Ex: 2h, Pernoite…"
                    onChange={e => onUpdatePrice(i, 'period', e.target.value)} />
                  <span className={styles.priceSep}>R$</span>
                  <input value={p.value} placeholder="0,00"
                    onChange={e => onUpdatePrice(i, 'value', e.target.value)} />
                  <button onClick={() => onRemovePrice(i)} className={styles.btnRemovePrice}
                    disabled={suite.prices.length <= 1}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={onAddPrice} className={styles.btnAddPrice}>＋ Adicionar período</button>
          </div>
        </div>
      )}
    </div>
  )
}

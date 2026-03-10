export interface Motel {
  id: string
  user_id: string
  slug: string
  name: string
  slogan?: string
  description: string
  address: string
  phone: string
  whatsapp?: string
  hero_photo?: string
  published: boolean
  created_at: string
  updated_at: string
  suites?: Suite[]
}

export interface Suite {
  id: string
  motel_id: string
  name: string
  description?: string
  services?: string
  position: number
  photos?: SuitePhoto[]
  prices?: SuitePrice[]
  suite_photos?: SuitePhoto[]
  suite_prices?: SuitePrice[]
}

export interface SuitePhoto {
  id: string
  suite_id: string
  url: string
  position: number
}

export interface SuitePrice {
  id: string
  suite_id: string
  period: string
  value: string
  position: number
}

// Usado no Builder antes de salvar
export interface SuiteLocal {
  localId: number
  name: string
  description: string
  services: string
  photos: { file?: File; url?: string; preview: string }[]
  prices: { period: string; value: string }[]
}

export interface MotelFormData {
  name: string
  slogan: string
  description: string
  address: string
  phone: string
  whatsapp: string
  heroFile?: File | null
  suites: SuiteLocal[]
}

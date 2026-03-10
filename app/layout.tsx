import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Criador de Site para Motel',
  description: 'Crie o site do seu motel em minutos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setError('✅ Conta criada! Verifique seu e-mail para confirmar.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.badge}>✦ Motel Builder</div>
        <h1 className={styles.title}>
          {isSignup ? 'Criar conta' : 'Entrar'}
        </h1>
        <p className={styles.sub}>
          {isSignup
            ? 'Crie sua conta para gerenciar o site do seu motel'
            : 'Acesse o painel de gerenciamento'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>E-mail</label>
            <input
              type="email" value={email} required
              placeholder="seu@email.com"
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Senha</label>
            <input
              type="password" value={password} required
              placeholder="••••••••" minLength={6}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className={error.startsWith('✅') ? styles.success : styles.error}>
              {error}
            </div>
          )}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Aguarde...' : isSignup ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isSignup ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
          <button onClick={() => { setIsSignup(!isSignup); setError('') }}>
            {isSignup ? 'Fazer login' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  )
}

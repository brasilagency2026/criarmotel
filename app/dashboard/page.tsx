import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Motel } from '@/lib/types'
import styles from './dashboard.module.css'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: motels } = await supabase
    .from('motels')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>✦ Motel Builder</div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{user.email}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className={styles.logoutBtn}>Sair</button>
          </form>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.title}>Meus Motéis</h1>
            <p className={styles.sub}>Gerencie os sites dos seus estabelecimentos</p>
          </div>
          <Link href="/dashboard/novo" className={styles.btnNew}>
            ＋ Novo motel
          </Link>
        </div>

        {(!motels || motels.length === 0) ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏨</div>
            <h2>Nenhum motel ainda</h2>
            <p>Crie o primeiro site do seu motel em poucos minutos.</p>
            <Link href="/dashboard/novo" className={styles.btnNew}>
              ＋ Criar meu primeiro motel
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {(motels as Motel[]).map(motel => (
              <div key={motel.id} className={styles.motelCard}>
                {motel.hero_photo && (
                  <div className={styles.motelThumb}>
                    <img src={motel.hero_photo} alt={motel.name} />
                  </div>
                )}
                <div className={styles.motelInfo}>
                  <h3>{motel.name}</h3>
                  <p className={styles.motelAddr}>{motel.address}</p>
                  <div className={styles.motelSlug}>
                    🔗 {motel.slug}.vercel.app
                  </div>
                </div>
                <div className={styles.motelActions}>
                  <Link href={`/dashboard/editar/${motel.slug}`} className={styles.btnEdit}>
                    ✏️ Editar
                  </Link>
                  <Link
                    href={`${process.env.NEXT_PUBLIC_APP_URL}/moteis/${motel.slug}`}
                    target="_blank"
                    className={styles.btnView}
                  >
                    👁 Ver site
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

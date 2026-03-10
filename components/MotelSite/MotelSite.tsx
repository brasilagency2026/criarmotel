'use client'
import { useState } from 'react'
import { Motel, Suite, SuitePhoto, SuitePrice } from '@/lib/types'
import styles from './MotelSite.module.css'

type FullSuite = Suite & { suite_photos: SuitePhoto[]; suite_prices: SuitePrice[] }
type FullMotel = Motel & { suites: FullSuite[] }

export default function MotelSite({ motel }: { motel: FullMotel }) {
  const waClean = (motel.whatsapp ?? '').replace(/\D/g, '')

  return (
    <div className={styles.site}>
      {/* HERO */}
      <section className={styles.hero} id="inicio">
        <nav className={styles.nav}>
          <div className={styles.brand}>{motel.name}</div>
          <ul className={styles.navLinks}>
            <li><a href="#inicio">Início</a></li>
            <li><a href="#suites">Suítes</a></li>
            <li><a href="#contato">Contato</a></li>
          </ul>
        </nav>
        {motel.hero_photo && (
          <img src={motel.hero_photo} alt={motel.name} className={styles.heroBg} />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.tag}>✦ Bem-vindo(a)</div>
          <h1>{motel.name}</h1>
          <p>{motel.slogan || motel.description}</p>
          <div className={styles.heroCtas}>
            <a href="#suites" className={styles.ctaPrimary}>🛏 Ver as suítes</a>
            <a href="#contato" className={styles.ctaSecondary}>📞 Fale conosco</a>
          </div>
        </div>
      </section>

      {/* SUÍTES */}
      {motel.suites.length > 0 && (
        <>
          <section id="suites">
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Nossas acomodações</div>
              <div className={styles.sectionTitle}>Suítes &amp; Quartos</div>
              <p className={styles.sectionSub}>Cada espaço foi pensado para o seu conforto e privacidade.</p>
              <div className={styles.suitesGrid}>
                {motel.suites.map((suite, i) => (
                  <SuiteCard key={suite.id} suite={suite} waClean={waClean} index={i} />
                ))}
              </div>
            </div>
          </section>
          <div className={styles.divider} />
        </>
      )}

      {/* CONTATO */}
      <section id="contato">
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Sobre nós</div>
          <div className={styles.sectionTitle}>Conheça o motel</div>
          <div className={styles.infoGrid}>
            <p className={styles.infoText}>{motel.description}</p>
            <div className={styles.contactCard}>
              <h4>Entre em contato</h4>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📍</div>
                <div>
                  <div className={styles.contactLabel}>Endereço</div>
                  <div className={styles.contactValue}>{motel.address}</div>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📞</div>
                <div>
                  <div className={styles.contactLabel}>Telefone</div>
                  <div className={styles.contactValue}>
                    <a href={`tel:${motel.phone}`}>{motel.phone}</a>
                  </div>
                </div>
              </div>
              {motel.whatsapp && (
                <div className={styles.contactItem}>
                  <div className={styles.contactIcon}>💬</div>
                  <div>
                    <div className={styles.contactLabel}>WhatsApp</div>
                    <div className={styles.contactValue}>{motel.whatsapp}</div>
                  </div>
                </div>
              )}
              {motel.whatsapp ? (
                <a
                  className={styles.waBtn}
                  href={`https://wa.me/${waClean}?text=${encodeURIComponent('Olá, gostaria de fazer uma reserva.')}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <WaIcon /> Reservar pelo WhatsApp
                </a>
              ) : (
                <a href={`tel:${motel.phone}`} className={styles.waBtn} style={{ background: '#3a7bd5' }}>
                  📞 Ligar agora
                </a>
              )}
              <a
                className={styles.mapsBtn}
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(motel.address)}`}
                target="_blank" rel="noopener noreferrer"
              >
                <NavIcon /> Como chegar — Google Maps
              </a>
            </div>
          </div>

          {/* Mapa embed */}
          <div className={styles.mapEmbed}>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(motel.address)}&output=embed&z=16`}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Localização do ${motel.name}`}
            />
          </div>
        </div>
      </section>

      <div className={styles.divider} />
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} <strong>{motel.name}</strong> &nbsp;·&nbsp; {motel.address}</p>
      </footer>
    </div>
  )
}

// ── SuiteCard ────────────────────────────────────────────────
function SuiteCard({ suite, waClean, index }: { suite: FullSuite; waClean: string; index: number }) {
  const [current, setCurrent] = useState(0)
  const photos = suite.suite_photos
  const prices = suite.suite_prices

  function prev() { setCurrent(c => (c - 1 + photos.length) % photos.length) }
  function next() { setCurrent(c => (c + 1) % photos.length) }

  const tags = (suite.services ?? '').split(/[,\n]+/).map(s => s.trim()).filter(Boolean)

  return (
    <div className={styles.suiteCard}>
      {/* Slider */}
      <div className={styles.slider}>
        {photos.length === 0 ? (
          <div className={styles.sliderPlaceholder}>🛏</div>
        ) : (
          <>
            <div className={styles.slides} style={{ transform: `translateX(-${current * 100}%)` }}>
              {photos.map((p, i) => (
                <div key={i} className={styles.slide}>
                  <img src={p.url} alt={`${suite.name} foto ${i + 1}`} />
                </div>
              ))}
            </div>
            {photos.length > 1 && (
              <>
                <button onClick={prev} className={`${styles.sliderBtn} ${styles.prev}`}>‹</button>
                <button onClick={next} className={`${styles.sliderBtn} ${styles.next}`}>›</button>
                <div className={styles.dots}>
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`${styles.dot} ${i === current ? styles.dotActive : ''}`} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className={styles.suiteInfo}>
        <h3>{suite.name}</h3>
        {suite.description && <p className={styles.suiteDesc}>{suite.description}</p>}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((t, i) => <span key={i} className={styles.tag2}>{t}</span>)}
          </div>
        )}
        {prices.length > 0 && (
          <div className={styles.prices}>
            {prices.map((p, i) => (
              <div key={i} className={styles.priceItem}>
                <div className={styles.pricePeriod}>{p.period}</div>
                <div className={styles.priceAmount}>R$ {p.value}</div>
              </div>
            ))}
          </div>
        )}
        {waClean && (
          <a
            className={styles.waBtn}
            href={`https://wa.me/${waClean}?text=${encodeURIComponent(`Olá! Tenho interesse na ${suite.name}`)}`}
            target="_blank" rel="noopener noreferrer"
          >
            <WaIcon /> Reservar pelo WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}

function WaIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.456.668 4.758 1.83 6.744L2 30l7.46-1.797A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.54 11.54 0 0 1-5.88-1.61l-.42-.25-4.43 1.067 1.1-4.31-.274-.44A11.56 11.56 0 0 1 4.4 16C4.4 9.592 9.592 4.4 16 4.4S27.6 9.592 27.6 16 22.408 27.6 16 27.6zm6.33-8.7c-.347-.174-2.056-1.014-2.375-1.13-.318-.113-.55-.174-.78.174s-.896 1.13-1.1 1.36-.405.26-.752.086c-.347-.174-1.463-.54-2.787-1.72-1.03-.918-1.726-2.05-1.93-2.396-.2-.347-.02-.534.152-.706.155-.155.347-.405.52-.607.174-.2.23-.347.347-.578.115-.23.057-.433-.03-.607-.086-.174-.78-1.88-1.07-2.574-.28-.676-.564-.584-.78-.596-.2-.01-.433-.01-.665-.01s-.607.087-.924.433c-.318.347-1.213 1.186-1.213 2.892s1.242 3.354 1.415 3.584c.174.23 2.445 3.73 5.926 5.232.828.358 1.475.571 1.98.73.83.264 1.586.226 2.183.137.666-.1 2.056-.84 2.347-1.65.29-.81.29-1.504.203-1.65-.086-.145-.318-.232-.665-.405z"/>
    </svg>
  )
}

function NavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  )
}

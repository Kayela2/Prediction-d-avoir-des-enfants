import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, BarChart2, ShieldCheck, Globe, Sparkles, CheckCircle, Users, Database, Target } from 'lucide-react'

const fadeUp  = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } } satisfies import('framer-motion').Variants
const stagger = { show: { transition: { staggerChildren: 0.1 } } } satisfies import('framer-motion').Variants

const features = [
  { icon: BarChart2,   c:'#6366F1', bg:'#EEF2FF', title:'Simulation en temps réel',   desc:'Résultat immédiat basé sur vos paramètres de vie actuels.' },
  { icon: ShieldCheck, c:'#10B981', bg:'#ECFDF5', title:'Données anonymisées',        desc:'Aucune donnée personnelle transmise. Traitement local uniquement.' },
  { icon: Globe,       c:'#F59E0B', bg:'#FFFBEB', title:'Ancrage camerounais',        desc:'Basé sur l\'Enquête EDSC-V 2018 — l\'enquête nationale de référence.' },
  { icon: Sparkles,    c:'#8B5CF6', bg:'#F5F3FF', title:'Modèle IA de précision',     desc:'150 000+ profils de femmes camerounaises pour entraîner le modèle.' },
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════ NAVBAR */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(7,11,24,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => nav('/')}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.55)', fontSize: 19 }}>🔗</div>
            <span style={{ fontWeight: 800, fontSize: 19, color: 'white', letterSpacing: '-0.03em' }}>Hearth</span>
          </div>
          <nav className="nav-links" style={{ display: 'flex', gap: 30, flex: 1 }}>
            {[
              { label: 'Produit',       id: 'produit' },
              { label: 'Données',       id: 'donnees' },
              { label: 'Méthodologie',  id: 'methodologie' },
              { label: 'À propos',      id: 'apropos' },
            ].map(({ label, id }) => (
              <span key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseOver={e=>(e.currentTarget.style.color='white')}
                onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                {label}
              </span>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button onClick={() => nav('/login')} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontFamily: 'inherit' }}>
              Connexion
            </button>
            <button onClick={() => nav('/simulation')} style={{ padding: '9px 22px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}>
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════ HERO — screen.png */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Background: screen.png */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/screen.png)',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
        }} />
        {/* Gradient overlay: dark on left, transparent on right */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(7,11,24,0.97) 0%, rgba(7,11,24,0.92) 45%, rgba(7,11,24,0.55) 70%, rgba(7,11,24,0.2) 100%)' }} />
        {/* Indigo tint at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300, background: 'linear-gradient(to bottom, rgba(99,102,241,0.15) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Content */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 80px', width: '100%', position: 'relative', zIndex: 2 }}>
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 600 }}>

            <motion.div variants={fadeUp}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.45)', color: '#A5B4FC', padding: '7px 18px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 28 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', boxShadow: '0 0 10px #6366F1', display: 'inline-block' }} />
                EDSC-V 2018 · INS Cameroun
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(38px,5vw,66px)', fontWeight: 900, color: 'white', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 22 }}>
              Dessinez<br />
              <span style={{ background: 'linear-gradient(135deg,#818CF8 0%,#C084FC 50%,#67E8F9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                l'avenir
              </span>{' '}
              de votre foyer
            </motion.h1>

            <motion.p variants={fadeUp} style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 36, maxWidth: 500 }}>
              Une application de simulation démographique pour les femmes camerounaises de <strong style={{ color: 'rgba(255,255,255,0.9)' }}>15 à 49 ans</strong>. Découvrez votre probabilité de désirer un enfant supplémentaire grâce à notre modèle d'IA.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
              <button onClick={() => nav('/simulation')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '17px 32px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 40px rgba(99,102,241,0.6)', transition: 'transform 0.2s,box-shadow 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 48px rgba(99,102,241,0.75)' }}
                onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 40px rgba(99,102,241,0.6)' }}>
                Démarrer l'aventure <ArrowRight size={18} />
              </button>
              <button onClick={() => nav('/login')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '17px 28px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}>
                Voir une démo
              </button>
            </motion.div>

            {/* Trust row */}
            <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {[{ v:'150 000+', l:'Femmes analysées' }, { v:'98.4%', l:'Précision' }, { v:'5', l:'Facteurs clés' }].map(({ v, l }) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>{v}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{l}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Floating glassmorphism card (bottom right) */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as never }}
          className="hero-float-card"
          style={{ position: 'absolute', bottom: 60, right: '8%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 22, padding: '22px 24px', minWidth: 240, zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Simulation EDSC-V</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Résultat personnalisé</p>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Score de confiance</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#A5B4FC' }}>84%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ delay: 1.5, duration: 1.2 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#6366F1,#C084FC)', borderRadius: 99 }} />
            </div>
          </div>
          {['Milieu Urbain','Master II','2 enfants'].map(t => (
            <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginRight: 6, marginTop: 6 }}>
              <CheckCircle size={10} color="#4ADE80" />{t}
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', zIndex: 3 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Découvrir</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom,rgba(255,255,255,0.3),transparent)' }} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════ PARCOURS UTILISATEUR */}
      <section id="methodologie" style={{ background: '#0F172A', padding: '100px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 12, color: '#6366F1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>COMMENT ÇA MARCHE</p>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 14 }}>Un parcours guidé de bout en bout</h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                De la découverte à votre projection personnalisée, Hearth vous accompagne à chaque étape.
              </p>
            </motion.div>

            <div style={{ position: 'relative' }}>
              {/* Connecting line */}
              <div className="journey-line" style={{ position: 'absolute', top: 36, left: '6%', right: '6%', height: 2, background: 'linear-gradient(90deg,#6366F1,#8B5CF6,#06B6D4,#10B981,#F59E0B)', opacity: 0.3 }} />

              <div className="journey-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, position: 'relative', zIndex: 1 }}>
                {[
                  { n:'01', emoji:'🌐', title:'Découverte', desc:'Apprenez comment Hearth utilise les données EDSC-V pour votre simulation.', color:'#6366F1' },
                  { n:'02', emoji:'🔐', title:'Connexion', desc:'Créez un compte ou lancez une simulation anonyme en 30 secondes.', color:'#8B5CF6' },
                  { n:'03', emoji:'📋', title:'Profil', desc:'Renseignez vos 5 paramètres : âge, résidence, instruction, enfants, revenu.', color:'#06B6D4' },
                  { n:'04', emoji:'🔮', title:'Analyse IA', desc:'Notre modèle calcule votre probabilité sur 150 000+ profils de référence.', color:'#10B981' },
                  { n:'05', emoji:'📊', title:'Résultats', desc:'Visualisez votre score, les facteurs clés et les projections futures.', color:'#F59E0B' },
                ].map(({ n, emoji, title, desc, color }) => (
                  <motion.div key={n} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20, boxShadow: `0 0 20px ${color}20` }}>
                      {emoji}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>ÉTAPE {n}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 8 }}>{title}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════ FEATURES */}
      <section id="produit" style={{ background: '#070B18', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>FONCTIONNALITÉS</p>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 14 }}>L'intelligence au service du foyer</h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }} className="feat-grid">
              {features.map(({ icon: Icon, c, bg, title, desc }) => (
                <motion.div key={title} variants={fadeUp}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 32, cursor: 'default', transition: 'border-color 0.2s,background 0.2s' }}
                  onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${c}55`; el.style.background = `${c}0A` }}
                  onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.background = 'rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 54, height: 54, background: bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color={c} />
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: 'white', marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════ STATS */}
      <section id="donnees" style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }} className="stats-grid">
          {[
            { icon: Database, v:'150 000+', l:'Entrées EDSC-V 2018',   c:'#6366F1' },
            { icon: Globe,    v:'24',        l:'Régions du Cameroun',  c:'#10B981' },
            { icon: Target,   v:'98.4 %',    l:'Précision du modèle',  c:'#F59E0B' },
            { icon: Users,    v:'5',         l:'Facteurs prédictifs',  c:'#8B5CF6' },
          ].map(({ icon: Icon, v, l, c }) => (
            <motion.div key={l} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
              style={{ textAlign:'center' }}>
              <div style={{ width: 48, height: 48, background: `${c}18`, border:`1px solid ${c}30`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Icon size={22} color={c} />
              </div>
              <p style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 4 }}>{v}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════ CTA */}
      <section id="apropos" style={{ background: '#070B18', padding: '100px 24px' }}>
        <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
          style={{ maxWidth: 900, margin: '0 auto', position:'relative', overflow:'hidden', borderRadius:32, padding:'80px 48px', textAlign:'center', background:'linear-gradient(135deg,#1E1B4B 0%,#312E81 40%,#4F46E5 100%)', boxShadow:'0 0 100px rgba(99,102,241,0.4)' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <span style={{ display:'inline-block', fontSize:13, color:'rgba(255,255,255,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:20, background:'rgba(255,255,255,0.1)', padding:'6px 16px', borderRadius:999 }}>PRÊTE À COMMENCER ?</span>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 18, lineHeight: 1.1 }}>
              Prêt à anticiper<br />demain ?
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
              Lancez votre première simulation en moins de 2 minutes.<br />Aucune inscription requise.
            </p>
            <button onClick={() => nav('/simulation')}
              style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'18px 44px', background:'white', color:'#4F46E5', border:'none', borderRadius:999, fontSize:17, fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 32px rgba(0,0,0,0.25)', transition:'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
              Démarrer gratuitement <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════ FOOTER */}
      <footer style={{ background: '#020408', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'rgba(99,102,241,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔗</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>Hearth</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            © 2024 Hearth · EDSC-V 2018 · INS Cameroun · Thèse Master 1
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Confidentialité','Conditions','Contact'].map(l => (
              <span key={l} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 500 }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media(max-width:768px){
          .nav-links,.hero-float-card{display:none!important;}
          .feat-grid,.journey-grid,.stats-grid{grid-template-columns:1fr!important;}
          .journey-line{display:none!important;}
        }
      `}</style>
    </div>
  )
}

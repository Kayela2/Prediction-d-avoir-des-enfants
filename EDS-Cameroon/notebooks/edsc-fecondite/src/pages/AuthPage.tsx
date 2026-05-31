import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'

const fadeUp = { hidden:{opacity:0,y:24}, show:{opacity:1,y:0,transition:{duration:0.5,ease:'easeOut'}} } satisfies import('framer-motion').Variants
const stagger = { show:{transition:{staggerChildren:0.08}} } satisfies import('framer-motion').Variants

const BENEFITS = [
  'Simulez en 2 minutes sans compte',
  'Basé sur 150 000+ profils EDSC-V 2018',
  'Résultats sauvegardés et accessibles',
  'Interface adaptée au contexte camerounais',
]

export default function AuthPage() {
  const nav = useNavigate()
  const { login, register, authLoading, authError, setAuthError } = useStore()

  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: { preventDefault():void }) {
    e.preventDefault()
    setAuthError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      setSuccess(true)
      setTimeout(() => nav('/dashboard'), 1200)
    } catch {
      // authError est déjà mis à jour dans le store
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left panel (image + benefits) ── */}
      <div className="auth-left" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '48px' }}>
        {/* Background = screen.png */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/screen.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,11,24,0.96) 0%, rgba(7,11,24,0.7) 50%, rgba(7,11,24,0.3) 100%)' }} />
        {/* Logo */}
        <div style={{ position: 'absolute', top: 36, left: 36, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>🔗</div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Hearth</span>
        </div>
        {/* Bottom content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.15 }}>
            Construisez votre<br />
            <span style={{ background: 'linear-gradient(135deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>vision familiale</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 28, lineHeight: 1.65 }}>
            Une application basée sur les données démographiques officielles du Cameroun.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BENEFITS.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={12} color="#A5B4FC" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>🇨🇲 EDSC-V 2018 · INS Cameroun · Thèse Master 1</span>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{ width: '100%', maxWidth: 520, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto', position: 'relative' }}>

        {/* Bouton retour */}
        <button onClick={() => nav('/')}
          style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A' }}
          onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}>
          <ArrowLeft size={14} /> Accueil
        </button>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 32 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '11px', borderRadius: 11, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0F172A' : '#64748B', boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                {m === 'login' ? 'Se connecter' : 'S\'inscrire'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity:0, x:mode==='login'?-20:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
                    {mode === 'login' ? 'Bon retour ! 👋' : 'Rejoignez Hearth ✨'}
                  </h1>
                  <p style={{ fontSize: 14, color: '#64748B', marginBottom: 28, lineHeight: 1.6 }}>
                    {mode === 'login' ? 'Accédez à vos simulations et votre historique.' : 'Créez votre compte et lancez votre première simulation.'}
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit}>
                  {mode === 'register' && (
                    <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nom complet</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Marie Nguema" value={name} onChange={e => setName(e.target.value)}
                          style={{ width: '100%', padding: '13px 14px 13px 42px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', transition: 'border 0.15s' }}
                          onFocus={e=>(e.target.style.borderColor='#6366F1')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
                      </div>
                    </motion.div>
                  )}

                  <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Adresse e-mail</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required
                        style={{ width: '100%', padding: '13px 14px 13px 42px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', transition: 'border 0.15s' }}
                        onFocus={e=>(e.target.style.borderColor='#6366F1')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                      {mode === 'login' && <button type="button" style={{ background: 'none', border: 'none', fontSize: 12, color: '#6366F1', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Mot de passe oublié ?</button>}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                        style={{ width: '100%', padding: '13px 44px 13px 42px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', transition: 'border 0.15s' }}
                        onFocus={e=>(e.target.style.borderColor='#6366F1')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
                      <button type="button" onClick={() => setShowPwd(v=>!v)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                        {showPwd ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Message d'erreur */}
                  {authError && (
                    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, marginBottom:16 }}>
                      <AlertCircle size={15} color="#EF4444" style={{flexShrink:0}}/>
                      <span style={{ fontSize:13, color:'#B91C1C', fontWeight:500 }}>{authError}</span>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button variants={fadeUp} type="submit" disabled={authLoading || success}
                    style={{ width: '100%', padding: '15px', background: success ? '#10B981' : authLoading ? '#A5B4FC' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: authLoading||success ? 'not-allowed':'pointer', fontFamily: 'inherit', boxShadow: success ? '0 4px 20px rgba(16,185,129,0.4)' : authLoading ? 'none' : '0 6px 24px rgba(99,102,241,0.45)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    {success ? <><CheckCircle size={18} /> Redirection…</> : authLoading ? <><Spinner /> Chargement…</> : <>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <ArrowRight size={16} /></>}
                  </motion.button>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>ou continuer avec</span>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[{ label:'Google', icon:'🔵' }, { label:'Apple', icon:'🍎' }].map(({ label, icon }) => (
                      <button key={label} type="button"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                        onMouseOver={e=>(e.currentTarget.style.background='#F3F4F6')} onMouseOut={e=>(e.currentTarget.style.background='#F9FAFB')}>
                        <span>{icon}</span>{label}
                      </button>
                    ))}
                  </div>
                </form>

                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => nav('/simulation')}
                    style={{ background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Continuer sans compte →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media(max-width:768px) { .auth-left { display:none!important; } }
      `}</style>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

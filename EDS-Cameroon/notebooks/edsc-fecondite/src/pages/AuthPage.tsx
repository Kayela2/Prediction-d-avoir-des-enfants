import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle, ArrowLeft, Heart } from 'lucide-react'
import { useStore } from '../store/useStore'
import { api } from '../lib/api'
import Button from '../components/ui/Button'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.39.07 2.36.74 3.17.8 1.21-.24 2.37-.93 3.67-.84 1.58.13 2.77.71 3.55 1.84-3.25 1.94-2.49 5.9.48 7.06-.57 1.52-1.32 3.01-2.87 4zm-3.22-17.6c.06 2.28-1.79 4.16-3.89 3.99-.27-2.08 1.68-4.09 3.89-3.99z" fill="#000"/>
    </svg>
  )
}

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

  // Inscription mise en avant par défaut pour les nouveaux utilisateurs
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [sexe, setSexe] = useState<'homme'|'femme'|null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [success, setSuccess] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string|null>(null)

  async function handleSubmit(e: { preventDefault():void }) {
    e.preventDefault()
    setAuthError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password, sexe ?? undefined)
      }
      setSuccess(true)
      // Si des données de simulation ont été saisies avant connexion, on y retourne
      // pour restaurer et relancer automatiquement la prédiction.
      const dest = localStorage.getItem('hearth_pending_sim') ? '/simulation' : '/dashboard'
      setTimeout(() => nav(dest), 1200)
    } catch {
      // authError est déjà mis à jour dans le store
    }
  }

  async function handleForgot(e: { preventDefault():void }) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setForgotSent(true)
    } catch {
      setForgotError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setForgotLoading(false)
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
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}><Heart size={19} color="white" strokeWidth={2.5} /></div>
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
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>🇨🇲 EDSC-V 2018 · INS Cameroun</span>
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

          {/* Tab switcher — caché en mode forgot */}
          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 32 }}>
              {(['register','login'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex: 1, padding: '11px', borderRadius: 11, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: mode === m ? 'white' : 'transparent', color: mode === m ? '#0F172A' : '#64748B', boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                  {m === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity:0, x: mode==='forgot' ? 0 : mode==='login'?-20:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}>

            {/* ── Vue Mot de passe oublié ── */}
            {mode === 'forgot' && (
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <button onClick={() => { setMode('login'); setForgotSent(false); setForgotError(null) }}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#6366F1', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginBottom:20, padding:0 }}>
                    <ArrowLeft size={14}/> Retour à la connexion
                  </button>
                  <h1 style={{ fontSize:26, fontWeight:900, color:'#0F172A', letterSpacing:'-0.03em', marginBottom:6 }}>Mot de passe oublié 🔑</h1>
                  <p style={{ fontSize:14, color:'#64748B', marginBottom:28, lineHeight:1.6 }}>
                    Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </motion.div>

                {!forgotSent ? (
                  <form onSubmit={handleForgot}>
                    <motion.div variants={fadeUp} style={{ marginBottom:20 }}>
                      <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>Adresse e-mail</label>
                      <div style={{ position:'relative' }}>
                        <Mail size={16} color="#9CA3AF" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                        <input type="email" placeholder="vous@exemple.com" value={email} onChange={e=>setEmail(e.target.value)} required
                          style={{ width:'100%', padding:'13px 14px 13px 42px', background:'#F9FAFB', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, color:'#111827', fontFamily:'inherit', outline:'none', transition:'border 0.15s' }}
                          onFocus={e=>(e.target.style.borderColor='#6366F1')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/>
                      </div>
                    </motion.div>

                    {forgotError && (
                      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, marginBottom:16 }}>
                        <AlertCircle size={15} color="#EF4444" style={{flexShrink:0}}/>
                        <span style={{ fontSize:13, color:'#B91C1C', fontWeight:500 }}>{forgotError}</span>
                      </motion.div>
                    )}

                    <motion.div variants={fadeUp}>
                      <Button type="submit" size="lg" fullWidth loading={forgotLoading}
                        rightIcon={<ArrowRight size={16}/>}>
                        {forgotLoading ? 'Envoi…' : 'Envoyer le lien'}
                      </Button>
                    </motion.div>
                  </form>
                ) : (
                  <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{duration:0.4}}
                    style={{ textAlign:'center', padding:'32px 0' }}>
                    <div style={{ width:64, height:64, background:'#ECFDF5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                      <CheckCircle size={32} color="#10B981"/>
                    </div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:'#0F172A', marginBottom:10 }}>Email envoyé !</h2>
                    <p style={{ fontSize:14, color:'#64748B', lineHeight:1.6, marginBottom:28 }}>
                      Si <strong>{email}</strong> est enregistré, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez aussi vos spams.
                    </p>
                    <button onClick={() => { setMode('login'); setForgotSent(false); setEmail('') }}
                      style={{ padding:'12px 28px', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'white', border:'none', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
                      Retour à la connexion
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {mode !== 'forgot' && (
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
                    <>
                      <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nom complet</label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                          <input type="text" placeholder="Marie Nguema" value={name} onChange={e => setName(e.target.value)} required
                            style={{ width: '100%', padding: '13px 14px 13px 42px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', fontFamily: 'inherit', outline: 'none', transition: 'border 0.15s' }}
                            onFocus={e=>(e.target.style.borderColor='#6366F1')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
                        </div>
                      </motion.div>

                      <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Vous êtes</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {(['femme', 'homme'] as const).map(s => (
                            <button key={s} type="button" onClick={() => setSexe(s)}
                              style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${sexe === s ? '#6366F1' : '#E5E7EB'}`, background: sexe === s ? '#EEF2FF' : '#F9FAFB', fontSize: 14, fontWeight: sexe === s ? 700 : 500, color: sexe === s ? '#4338CA' : '#6B7280', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{s === 'femme' ? '👩' : '👨'}</span>
                              {s === 'femme' ? 'Une femme' : 'Un homme'}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
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
                      {mode === 'login' && <button type="button" onClick={() => { setMode('forgot'); setForgotSent(false); setForgotError(null) }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#6366F1', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Mot de passe oublié ?</button>}
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
                  <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
                    <Button type="submit" size="lg" fullWidth loading={authLoading} disabled={success}
                      leftIcon={success ? <CheckCircle size={18} /> : undefined}
                      rightIcon={!success && !authLoading ? <ArrowRight size={16} /> : undefined}
                      style={success ? { background: '#10B981', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' } : undefined}>
                      {success ? 'Redirection…' : authLoading ? 'Chargement…' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
                    </Button>
                  </motion.div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>ou continuer avec</span>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label:'Google', Icon: GoogleIcon },
                      { label:'Apple',  Icon: AppleIcon  },
                    ].map(({ label, Icon }) => (
                      <button key={label} type="button"
                        title={`Connexion ${label} — disponible en production`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#111827', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                        onMouseOver={e=>(e.currentTarget.style.background='#F3F4F6')} onMouseOut={e=>(e.currentTarget.style.background='#F9FAFB')}>
                        <Icon/>{label}
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
            )}
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

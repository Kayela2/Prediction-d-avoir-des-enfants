import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Clock, Sparkles, ArrowRight, BarChart2, MapPin, GraduationCap, Baby } from 'lucide-react'
import { useStore } from '../store/useStore'

const fadeUp  = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{duration:0.45,ease:'easeOut'}} } satisfies import('framer-motion').Variants
const stagger = { show:{transition:{staggerChildren:0.09}} } satisfies import('framer-motion').Variants

const statusCfg: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  completed: { label:'Complété', color:'#10B981', bg:'#ECFDF5', dot:'#34D399' },
  active:    { label:'En cours', color:'#6366F1', bg:'#EEF2FF', dot:'#818CF8' },
  archived:  { label:'Archivé',  color:'#64748B', bg:'#F1F5F9', dot:'#94A3B8' },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
}

export default function DashboardPage() {
  const nav = useNavigate()
  const { user, simulations } = useStore()

  useEffect(() => { useStore.getState().fetchSimulations() }, [])

  const avg    = Math.round(simulations.reduce((s,x) => s+(x.confidence??0),0) / (simulations.length||1))
  const latest = simulations[0]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show"
      style={{ maxWidth:1100, fontFamily:"'Inter',sans-serif", margin:'0 auto' }}>

      {/* ── Header ── */}
      <motion.div variants={fadeUp} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <p style={{ fontSize:12, color:'var(--text-faint)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>TABLEAU DE BORD</p>
          <h1 style={{ fontSize:30, fontWeight:900, color:'var(--text)', letterSpacing:'-0.03em', marginBottom:4 }}>
            {greeting()}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>Voici vos indicateurs de simulation démographique EDSC-V.</p>
        </div>
        <button onClick={() => nav('/simulation')}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'white', border:'none', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-v)' }}>
          <Plus size={16} /> Nouvelle simulation
        </button>
      </motion.div>

      {/* ── BENTO TOP ── */}
      <div className="db-top-row" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:18, marginBottom:18 }}>

        {/* Hero card */}
        <motion.div variants={fadeUp} style={{
          background:'linear-gradient(135deg,#070B18 0%,#1E1B4B 50%,#312E81 100%)',
          borderRadius:24, padding:'32px', overflow:'hidden', position:'relative',
          boxShadow:'0 16px 48px rgba(7,11,24,0.25)', minHeight:200,
        }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px', borderRadius:24, pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.4) 0%,transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'#4ADE80' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', boxShadow:'0 0 10px #4ADE80', display:'inline-block', animation:'pulse 2s infinite' }} />
                DONNÉES EDSC-V 2018
              </span>
            </div>
            <h2 style={{ fontSize:24, fontWeight:900, color:'white', letterSpacing:'-0.03em', marginBottom:8, lineHeight:1.2 }}>
              Prédiction &amp; Fécondité
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.65, marginBottom:20, maxWidth:380 }}>
              Modèle Random Forest entraîné sur 13 527 femmes camerounaises de 15 à 49 ans (EDSC-V 2018).
            </p>
            {latest && (
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
                  <motion.div initial={{width:0}} animate={{width:`${latest.confidence}%`}} transition={{duration:1.2,delay:0.4}}
                    style={{ height:'100%', background:'linear-gradient(90deg,#6366F1,#C084FC)', borderRadius:99 }} />
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:'#A5B4FC', flexShrink:0 }}>{latest.confidence}%</span>
              </div>
            )}
            <button onClick={() => nav('/simulation')}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'}
              onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
              Lancer une simulation <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* Confidence ring */}
        <motion.div variants={fadeUp} style={{ background:'white', borderRadius:24, padding:'24px', border:'1px solid var(--border)', boxShadow:'var(--shadow-xs)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>CONFIANCE MOYENNE</p>
          <ConfRing value={avg} />
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:12, lineHeight:1.5 }}>
            {simulations.length} simulation{simulations.length>1?'s':''}
          </p>
          <button onClick={() => nav('/dashboard/historique')}
            style={{ marginTop:14, padding:'8px 18px', background:'var(--primary-light)', color:'var(--primary)', border:'none', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Voir tout →
          </button>
        </motion.div>
      </div>

      {/* ── STATS ROW ── */}
      <motion.div variants={fadeUp} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:18 }} className="stat-row">
        {[
          { icon:TrendingUp, c:'#6366F1', bg:'#EEF2FF', label:'Simulations',   v:String(simulations.length), trend:'+2 ce mois' },
          { icon:Clock,      c:'#10B981', bg:'#ECFDF5', label:'Actif depuis',  v:'mai 2026',                 trend:'Depuis mai 2026' },
          { icon:Sparkles,   c:'#F59E0B', bg:'#FFFBEB', label:'Score moyen',   v:`${avg}%`,                  trend:'Indice de confiance' },
        ].map(({ icon:Icon, c, bg, label, v, trend }) => (
          <div key={label} style={{ background:'white', borderRadius:20, padding:'20px', border:'1px solid var(--border)', boxShadow:'var(--shadow-xs)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ width:40, height:40, background:bg, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={19} color={c} />
              </div>
              <span style={{ fontSize:11, color:c, background:bg, padding:'3px 8px', borderRadius:999, fontWeight:600 }}>↑</span>
            </div>
            <p style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.04em', margin:0, lineHeight:1 }}>{v}</p>
            <p style={{ fontSize:12, color:'var(--text-faint)', margin:0, marginTop:4, fontWeight:600 }}>{label}</p>
            <p style={{ fontSize:11, color:'var(--border-2)', margin:0, marginTop:2 }}>{trend}</p>
          </div>
        ))}
      </motion.div>

      {/* ── SIMULATIONS LIST ── */}
      <motion.div variants={fadeUp} style={{ background:'white', borderRadius:24, border:'1px solid var(--border)', boxShadow:'var(--shadow-xs)', marginBottom:18, overflow:'hidden' }}>
        <div style={{ padding:'22px 24px 16px', borderBottom:'1px solid #F8FAFC', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'var(--text)', margin:0 }}>Dernières simulations</h3>
            <p style={{ fontSize:12, color:'var(--text-faint)', margin:0, marginTop:2 }}>Cliquez pour accéder aux résultats détaillés</p>
          </div>
          <button onClick={() => nav('/dashboard/historique')}
            style={{ display:'flex', alignItems:'center', gap:6, background:'var(--primary-light)', border:'none', padding:'8px 16px', borderRadius:999, fontSize:13, color:'var(--primary)', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Tout voir <ArrowRight size={14} />
          </button>
        </div>

        {simulations.length === 0 ? (
          <EmptyState onCta={() => nav('/simulation')} />
        ) : (
          <div>
            {simulations.map((sim, i) => {
              const cfg = statusCfg[sim.status]
              return (
                <motion.div key={sim.id}
                  initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.2+i*0.08}}
                  onClick={() => nav(`/dashboard/resultats/${sim.id}`)}
                  style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 24px', borderBottom:i<simulations.length-1?'1px solid #F8FAFC':'none', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background='#F8FAFC'}
                  onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}>
                  <div style={{ width:46, height:46, background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
                    {sim.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:'var(--text)', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'58%' }}>{sim.title}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block', animation:'pulse 2s infinite' }} />
                        <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, padding:'2px 9px', borderRadius:999 }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ flex:1, height:5, background:'var(--primary-light)', borderRadius:99, overflow:'hidden' }}>
                        <motion.div initial={{width:0}} animate={{width:`${sim.confidence}%`}} transition={{duration:0.9,delay:0.3+i*0.1}}
                          style={{ height:'100%', background:'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--primary)', flexShrink:0 }}>{sim.confidence}%</span>
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                      <MTag icon={<Baby size={9}/>}         label={`${sim.age} ans`} />
                      <MTag icon={<MapPin size={9}/>}       label={sim.residence_rural===1?'Rural':'Urbain'} />
                      <MTag icon={<GraduationCap size={9}/>} label={['Aucun','Primaire','Secondaire','Supérieur'][sim.instruction]??'–'} />
                    </div>
                  </div>
                  <ArrowRight size={15} color="var(--border-2)" style={{ flexShrink:0 }} />
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ── CTA ── */}
      <motion.div variants={fadeUp} style={{ borderRadius:24, overflow:'hidden', position:'relative', background:'linear-gradient(135deg,#070B18 0%,#1E1B4B 100%)', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, boxShadow:'0 8px 32px rgba(7,11,24,0.2)' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <h3 style={{ fontSize:19, fontWeight:800, color:'white', letterSpacing:'-0.02em', marginBottom:6 }}>Prête pour une nouvelle simulation ?</h3>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:18, lineHeight:1.55 }}>Explorez un nouveau scénario et comparez vos résultats.</p>
          <button onClick={() => nav('/simulation')}
            style={{ padding:'11px 24px', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'none', borderRadius:999, color:'white', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-v)' }}>
            Simuler maintenant
          </button>
        </div>
        <div style={{ fontSize:90, opacity:0.06, position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', userSelect:'none' }}>🔮</div>
      </motion.div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(max-width:900px){ .db-top-row{grid-template-columns:1fr!important;} }
        @media(max-width:640px){ .stat-row{grid-template-columns:1fr 1fr!important;} }
      `}</style>
    </motion.div>
  )
}

function ConfRing({ value }:{ value:number }) {
  const sz=130, r=(sz-14)/2, circ=2*Math.PI*r
  return (
    <div style={{ position:'relative', width:sz, height:sz }}>
      <svg width={sz} height={sz} style={{ transform:'rotate(-90deg)' }}>
        <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366F1"/><stop offset="100%" stopColor="#8B5CF6"/></linearGradient></defs>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={10}/>
        <motion.circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="url(#cg)" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:circ-(value/100)*circ}} transition={{duration:1.4,ease:'easeOut',delay:0.3}}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:30, fontWeight:900, color:'var(--text)', letterSpacing:'-0.04em', lineHeight:1 }}>{value}%</span>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>SCORE</span>
      </div>
    </div>
  )
}

function MTag({ icon, label }:{ icon:React.ReactNode; label:string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)', background:'var(--surface-low)', padding:'2px 8px', borderRadius:999, fontWeight:600, border:'1px solid var(--border)' }}>
      {icon} {label}
    </span>
  )
}

function EmptyState({ onCta }:{ onCta:()=>void }) {
  return (
    <div style={{ padding:'52px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <div style={{ width:72, height:72, background:'var(--primary-light)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center' }}><BarChart2 size={34} color="var(--primary)" /></div>
      <div>
        <p style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Aucune simulation</p>
        <p style={{ fontSize:13, color:'var(--text-faint)', lineHeight:1.65 }}>Lancez votre première simulation pour voir vos résultats ici.</p>
      </div>
      <button onClick={onCta}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'white', border:'none', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--shadow-v)' }}>
        <BarChart2 size={16}/> Commencer
      </button>
    </div>
  )
}

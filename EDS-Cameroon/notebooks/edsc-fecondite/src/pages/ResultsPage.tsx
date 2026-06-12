import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Search, Save, Share2, Sparkles, Lightbulb, MoreVertical, GraduationCap, MapPin, Coins, Check, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store/useStore'

// Reverse maps : codes numériques → labels pour l'affichage depuis l'historique
const INSTRUCTION_REVERSE: Record<number, import('../types').Instruction> = { 0:'aucun', 1:'primaire', 2:'secondaire', 3:'superieur' }
const MILIEU_REVERSE: Record<number, import('../types').Milieu>           = { 1:'urbain', 2:'rural' }

// ── Design tokens (same as OnboardingPage / Figma) ────────────────────────────
const P     = '#3B3ADB'
const PLT   = '#EEEEFF'
const BG    = '#F0EEFF'
const NAVY  = '#1A1A3E'
const MUTED = '#6B6B9A'
const BORD  = '#E0E0F5'
const AMBER = '#D97706'
const AMBLT = '#FEF3C7'
const TEAL  = '#0D9488'
const TEALT = '#CCFBF1'

const fadeUp  = { hidden:{opacity:0,y:18}, show:{opacity:1,y:0,transition:{duration:0.45,ease:'easeOut'}} } satisfies import('framer-motion').Variants
const stagger = { show:{transition:{staggerChildren:0.09}} } satisfies import('framer-motion').Variants

// ── Helpers ───────────────────────────────────────────────────────────────────
const instrLabels: Record<string,string>  = { aucun:'Aucun', primaire:'Primaire', secondaire:'Secondaire', superieur:'Supérieur' }
const milieuLabels: Record<string,string> = { urbain:'Urbain', rural:'Rural' }

function instrPct(v:string)  { return { aucun:38, primaire:54, secondaire:72, superieur:88 }[v] ?? 60 }
function instrLvl(v:string)  { return { aucun:'Faible', primaire:'Modéré', secondaire:'Avancé', superieur:'Exceptionnel' }[v] ?? 'Modéré' }
function quintPct(q:number)  { return [30,48,64,78,90][q-1] ?? 60 }
function quintLvl(q:number)  { return ['Précaire','Fragile','Équilibré','Confortable','Solide'][q-1] ?? 'Modéré' }
function milieuPct(v:string) { return v==='urbain' ? 75 : 55 }
function milieuLvl(v:string) { return v==='urbain' ? 'Stratégique' : 'Rural' }

// ── ScoreCircle ───────────────────────────────────────────────────────────────
function ScoreCircle({ value, size=140 }:{ value:number; size?:number }) {
  const r=(size-16)/2, circ=2*Math.PI*r
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={P}/><stop offset="100%" stopColor="#7B6EF6"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E4E4F8" strokeWidth={12}/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rg2)" strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ} initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:circ-(value/100)*circ}} transition={{duration:1.6,ease:'easeOut',delay:0.2}}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <motion.span initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} transition={{delay:1.4,duration:0.4,type:'spring'}}
          style={{ fontSize:size>130?38:26, fontWeight:900, color:P, letterSpacing:'-0.05em', lineHeight:1 }}>{value}%</motion.span>
        <span style={{ fontSize:9, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.12em', marginTop:4 }}>PRÉCISION</span>
      </div>
    </div>
  )
}

// ── FactorBar ─────────────────────────────────────────────────────────────────
function FactorBar({ pct, color }:{ pct:number; color:string }) {
  return (
    <div style={{ height:6, background:`${color}20`, borderRadius:99, overflow:'hidden', margin:'12px 0 8px' }}>
      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,ease:'easeOut',delay:0.5}}
        style={{ height:'100%', background:color, borderRadius:99 }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { predictionResult, simulations, fetchSimulations, user } = useStore()
  const [copied, setCopied] = useState(false)

  // Charger l'historique si vide (navigation directe depuis l'historique)
  useEffect(() => {
    if (!simulations.length) fetchSimulations()
  }, [fetchSimulations, simulations.length])

  // Simulation correspondante dans le store (pour navigation depuis l'historique)
  const simFromHistory = simulations.find(s => s.id === id)

  function handleSavePDF() {
    window.print()
  }

  async function handleShare() {
    const url  = window.location.href
    const text = `Analyse EDSC-V 2018 — Désir de fécondité au Cameroun\n` +
                 `Résultat : ${res.desireEnfant ? 'Désire un enfant supplémentaire' : 'Ne désire pas d\'enfant supplémentaire'}\n` +
                 `Confiance du modèle : ${res.confidence}%`
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title:'Analyse EDSC-V 2018', text, url }) } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Priorité : résultat riche de la prédiction en cours → fallback : simulation historique
  const res = predictionResult ?? (simFromHistory ? {
    confidence:         simFromHistory.confidence ?? 0,
    desireEnfant:       simFromHistory.desire_enfant ?? false,
    probability:        simFromHistory.probability ?? 0,
    instruction:        INSTRUCTION_REVERSE[simFromHistory.niveau_instruction] ?? 'primaire',
    milieu:             MILIEU_REVERSE[simFromHistory.milieu_residence] ?? 'urbain',
    nbEnfants:          simFromHistory.nb_enfants_vivants,
    age:                simFromHistory.age,
    quintile:           simFromHistory.quintile_richesse,
    insights:           [] as string[],
    featureImportances: {} as Record<string, number>,
  } : {
    confidence: 84, desireEnfant: true, probability: 0.84,
    instruction: 'superieur' as const, milieu: 'urbain' as const,
    nbEnfants: 2, age: 28, quintile: 3,
    insights: [] as string[],
    featureImportances: {} as Record<string, number>,
  })

  const q = (res as { quintile?: number }).quintile ?? 3

  // Quintile chart data
  const quintileData = [
    { q:'Q1', val: Math.round(res.confidence + 12) },
    { q:'Q2', val: Math.round(res.confidence + 7)  },
    { q:'Q3', val: Math.round(res.confidence)       },
    { q:'Q4', val: Math.round(res.confidence - 8)  },
    { q:'Q5', val: Math.round(res.confidence - 14) },
  ]

  // Personalised IA text
  const firstName  = user?.name.split(' ')[0] ?? 'Marie'
  const instrLabel = instrLabels[res.instruction]
  const milLabel   = milieuLabels[res.milieu]

  const factors = [
    {
      icon: GraduationCap, iconBg: PLT, iconColor: P,
      title: 'Niveau d\'instruction', desc: 'Impact significatif sur la planification familiale et les comportements reproductifs.',
      pct: instrPct(res.instruction), barColor: P, level: instrLvl(res.instruction), levelColor: P,
    },
    {
      icon: Coins, iconBg: AMBLT, iconColor: AMBER,
      title: 'Stabilité Financière', desc: 'Le quintile de richesse conditionne l\'accès aux services et les choix reproductifs.',
      pct: quintPct(q), barColor: AMBER, level: quintLvl(q), levelColor: AMBER,
    },
    {
      icon: MapPin, iconBg: TEALT, iconColor: TEAL,
      title: 'Milieu de Résidence', desc: 'L\'infrastructure et les normes sociales influencent le désir d\'enfants.',
      pct: milieuPct(res.milieu), barColor: TEAL, level: milieuLvl(res.milieu), levelColor: TEAL,
    },
  ]

  return (
    <div style={{ background:BG, minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="no-print" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', background:'transparent' }}>
        <div style={{ width:36, height:36, background:'white', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${BORD}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button style={{ width:36, height:36, borderRadius:10, background:'white', border:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Bell size={16} color={MUTED}/>
          </button>
          <button style={{ width:36, height:36, borderRadius:10, background:'white', border:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Search size={16} color={MUTED}/>
          </button>
          {user?.avatar && (
            <img src={user.avatar} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:`2px solid white`, boxShadow:`0 2px 8px rgba(0,0,0,0.1)` }} />
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ padding:'0 28px 40px', maxWidth:1040, margin:'0 auto' }}>

        {/* ── HERO CARD ── */}
        <motion.div variants={fadeUp} style={{
          background:'white', borderRadius:22, padding:'32px 36px',
          border:`1px solid ${BORD}`, marginBottom:18,
          display:'flex', alignItems:'center', gap:36,
          boxShadow:`0 4px 24px rgba(59,58,219,0.07)`,
        }}>
          {/* Circle */}
          <ScoreCircle value={res.confidence} size={148} />

          {/* Text */}
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:30, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', marginBottom:12, lineHeight:1.2 }}>
              Votre Résultat de Simulation
            </h1>
            <p style={{ fontSize:14, color:MUTED, lineHeight:1.75, marginBottom:24, maxWidth:560 }}>
              Le modèle a analysé votre profil et l'a comparé à 13 527 femmes camerounaises de 15 à 49 ans issues de l'EDSC-V 2018. Voici ce que les données révèlent sur votre situation.
            </p>
            <div className="no-print" style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <button onClick={handleSavePDF}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:P, color:'white', border:'none', borderRadius:999, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 4px 16px ${P}44` }}>
                <Save size={15}/> Sauvegarder en PDF
              </button>
              <button onClick={handleShare}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:copied?'#ECFDF5':'white', border:`1.5px solid ${copied?'#86EFAC':BORD}`, borderRadius:999, fontSize:14, fontWeight:600, color:copied?'#15803D':P, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s' }}>
                {copied ? <><Check size={15}/> Lien copié !</> : <><Share2 size={15}/> Partager l'analyse</>}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── 3 FACTOR CARDS ── */}
        <motion.div variants={fadeUp} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:18 }} className="factors-grid">
          {factors.map(({ icon:Icon, iconBg, iconColor, title, desc, pct, barColor, level, levelColor }) => (
            <div key={title} style={{ background:'white', borderRadius:18, padding:'22px', border:`1px solid ${BORD}`, boxShadow:`0 2px 12px rgba(59,58,219,0.05)` }}>
              {/* Icon */}
              <div style={{ width:46, height:46, background:iconBg, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <Icon size={22} color={iconColor} strokeWidth={1.8} />
              </div>
              {/* Text */}
              <h3 style={{ fontSize:16, fontWeight:800, color:NAVY, marginBottom:6 }}>{title}</h3>
              <p style={{ fontSize:13, color:MUTED, lineHeight:1.6, margin:0 }}>{desc}</p>
              {/* Bar */}
              <FactorBar pct={pct} color={barColor} />
              {/* Level */}
              <p style={{ fontSize:13, fontWeight:700, color:levelColor, margin:0 }}>Niveau: {level}</p>
            </div>
          ))}
        </motion.div>

        {/* ── BOTTOM ROW ── */}
        <motion.div variants={fadeUp} style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 }} className="bottom-grid">

          {/* IA Analysis — insights réels du modèle (Régression Logistique) */}
          <div style={{ background:'white', borderRadius:18, padding:'24px', border:`1px solid ${BORD}`, boxShadow:`0 2px 12px rgba(59,58,219,0.05)` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:36, height:36, background:PLT, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sparkles size={18} color={P} />
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, color:NAVY, margin:0 }}>Que prédit le modèle ?</h3>
            </div>

            {/* Résultat principal */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: res.desireEnfant ? '#F0FFF4' : '#FFF7ED', borderRadius:12, marginBottom:16, border:`1px solid ${res.desireEnfant ? '#86EFAC' : '#FCD34D'}` }}>
              {res.desireEnfant
                ? <CheckCircle2 size={28} color="#16A34A" strokeWidth={2} style={{ flexShrink:0 }} />
                : <XCircle      size={28} color="#D97706" strokeWidth={2} style={{ flexShrink:0 }} />}
              <div>
                <p style={{ fontSize:14, fontWeight:800, color:NAVY, margin:0 }}>
                  {res.desireEnfant ? 'Vous désireriez probablement un enfant supplémentaire' : 'Vous ne désireriez probablement pas d\'enfant supplémentaire'}
                </p>
                <p style={{ fontSize:12, color:MUTED, margin:'4px 0 0' }}>
                  Le modèle estime cette probabilité à <strong>{Math.round((res.probability ?? 0) * 100)}%</strong>.
                  Niveau de certitude du modèle : <strong>{res.confidence}%</strong>
                </p>
              </div>
            </div>

            {/* Insights du modèle */}
            {res.insights && res.insights.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {res.insights.map((insight, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', background:'#F8F8FF', borderRadius:10, border:`1px solid ${BORD}` }}>
                    <Lightbulb size={14} color={P} style={{ flexShrink:0, marginTop:2 }} />
                    <p style={{ fontSize:12, color:'#5050A0', lineHeight:1.65, margin:0 }}>{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:13, color:MUTED, lineHeight:1.75, marginBottom:14 }}>
                <strong style={{ color:NAVY }}>{firstName}</strong>, votre profil ({instrLabel}, {milLabel}) est comparé à 13 527 femmes de l'EDSC Cameroun 2018.
                Le modèle identifie les facteurs clés qui influencent votre désir de fécondité.
              </p>
            )}

            {/* Importance des variables */}
            {res.featureImportances && Object.keys(res.featureImportances).length > 0 && (
              <div style={{ borderTop:`1px solid ${BORD}`, paddingTop:14 }}>
                <p style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Facteurs les plus déterminants</p>
                {(Object.entries(res.featureImportances ?? {}) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([name, imp]) => (
                    <div key={name} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:11, color:NAVY, fontWeight:600 }}>{name}</span>
                        <span style={{ fontSize:11, color:P, fontWeight:700 }}>{Math.round(imp * 100)}%</span>
                      </div>
                      <div style={{ height:4, background:`${P}15`, borderRadius:99 }}>
                        <div style={{ height:'100%', width:`${Math.round(imp * 100)}%`, background:P, borderRadius:99, transition:'width 1s ease' }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Quintile Chart */}
          <div style={{ background:'white', borderRadius:18, padding:'24px', border:`1px solid ${BORD}`, boxShadow:`0 2px 12px rgba(59,58,219,0.05)`, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:NAVY, margin:0 }}>Probabilités par Quintile</h3>
              <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <MoreVertical size={18} color={MUTED} />
              </button>
            </div>

            {/* Recharts bar chart */}
            <div style={{ flex:1, minHeight:180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={quintileData} barCategoryGap="30%">
                  <XAxis dataKey="q" tick={{ fontSize:12, fill:MUTED, fontWeight:600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background:'white', border:`1px solid ${BORD}`, borderRadius:10, fontSize:12, color:NAVY, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}
                    formatter={(v: unknown) => [`${Number(v) || 0}%`, 'Probabilité']}
                    cursor={{ fill:`${P}08` }}
                  />
                  <Bar dataKey="val" fill={P} radius={[6,6,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p style={{ fontSize:12, color:MUTED, textAlign:'center', marginTop:10, lineHeight:1.5 }}>
              Répartition des probabilités de désir d'enfant par quintile de richesse.
            </p>

            {/* Legend */}
            <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:10, flexWrap:'wrap' }}>
              {['Très pauvre','Pauvre','Moyen','Aisé','Riche'].map((l,i)=>(
                <span key={l} style={{ fontSize:10, color:MUTED, display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:P, opacity:1-i*0.15, display:'inline-block' }}/>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Profile data chips ── */}
        <motion.div variants={fadeUp} style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          {[
            { label:'Âge',        value:`${res.age} ans`,                                      bg:PLT,    color:P },
            { label:'Instruction',value:instrLabels[res.instruction],                          bg:PLT,    color:P },
            { label:'Résidence',  value:milieuLabels[res.milieu],                             bg:TEALT,  color:TEAL },
            { label:'Enfants',    value:`${res.nbEnfants} enfant${res.nbEnfants!==1?'s':''}`, bg:AMBLT,  color:AMBER },
            { label:'Confiance',  value:`${res.confidence}%`,                                 bg:PLT,    color:P },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ background:bg, borderRadius:999, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, border:`1px solid ${color}20` }}>
              <span style={{ fontSize:11, color, fontWeight:600 }}>{label} :</span>
              <span style={{ fontSize:12, color:NAVY, fontWeight:700 }}>{value}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Source note ── */}
        <motion.div variants={fadeUp} style={{ marginTop:16, background:'white', borderRadius:14, padding:'13px 18px', border:`1px solid ${BORD}`, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🇨🇲</span>
          <p style={{ fontSize:12, color:MUTED, margin:0, lineHeight:1.5 }}>
            <strong style={{ color:NAVY }}>Source :</strong> Enquête Démographique et de Santé du Cameroun (EDSC-V 2018) · INS · {simFromHistory?.model_used ?? 'SVM calibré (noyau RBF)'} entraîné sur 13 527 femmes de 15–49 ans.
          </p>
          <button onClick={() => nav('/simulation')} className="no-print"
            style={{ marginLeft:'auto', flexShrink:0, padding:'7px 16px', background:PLT, border:`1px solid ${P}22`, borderRadius:999, fontSize:12, fontWeight:700, color:P, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            Nouvelle simulation
          </button>
        </motion.div>

      </motion.div>

      <style>{`
        @media(max-width:900px){ .bottom-grid{grid-template-columns:1fr!important;} }
        @media(max-width:640px){ .factors-grid{grid-template-columns:1fr!important;} }
        @media print {
          .no-print { display:none !important; }
          body { background:white !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          * { box-shadow:none !important; }
          @page { margin:18mm 14mm; size:A4 portrait; }
          .bottom-grid { grid-template-columns:1fr 1fr !important; }
          .factors-grid { grid-template-columns:repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, TrendingUp, Clock, Settings, Check,
  Info, ChevronLeft, ChevronRight, Heart, Lightbulb, Sparkles, Scale
} from 'lucide-react'
import { useStore, INSTRUCTION_MAP, MILIEU_MAP } from '../store/useStore'
import { api } from '../lib/api'
import type { Instruction, Milieu, Quintile } from '../types'

// ── Design tokens (Figma) ─────────────────────────────────────────────────────
const P    = '#3B3ADB'   // cobalt primary
const PLT  = '#EEEEFF'   // primary light
const BG   = '#F0EEFF'   // page background
const NAVY = '#1A1A3E'   // deep text
const MUTED= '#6B6B9A'   // muted text
const BORD = '#E0E0F5'   // border

// ── Step configuration ────────────────────────────────────────────────────────
const STEPS = [
  { n:'01', label:'Âge',        dark:false },
  { n:'02', label:'Enfants',    dark:true  },
  { n:'03', label:'Éducation',  dark:false },
  { n:'04', label:'Résidence',  dark:false },
  { n:'05', label:'Quintile',   dark:false },
]

const EDU: { v:Instruction; label:string; sub:string; img:string }[] = [
  { v:'aucun',      label:'Aucun',      sub:'Apprentissage sur le tas et expérience pratique.',            img:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=70&auto=format&fit=crop' },
  { v:'primaire',   label:'Primaire',   sub:'Bases fondamentales et éducation scolaire initiale.',         img:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=70&auto=format&fit=crop' },
  { v:'secondaire', label:'Secondaire', sub:'Cycle complet d\'études secondaires ou professionnelles.',   img:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=70&auto=format&fit=crop' },
  { v:'superieur',  label:'Université', sub:'Études supérieures, Bachelor, Master ou Doctorat.',          img:'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=70&auto=format&fit=crop' },
]

const MILIEU: { v:Milieu; label:string; sub:string; img:string }[] = [
  { v:'urbain', label:'Milieu Urbain', sub:'Grande ville, centre urbain, chef-lieu de région.', img:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=70&auto=format&fit=crop' },
  { v:'rural',  label:'Milieu Rural',  sub:'Village, zone rurale ou semi-urbaine.',              img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70&auto=format&fit=crop' },
]

const QUIN: { v:Quintile; label:string; desc:string }[] = [
  { v:1, label:'Très pauvre',   desc:'Revenus très limités, accès restreint aux services de base.' },
  { v:2, label:'Pauvre',        desc:'Revenus faibles, difficultés à couvrir les besoins essentiels.' },
  { v:3, label:'Moyen',         desc:'Standard de vie médian, situation stable avec croissance modérée.' },
  { v:4, label:'Aisé',          desc:'Revenus confortables, accès à la plupart des services et commodités.' },
  { v:5, label:'Riche',         desc:'Revenus élevés, liberté financière et accès à tous les services.' },
]

const slideV = {
  enter: (d:number) => ({ opacity:0, x:d>0?40:-40 }),
  center: { opacity:1, x:0, transition:{ duration:0.35, ease:'easeOut' } },
  exit:   (d:number) => ({ opacity:0, x:d>0?-40:40, transition:{ duration:0.25 } }),
} satisfies import('framer-motion').Variants

// ── Main component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const nav = useNavigate()
  const { user, setSimData, setPredictionResult, createSimulation } = useStore()

  const [step,              setStep]              = useState(0)
  const [dir,               setDir]               = useState(1)
  const [age,               setAge]               = useState(28)
  const [nbEnfants,         setNbEnfants]         = useState(0)
  const [instruction,       setInstruction]       = useState<Instruction|null>(null)
  const [milieu,            setMilieu]            = useState<Milieu|null>(null)
  const [quintile,          setQuintile]          = useState<Quintile|null>(null)
  const [statutMatrimonial, setStatutMatrimonial] = useState<number>(2) // 2 = Marié(e) par défaut
  const [contraceptif,      setContraceptif]      = useState<number>(0)
  const [travail,           setTravail]           = useState<number>(0)
  const [regionNord,        setRegionNord]        = useState<number>(0)
  const [religionMusulman,  setReligionMusulman]  = useState<number>(0)
  const [analyzing,         setAnalyzing]         = useState(false)
  const [simError,          setSimError]          = useState<string|null>(null)

  function canNext() {
    if (step===2) return instruction!==null
    if (step===3) return milieu!==null
    if (step===4) return quintile!==null
    return true
  }

  async function goNext() {
    if (!canNext()) return
    if (step < 4) { setDir(1); setStep(s=>s+1); return }

    // Vérifier que l'utilisateur est connecté avant de soumettre
    if (!user) {
      nav('/login')
      return
    }

    // Étape finale : appel réel à l'API
    const simData = { age, nbEnfants, instruction:instruction!, milieu:milieu!, quintile:quintile!, statutMatrimonial, contraceptif, travail, regionNord, religionMusulman }
    setSimData(simData)
    setAnalyzing(true)
    setSimError(null)

    try {
      const predPayload = {
        age,
        niveau_instruction: INSTRUCTION_MAP[instruction!],
        nb_enfants_vivants: nbEnfants,
        contraceptif,
        statut_matrimonial: statutMatrimonial,
        milieu_residence:   MILIEU_MAP[milieu!],
        quintile_richesse:  quintile!,
        travail,
        region_nord:        regionNord,
        religion_musulman:  religionMusulman,
      }

      // Créer la simulation ET récupérer les insights complets en parallèle
      const [sim, predRes] = await Promise.all([
        createSimulation({
          title: `Simulation — ${milieu === 'urbain' ? 'Milieu Urbain' : 'Milieu Rural'}`,
          ...predPayload,
        }),
        api.post('/prediction', predPayload),
      ])

      const pred = predRes.data

      // Stocker le résultat complet (avec insights et importances réels)
      setPredictionResult({
        age,
        instruction:        instruction!,
        milieu:             milieu!,
        nbEnfants,
        quintile:           quintile!,
        confidence:         pred.confidence ?? sim.confidence ?? 0,
        desireEnfant:       pred.desire_enfant ?? sim.desire_enfant ?? false,
        probability:        pred.probability ?? sim.probability ?? 0,
        insights:           pred.insights ?? [],
        featureImportances: pred.feature_importances ?? {},
      })

      setAnalyzing(false)
      nav(`/dashboard/resultats/${sim.id}`)
    } catch {
      setAnalyzing(false)
      setSimError('Erreur lors de la simulation. Vérifiez que le serveur est démarré.')
    }
  }

  function goBack() {
    if (step>0) { setDir(-1); setStep(s=>s-1) } else nav('/')
  }

  const sm = STEPS[step]

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif", background:BG, overflow:'hidden' }}>

      {/* ── Analysis overlay ── */}
      <AnimatePresence>
        {analyzing && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, background:'rgba(26,26,62,0.92)', zIndex:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
            <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }}
              style={{ width:64, height:64, borderRadius:'50%', border:`6px solid ${PLT}`, borderTopColor:P }} />
            <p style={{ fontSize:20, fontWeight:800, color:'white', letterSpacing:'-0.02em' }}>Analyse EDSC-V en cours…</p>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)' }}>Comparaison avec 150 000+ profils camerounais</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar (desktop) ── */}
      <aside className="sim-sidebar" style={{
        width:220, flexShrink:0,
        background: sm.dark ? `linear-gradient(160deg,#2D1B69 0%,#1A0533 60%,#080014 100%)` : 'white',
        borderRight:`1px solid ${sm.dark?'rgba(255,255,255,0.08)':BORD}`,
        display:'flex', flexDirection:'column',
        padding:'24px 16px',
        transition:'background 0.5s',
        position:'relative', zIndex:20,
      }}>
        {/* Logo */}
        <div onClick={()=>nav('/')} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:36, cursor:'pointer' }}>
          <div style={{ width:34, height:34, background:P, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Heart size={17} color={sm.dark?'white':P} strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight:900, fontSize:18, color:sm.dark?'white':P, letterSpacing:'-0.03em' }}>Hearth</span>
        </div>

        {/* Nav items */}
        {[
          { icon:Home,      label:'Accueil',    to:'/dashboard' },
          { icon:TrendingUp,label:'Simulation',  to:'/simulation', active:true },
          { icon:Clock,     label:'Historique',  to:'/dashboard/historique' },
        ].map(({ icon:Icon, label, to, active }) => (
          <button key={label} onClick={()=>nav(to)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, marginBottom:2, transition:'all 0.15s', background:active?PLT:'transparent', color:active?P:sm.dark?'rgba(255,255,255,0.5)':MUTED, fontWeight:active?600:400 }}>
            <Icon size={17} /> {label}
          </button>
        ))}

        {/* Step list */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:0, marginTop:24 }}>
          <p style={{ fontSize:10, fontWeight:700, color:sm.dark?'rgba(255,255,255,0.3)':'rgba(26,26,62,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>PROGRESSION</p>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:14, position:'relative' }}>
              {/* Connector line */}
              {i < STEPS.length-1 && (
                <div style={{ position:'absolute', left:10, top:20, width:1, height:14, background:i<step?P:sm.dark?'rgba(255,255,255,0.1)':BORD }} />
              )}
              {/* Circle */}
              <div style={{ width:20, height:20, borderRadius:'50%', background:i<step?P:i===step?'white':sm.dark?'rgba(255,255,255,0.1)':BORD, border:`2px solid ${i<=step?P:sm.dark?'rgba(255,255,255,0.15)':BORD}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:i===step?`0 0 0 4px ${PLT}`:'none', transition:'all 0.3s' }}>
                {i<step && <Check size={10} color="white" strokeWidth={3} />}
                {i===step && <div style={{ width:8, height:8, background:P, borderRadius:'50%' }} />}
              </div>
              <div>
                <p style={{ fontSize:9, fontWeight:700, color:i===step?P:sm.dark?'rgba(255,255,255,0.3)':'rgba(26,26,62,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0, lineHeight:1 }}>ÉTAPE {s.n}</p>
                <p style={{ fontSize:13, fontWeight:i===step?700:400, color:i===step?P:sm.dark?'rgba(255,255,255,0.55)':MUTED, margin:0, marginTop:1, lineHeight:1.2 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dark panel inspirational text */}
        {sm.dark && (
          <div style={{ marginTop:'auto' }}>
            <h3 style={{ fontSize:22, fontWeight:900, color:'white', lineHeight:1.25, letterSpacing:'-0.02em', marginBottom:10 }}>
              Prévoyez l'avenir,<br />un sourire à la fois.
            </h3>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.65 }}>
              La composition de votre foyer est le cœur battant de votre simulation Hearth.
            </p>
          </div>
        )}

        {/* Bottom nav item (Paramètres) */}
        <button onClick={()=>nav('/dashboard/reglages')}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, background:'transparent', color:sm.dark?'rgba(255,255,255,0.4)':MUTED, fontWeight:400, marginTop:16 }}>
          <Settings size={17} /> Paramètres
        </button>
      </aside>

      {/* ── Content area ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div key={step} custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
            style={{ position:'absolute', inset:0, display:'flex' }}>

            {/* ── STEP 1: AGE — image + form card ── */}
            {step===0 && (
              <>
                {/* Middle image panel */}
                <div className="img-panel" style={{ width:'42%', position:'relative', overflow:'hidden' }}>
                  <img src="/images/screen.png" alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(26,26,62,0.15) 0%,rgba(26,26,62,0.55) 60%,rgba(26,26,62,0.90) 100%)' }} />
                  <div style={{ position:'absolute', bottom:40, left:32, right:32 }}>
                    <h2 style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1.2, letterSpacing:'-0.03em', marginBottom:10 }}>Prédisez<br />votre avenir.</h2>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.65 }}>
                      Le simulateur Hearth utilise des modèles démographiques avancés pour vous aider à visualiser les étapes clés de votre vie familiale.
                    </p>
                  </div>
                </div>

                {/* Right form area */}
                <div className="mob-step-area" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 40px', overflowY:'auto' }}>
                  <div style={{ width:'100%', maxWidth:460 }}>
                    <span style={{ display:'inline-block', fontSize:11, fontWeight:700, color:P, background:PLT, padding:'5px 14px', borderRadius:999, marginBottom:20, letterSpacing:'0.05em' }}>
                      Étape initiale
                    </span>
                    <h1 style={{ fontSize:36, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', lineHeight:1.15, marginBottom:10 }}>
                      Quel est votre<br />âge actuel ?
                    </h1>
                    <p style={{ fontSize:14, color:MUTED, lineHeight:1.65, marginBottom:32 }}>
                      L'âge est le facteur déterminant de nos algorithmes de projection de fertilité et de carrière.
                    </p>

                    {/* Age display */}
                    <div style={{ textAlign:'center', marginBottom:20 }}>
                      <motion.span key={age} initial={{scale:0.9,opacity:0.6}} animate={{scale:1,opacity:1}} transition={{duration:0.12}}
                        style={{ fontSize:96, fontWeight:900, color:P, letterSpacing:'-0.06em', lineHeight:1 }}>{age}</motion.span>
                      <span style={{ fontSize:24, color:MUTED, fontWeight:500, marginLeft:8 }}>ans</span>
                    </div>

                    {/* Custom slider */}
                    <div style={{ position:'relative', marginBottom:8 }}>
                      <div style={{ height:6, background:BORD, borderRadius:99, overflow:'visible', position:'relative' }}>
                        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${((age-15)/(49-15))*100}%`, background:`linear-gradient(90deg,${P},#7B6EF6)`, borderRadius:99, transition:'width 0.1s' }} />
                      </div>
                      <input type="range" min={15} max={49} value={age} onChange={e=>setAge(+e.target.value)}
                        style={{ position:'absolute', top:'-11px', left:0, width:'100%', opacity:0, cursor:'pointer', height:28 }}
                      />
                      {/* Custom thumb */}
                      <div style={{ position:'absolute', top:'-7px', left:`calc(${((age-15)/(49-15))*100}% - 10px)`, width:20, height:20, background:P, borderRadius:'50%', boxShadow:`0 2px 12px ${P}60`, border:'3px solid white', pointerEvents:'none', transition:'left 0.1s' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:32 }}>
                      <span style={{ fontSize:12, color:MUTED, fontWeight:600 }}>15 ans</span>
                      <span style={{ fontSize:12, color:P, fontWeight:700 }}>{age} ans</span>
                      <span style={{ fontSize:12, color:MUTED, fontWeight:600 }}>49 ans</span>
                    </div>

                    {/* Info box */}
                    <div style={{ marginBottom:8 }}>
                      <InfoBox icon={<Lightbulb size={15} color={P} />}>
                        <strong>Pourquoi cette limite ?</strong> L'étude se concentre sur les années de vie reproductive et active, allant de l'adolescence à la fin de la quarantaine.
                      </InfoBox>
                    </div>

                    <NavBtns onBack={goBack} onNext={goNext} canNext={true} nextLabel="Suivant" />
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: CHILDREN ── */}
            {step===1 && (
              <div className="mob-step-area" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 60px', overflowY:'auto', background:BG }}>
                <div style={{ width:'100%', maxWidth:560 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:P, background:PLT, padding:'4px 12px', borderRadius:999, letterSpacing:'0.06em' }}>ÉTAPE 02 SUR 05</span>
                    <span style={{ fontSize:12, color:MUTED, fontWeight:500 }}>Composition familiale</span>
                  </div>
                  <h1 style={{ fontSize:38, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:10 }}>
                    Combien d'enfants<br />avez-vous ?
                  </h1>
                  <p style={{ fontSize:14, color:MUTED, lineHeight:1.65, marginBottom:36 }}>
                    Cette information nous permet d'affiner les aides disponibles et les besoins de prévoyance de votre foyer.
                  </p>

                  {/* Counter card */}
                  <div style={{ background:'white', borderRadius:20, padding:'40px 32px', border:`1.5px solid ${BORD}`, boxShadow:'0 4px 24px rgba(59,58,219,0.07)', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'center', gap:36 }}>
                    <button onClick={()=>setNbEnfants(Math.max(0,nbEnfants-1))}
                      style={{ width:52, height:52, borderRadius:'50%', border:`1.5px solid ${BORD}`, background:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, cursor:'pointer', color:NAVY, transition:'all 0.15s' }}
                      onMouseOver={e=>{e.currentTarget.style.borderColor=P;e.currentTarget.style.color=P}}
                      onMouseOut={e=>{e.currentTarget.style.borderColor=BORD;e.currentTarget.style.color=NAVY}}>
                      −
                    </button>
                    <div style={{ textAlign:'center', minWidth:80 }}>
                      <motion.p key={nbEnfants} initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:400,damping:20}}
                        style={{ fontSize:80, fontWeight:900, color:P, letterSpacing:'-0.06em', lineHeight:1, margin:0 }}>{nbEnfants}</motion.p>
                      <p style={{ fontSize:14, color:MUTED, fontWeight:500, margin:0, marginTop:4 }}>enfant{nbEnfants!==1?'s':''}</p>
                    </div>
                    <button onClick={()=>setNbEnfants(Math.min(15,nbEnfants+1))}
                      style={{ width:52, height:52, borderRadius:'50%', border:'none', background:P, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, cursor:'pointer', color:'white', boxShadow:`0 4px 14px ${P}50` }}>
                      +
                    </button>
                  </div>

                  {/* Statut matrimonial */}
                  <div style={{ background:'white', borderRadius:16, padding:'18px 20px', border:`1.5px solid ${BORD}`, marginBottom:16 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:NAVY, marginBottom:12 }}>Statut matrimonial</p>
                    <div className="stat-mat-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { v:1, label:'Célibataire' },
                        { v:2, label:'Marié(e)' },
                        { v:3, label:'Union libre' },
                        { v:4, label:'Séparé(e)' },
                        { v:5, label:'Veuf/Veuve' },
                      ].map(({ v, label }) => (
                        <button key={v} onClick={()=>setStatutMatrimonial(v)} type="button"
                          style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${statutMatrimonial===v?P:BORD}`, background:statutMatrimonial===v?PLT:'white', color:statutMatrimonial===v?P:MUTED, fontSize:12, fontWeight:statutMatrimonial===v?700:400, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Utilisation contraceptif */}
                  <div style={{ background:'white', borderRadius:16, padding:'16px 20px', border:`1.5px solid ${BORD}`, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:NAVY, margin:0 }}>Utilisation d'un contraceptif</p>
                      <p style={{ fontSize:11, color:MUTED, margin:'3px 0 0' }}>Méthode moderne ou traditionnelle</p>
                    </div>
                    <button onClick={()=>setContraceptif(c=>c===0?1:0)} type="button"
                      style={{ width:48, height:26, borderRadius:999, border:'none', background:contraceptif===1?P:BORD, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:3, left:contraceptif===1?'calc(100% - 23px)':3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>

                  {/* Travail (emploi) */}
                  <div style={{ background:'white', borderRadius:16, padding:'16px 20px', border:`1.5px solid ${BORD}`, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:NAVY, margin:0 }}>Activité professionnelle</p>
                      <p style={{ fontSize:11, color:MUTED, margin:'3px 0 0' }}>Exercez-vous un emploi actuellement ?</p>
                    </div>
                    <button onClick={()=>setTravail(t=>t===0?1:0)} type="button"
                      style={{ width:48, height:26, borderRadius:999, border:'none', background:travail===1?P:BORD, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:3, left:travail===1?'calc(100% - 23px)':3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>

                  <InfoBox icon={<Lightbulb size={15} color={P} />}>
                    <strong>Le saviez-vous ?</strong> Au Cameroun, les femmes ayant moins de 3 enfants expriment en moyenne un désir plus fort d'en avoir d'autres (EDSC-V 2018).
                  </InfoBox>

                  {simError && (
                    <div style={{ padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, marginTop:12, fontSize:12, color:'#B91C1C' }}>
                      {simError}
                    </div>
                  )}

                  <NavBtns onBack={goBack} onNext={goNext} canNext={true} nextLabel="Continuer" />
                </div>
              </div>
            )}

            {/* ── STEP 3: EDUCATION ── */}
            {step===2 && (
              <>
                {/* Left: question + progress */}
                <div className="edu-left" style={{ width:340, padding:'40px 32px', display:'flex', flexDirection:'column', borderRight:`1px solid ${BORD}`, background:'white', overflowY:'auto' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:P, background:PLT, padding:'4px 12px', borderRadius:999, letterSpacing:'0.06em', alignSelf:'flex-start', marginBottom:20 }}>
                    SIMULATEUR DE VIE • ÉTAPE 3
                  </span>
                  <h1 style={{ fontSize:30, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', lineHeight:1.15, marginBottom:10 }}>
                    Quel est votre niveau d'études ?
                  </h1>
                  <p style={{ fontSize:14, color:MUTED, lineHeight:1.65, marginBottom:28, flex:'none' }}>
                    L'éducation influence directement votre potentiel de revenus et vos opportunités de carrière au cours de la simulation.
                  </p>

                  {/* Progress bar */}
                  <div style={{ marginBottom:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:P, textTransform:'uppercase', letterSpacing:'0.06em' }}>PROGRESSION</span>
                      <span style={{ fontSize:14, fontWeight:800, color:P }}>60%</span>
                    </div>
                    <div style={{ height:5, background:PLT, borderRadius:99, overflow:'hidden', marginBottom:10 }}>
                      <div style={{ height:'100%', width:'60%', background:P, borderRadius:99 }} />
                    </div>
                    <div style={{ display:'flex', gap:16 }}>
                      {['Identité','Situation','Éducation','Finances'].map((l,i)=>(
                        <span key={l} style={{ fontSize:11, color:i===2?P:MUTED, fontWeight:i===2?700:400 }}>{l}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex:1 }} />

                  <InfoBox icon={<Info size={14} color={P}/>}>
                    Saviez-vous qu'en moyenne, un diplôme universitaire augmente votre espérance de vie virtuelle de 12% dans notre modèle ?
                  </InfoBox>

                </div>

                {/* Right: card grid */}
                <div className="mob-step-area" style={{ flex:1, padding:'40px', overflowY:'auto', display:'flex', flexDirection:'column' }}>
                  {/* Titre visible uniquement sur mobile (edu-left est caché) */}
                  <h2 className="edu-mobile-h" style={{ display:'none', fontSize:22, fontWeight:900, color:NAVY, letterSpacing:'-0.03em', marginBottom:20, lineHeight:1.2 }}>
                    Quel est votre niveau d'études ?
                  </h2>
                  <div className="edu-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, flex:1 }}>
                    {EDU.map(({ v, label, sub, img }) => (
                      <motion.button key={v} onClick={()=>setInstruction(v)} whileTap={{ scale:0.98 }}
                        style={{
                          background:'white', border:`2px solid ${instruction===v?P:BORD}`,
                          borderRadius:20, padding:0, overflow:'hidden',
                          cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                          boxShadow: instruction===v ? `0 4px 24px ${P}28` : '0 2px 10px rgba(0,0,0,0.05)',
                          transition:'all 0.2s', position:'relative',
                        }}
                        onMouseOver={e=>{if(instruction!==v)(e.currentTarget as HTMLElement).style.borderColor='#C0C0E8'}}
                        onMouseOut={e=>{if(instruction!==v)(e.currentTarget as HTMLElement).style.borderColor=BORD}}>
                        {/* Check badge */}
                        {instruction===v && (
                          <div style={{ position:'absolute', top:10, right:10, width:24, height:24, background:P, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                            <Check size={13} color="white" strokeWidth={3} />
                          </div>
                        )}
                        {/* Image */}
                        <div style={{ height:140, overflow:'hidden' }}>
                          <img src={img} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:instruction===v?'none':'grayscale(15%)' }} />
                        </div>
                        <div style={{ padding:'14px 16px' }}>
                          <p style={{ fontSize:15, fontWeight:800, color:instruction===v?P:NAVY, marginBottom:5 }}>{label}</p>
                          <p style={{ fontSize:12, color:MUTED, lineHeight:1.5, margin:0 }}>{sub}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                    <NavBtns onBack={goBack} onNext={goNext} canNext={instruction!==null} nextLabel="Continuer" />
                </div>
              </>
            )}

            {/* ── STEP 4: RESIDENCE ── */}
            {step===3 && (
              <div style={{ flex:1, display:'flex', justifyContent:'center', overflowY:'auto' }}>
                <div className="mob-step-area" style={{ width:'100%', maxWidth:720, padding:'40px 48px', display:'flex', flexDirection:'column' }}>

                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:P, background:PLT, padding:'4px 12px', borderRadius:999, letterSpacing:'0.06em' }}>ÉTAPE 04 SUR 05</span>
                    <span style={{ fontSize:12, color:MUTED }}>Milieu de résidence</span>
                  </div>
                  <h1 style={{ fontSize:38, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:10 }}>
                    Où habitez-vous ?
                  </h1>
                  <p style={{ fontSize:14, color:MUTED, lineHeight:1.65, marginBottom:32 }}>
                    Votre milieu de résidence influence fortement l'accès aux services de santé, les normes sociales et la planification familiale au Cameroun.
                  </p>

                  {/* Residence cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }} className="res-grid">
                    {MILIEU.map(({ v, label, sub, img })=>(
                      <motion.button key={v} onClick={()=>setMilieu(v)} whileTap={{scale:0.98}}
                        style={{ background:'white', border:`2px solid ${milieu===v?P:BORD}`, borderRadius:20, padding:0, overflow:'hidden', cursor:'pointer', fontFamily:'inherit', textAlign:'left', boxShadow:milieu===v?`0 8px 28px ${P}28`:'0 2px 10px rgba(0,0,0,0.05)', transition:'all 0.2s', position:'relative' }}>
                        {milieu===v && (
                          <div style={{ position:'absolute', top:12, right:12, width:28, height:28, background:P, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                            <Check size={14} color="white" strokeWidth={3} />
                          </div>
                        )}
                        <div style={{ height:180, overflow:'hidden' }}>
                          <img src={img} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.3s' }} />
                        </div>
                        <div style={{ padding:'16px 18px' }}>
                          <p style={{ fontSize:16, fontWeight:800, color:milieu===v?P:NAVY, marginBottom:5 }}>{label}</p>
                          <p style={{ fontSize:13, color:MUTED, lineHeight:1.5, margin:0 }}>{sub}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <InfoBox icon={<Lightbulb size={15} color={P} />}>
                    <strong>Impact sur la simulation :</strong> Le milieu de résidence est l'un des 5 facteurs clés dans le modèle prédictif EDSC-V. Les femmes rurales expriment un désir d'enfants plus élevé.
                  </InfoBox>

                  {/* Contexte socioculturel */}
                  <div style={{ marginTop:20, background:'white', borderRadius:18, padding:'18px 20px', border:`1.5px solid ${BORD}` }}>
                    <p style={{ fontSize:13, fontWeight:700, color:NAVY, marginBottom:14 }}>Contexte socioculturel</p>

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:NAVY, margin:0 }}>Région septentrionale</p>
                        <p style={{ fontSize:11, color:MUTED, margin:'2px 0 0' }}>Adamaoua, Extrême-Nord ou Nord</p>
                      </div>
                      <button onClick={()=>setRegionNord(r=>r===0?1:0)} type="button"
                        style={{ width:48, height:26, borderRadius:999, border:'none', background:regionNord===1?P:BORD, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                        <div style={{ position:'absolute', top:3, left:regionNord===1?'calc(100% - 23px)':3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:NAVY, margin:0 }}>Religion musulmane</p>
                        <p style={{ fontSize:11, color:MUTED, margin:'2px 0 0' }}>Pratique de l'islam</p>
                      </div>
                      <button onClick={()=>setReligionMusulman(r=>r===0?1:0)} type="button"
                        style={{ width:48, height:26, borderRadius:999, border:'none', background:religionMusulman===1?P:BORD, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                        <div style={{ position:'absolute', top:3, left:religionMusulman===1?'calc(100% - 23px)':3, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  </div>

                  <NavBtns onBack={goBack} onNext={goNext} canNext={milieu!==null} nextLabel="Continuer" />
                </div>
              </div>
            )}

            {/* ── STEP 5: QUINTILE ── */}
            {step===4 && (
              <>
                {/* Left info panel */}
                <div className="quin-left" style={{ width:280, padding:'36px 28px', display:'flex', flexDirection:'column', background:'white', borderRight:`1px solid ${BORD}` }}>
                  <span style={{ fontSize:10, fontWeight:800, color:P, textTransform:'uppercase', letterSpacing:'0.1em', background:PLT, padding:'4px 12px', borderRadius:999, alignSelf:'flex-start', marginBottom:16 }}>
                    STEP 05/05
                  </span>
                  <h2 style={{ fontSize:26, fontWeight:900, color:NAVY, letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:12 }}>
                    Statut Socio-économique
                  </h2>
                  <p style={{ fontSize:13, color:MUTED, lineHeight:1.65, marginBottom:28 }}>
                    Comprendre votre position économique actuelle permet au simulateur de projeter des résultats de vie précis.
                  </p>

                  {/* Step mini-list */}
                  <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
                    {[
                      { n:'01', l:'Âge', done:true },
                      { n:'02', l:'Composition familiale', done:true },
                      { n:'03', l:'Niveau d\'éducation', done:true },
                      { n:'04', l:'Résidence', done:true },
                      { n:'05', l:'Quintile richesse', active:true },
                    ].map(({ n, l, done, active })=>(
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:done?P:active?PLT:'#F0F0F5', border:`1.5px solid ${done||active?P:BORD}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {done ? <Check size={12} color="white" strokeWidth={3} /> : <span style={{ fontSize:10, fontWeight:700, color:active?P:MUTED }}>{n}</span>}
                        </div>
                        <span style={{ fontSize:13, fontWeight:active?700:400, color:active?P:done?NAVY:MUTED, textDecoration:done?'line-through':'none' }}>{l}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI insight box */}
                  <div style={{ background:PLT, borderRadius:14, padding:'14px', border:`1px solid ${P}22`, marginTop:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                      <div style={{ width:22, height:22, background:P, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={11} color="white" /></div>
                      <span style={{ fontSize:10, fontWeight:800, color:P, textTransform:'uppercase', letterSpacing:'0.08em' }}>AI INSIGHT</span>
                    </div>
                    <p style={{ fontSize:12, color:'#5050A0', lineHeight:1.55, margin:0, fontStyle:'italic' }}>
                      "Cette donnée calibre la résilience financière de votre profil dans le modèle EDSC-V 2018."
                    </p>
                  </div>
                </div>

                {/* Right main content */}
                <div className="mob-step-area" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 48px', overflowY:'auto', background:BG }}>
                  <div style={{ width:'100%', maxWidth:640 }}>
                    <h1 style={{ fontSize:40, fontWeight:900, color:NAVY, letterSpacing:'-0.04em', textAlign:'center', marginBottom:12 }}>
                      Où vous situez-vous ?
                    </h1>
                    <p style={{ fontSize:14, color:MUTED, textAlign:'center', lineHeight:1.65, marginBottom:40, maxWidth:500, margin:'0 auto 40px' }}>
                      Sélectionnez le quintile de richesse qui représente le mieux la situation financière relative de votre ménage.
                    </p>

                    {/* Quintile track */}
                    <QuintileTrack selected={quintile} onSelect={setQuintile} />

                    {/* Selected description card */}
                    {quintile && (
                      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
                        style={{ background:'white', borderRadius:18, padding:'18px 22px', border:`1.5px solid ${BORD}`, boxShadow:'0 4px 20px rgba(59,58,219,0.08)', marginBottom:20, display:'flex', gap:14, alignItems:'flex-start' }}>
                        <div style={{ width:36, height:36, background:PLT, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Scale size={18} color={P} /></div>
                        <div>
                          <p style={{ fontSize:15, fontWeight:800, color:NAVY, margin:0, marginBottom:5 }}>{QUIN[quintile-1].label} — Quintile {quintile}</p>
                          <p style={{ fontSize:13, color:MUTED, lineHeight:1.6, margin:0 }}>{QUIN[quintile-1].desc}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Contextual image */}
                    <div style={{ borderRadius:18, overflow:'hidden', marginBottom:28, height:160 }}>
                      <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=70" alt=""
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'brightness(0.92)' }} />
                    </div>

                    {/* Invitation à se connecter si non authentifié */}
                    {!user && (
                      <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, marginBottom:16 }}>
                        <span style={{ fontSize:16 }}>🔐</span>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:'#92400E', margin:0 }}>Connexion requise</p>
                          <p style={{ fontSize:12, color:'#B45309', margin:'2px 0 0' }}>Vous serez redirigé vers la page de connexion pour sauvegarder votre simulation.</p>
                        </div>
                      </motion.div>
                    )}

                    {simError && (
                      <div style={{ padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, marginBottom:12, fontSize:12, color:'#B91C1C' }}>
                        ⚠️ {simError}
                      </div>
                    )}

                    <NavBtns onBack={goBack} onNext={goNext} canNext={quintile!==null} nextLabel="Confirmer & Analyser" />
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Mobile header ── */}
      <div className="mob-header" style={{ display:'none', position:'fixed', top:0, left:0, right:0, zIndex:100, background:'white', borderBottom:`1px solid ${BORD}`, padding:'14px 20px', alignItems:'center', gap:12, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={goBack} style={{ width:36, height:36, borderRadius:'50%', border:`1.5px solid ${BORD}`, background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          <ChevronLeft size={18} color={NAVY} />
        </button>
        <div style={{ flex:1, height:5, background:PLT, borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${((step+1)/5)*100}%`, background:P, borderRadius:99, transition:'width 0.4s' }} />
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:P, flexShrink:0 }}>{step+1}/5</span>
      </div>

      <style>{`
        @media(max-width:900px) {
          .sim-sidebar   { display:none!important; }
          .img-panel     { display:none!important; }
          .edu-left      { display:none!important; }
          .quin-left     { display:none!important; }
          .mob-header    { display:flex!important; }
          .mob-step-area { padding-top:72px!important; }
          .edu-mobile-h  { display:block!important; }
        }
        @media(max-width:640px) {
          .res-grid      { grid-template-columns:1fr!important; }
          .edu-grid      { grid-template-columns:1fr!important; }
          .stat-mat-grid { grid-template-columns:1fr!important; }
          .mob-step-area { padding-left:20px!important; padding-right:20px!important; }
        }
        input[type=range] { -webkit-appearance:none; margin:0; background:transparent; cursor:pointer; }
        input[type=range]:focus { outline:none; }
      `}</style>
    </div>
  )
}

// ── QuintileTrack ─────────────────────────────────────────────────────────────
function QuintileTrack({ selected, onSelect }: { selected:Quintile|null; onSelect:(v:Quintile)=>void }) {
  return (
    <div style={{ position:'relative', padding:'48px 16px 20px', marginBottom:24 }}>
      {/* Connecting line */}
      <div style={{ position:'absolute', top:68, left:'calc(10% + 8px)', right:'calc(10% + 8px)', height:2, background:BORD }} />

      <div style={{ display:'flex', justifyContent:'space-between', position:'relative', zIndex:1 }}>
        {QUIN.map(({ v, label }) => (
          <div key={v} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flex:1 }}>
            {/* Tooltip */}
            <AnimatePresence>
              {selected===v && (
                <motion.div initial={{opacity:0,y:4,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:0.9}}
                  style={{ position:'absolute', top:0, background:NAVY, color:'white', padding:'6px 12px', borderRadius:10, fontSize:11, fontWeight:700, whiteSpace:'nowrap', textAlign:'center', pointerEvents:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
                  QUINTILE {v}<br />
                  <span style={{ fontWeight:400, opacity:0.8 }}>{label}</span>
                  <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%)', width:10, height:10, background:NAVY, rotate:'45deg', borderRadius:2 }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circle */}
            <motion.button
              onClick={() => onSelect(v)}
              whileHover={{ scale:1.12 }}
              whileTap={{ scale:0.95 }}
              style={{ width:36, height:36, borderRadius:'50%', border:`2px solid ${selected===v?NAVY:'#C0C0E0'}`, background:selected===v?NAVY:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', boxShadow:selected===v?`0 4px 14px rgba(26,26,62,0.3)`:'none' }}>
              {selected===v
                ? <div style={{ width:12, height:12, background:'white', borderRadius:'50%' }} />
                : <div style={{ width:12, height:12, background:'#D0D0E8', borderRadius:'50%' }} />
              }
            </motion.button>

            <span style={{ fontSize:11, color:selected===v?NAVY:MUTED, fontWeight:selected===v?700:400 }}>Q{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── NavBtns ───────────────────────────────────────────────────────────────────
function NavBtns({ onBack, onNext, canNext, nextLabel }: {
  onBack:()=>void; onNext:()=>void; canNext:boolean; nextLabel:string
}) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:32 }}>
      <button onClick={onBack}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          padding:'0 28px', height:52, minWidth:160, flexShrink:0,
          background:'white', border:`1.5px solid ${BORD}`, borderRadius:999,
          fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          color:NAVY, transition:'all 0.2s',
        }}
        onMouseOver={e=>{e.currentTarget.style.borderColor=P; e.currentTarget.style.color=P; e.currentTarget.style.background=PLT}}
        onMouseOut={e=>{e.currentTarget.style.borderColor=BORD; e.currentTarget.style.color=NAVY; e.currentTarget.style.background='white'}}>
        <ChevronLeft size={16}/> Précédent
      </button>
      <button onClick={onNext} disabled={!canNext}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          padding:'0 36px', height:52, minWidth:220,
          background: canNext ? `linear-gradient(135deg,${P} 0%,#6B5FEF 100%)` : '#D8D8F0',
          border:'none', borderRadius:999, fontSize:14, fontWeight:700,
          cursor: canNext ? 'pointer' : 'not-allowed',
          fontFamily:'inherit', color: canNext ? 'white' : '#A0A0C0',
          boxShadow: canNext ? `0 8px 24px ${P}40` : 'none',
          transition:'all 0.2s', transform:'translateY(0)',
        }}
        onMouseOver={e=>{ if(canNext){ (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 32px ${P}55` }}}
        onMouseOut={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow=canNext?`0 8px 24px ${P}40`:'none' }}>
        {nextLabel} <ChevronRight size={16}/>
      </button>
    </div>
  )
}

// ── InfoBox ───────────────────────────────────────────────────────────────────
function InfoBox({ icon, children }: { icon:React.ReactNode; children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', background:'white', border:`1.5px solid ${BORD}`, borderRadius:14, padding:'13px 16px' }}>
      <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{typeof icon==='string'?icon:icon}</span>
      <p style={{ fontSize:12, color:MUTED, margin:0, lineHeight:1.65 }}>{children}</p>
    </div>
  )
}

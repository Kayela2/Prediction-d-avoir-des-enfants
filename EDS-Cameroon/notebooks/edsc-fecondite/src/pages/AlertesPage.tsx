import { motion } from 'framer-motion'
import { Bell, BellOff, CheckCircle, Info, AlertTriangle, Clock } from 'lucide-react'

const fadeUp = { hidden:{opacity:0,y:18}, show:{opacity:1,y:0,transition:{duration:0.4,ease:[0.22,1,0.36,1]}} } satisfies import('framer-motion').Variants
const stagger = { show:{transition:{staggerChildren:0.08}} } satisfies import('framer-motion').Variants

const alerts = [
  { type:'success', icon:CheckCircle, color:'#10B981', bg:'#ECFDF5', border:'#A7F3D0', title:'Simulation complétée', desc:'Votre simulation "Milieu Urbain" a été sauvegardée avec un score de confiance de 84%.', time:'Il y a 2 heures' },
  { type:'info',    icon:Info,         color:'#6366F1', bg:'#EEF2FF', border:'#C7D2FE', title:'Nouvelle mise à jour EDSC-V', desc:'Le modèle de prédiction a été affiné avec de nouvelles données démographiques. Vos résultats peuvent légèrement évoluer.', time:'Il y a 1 jour' },
  { type:'warning', icon:AlertTriangle, color:'#F59E0B', bg:'#FFFBEB', border:'#FDE68A', title:'Simulation incomplète', desc:'Vous avez commencé une simulation il y a 3 jours sans la terminer. Reprenez là où vous en étiez.', time:'Il y a 3 jours' },
  { type:'info',    icon:Clock,         color:'#06B6D4', bg:'#ECFEFF', border:'#A5F3FC', title:'Rappel : Résultats expirés', desc:'Vos résultats de simulation datent de plus de 30 jours. Nous recommandons une nouvelle simulation pour des données à jour.', time:'Il y a 1 semaine' },
]

export default function AlertesPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ fontFamily:"'Inter',sans-serif", maxWidth:680, margin:'0 auto' }}>
      <motion.div variants={fadeUp} style={{ marginBottom:32 }}>
        <p style={{ fontSize:12, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>CENTRE DE NOTIFICATIONS</p>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#0F172A', letterSpacing:'-0.03em', marginBottom:4 }}>Alertes</h1>
        <p style={{ fontSize:14, color:'#64748B' }}>Vos notifications et mises à jour importantes.</p>
      </motion.div>

      {/* Toggle row */}
      <motion.div variants={fadeUp} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'white', borderRadius:18, padding:'16px 20px', border:'1px solid #E2E8F0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{ width:40, height:40, background:'#EEF2FF', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Bell size={19} color="#6366F1" />
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'#0F172A', margin:0 }}>Notifications activées</p>
            <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>Recevez des mises à jour sur vos simulations</p>
          </div>
        </div>
        <div style={{ width:48, height:26, background:'#6366F1', borderRadius:999, position:'relative', cursor:'pointer' }}>
          <div style={{ position:'absolute', right:3, top:'50%', transform:'translateY(-50%)', width:20, height:20, background:'white', borderRadius:'50%', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </motion.div>

      {/* Alert list */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {alerts.map(({ icon:Icon, color, bg, border, title, desc, time }, i) => (
          <motion.div key={i} variants={fadeUp}
            style={{ background:'white', borderRadius:18, padding:'18px 20px', border:'1px solid #E2E8F0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', display:'flex', gap:14, transition:'box-shadow 0.15s' }}
            onMouseOver={e => (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'}
            onMouseOut={e => (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 10px rgba(0,0,0,0.04)'}>
            <div style={{ width:42, height:42, background:bg, border:`1px solid ${border}`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0F172A', margin:0 }}>{title}</p>
                <span style={{ fontSize:11, color:'#94A3B8', fontWeight:500, flexShrink:0, marginLeft:12 }}>{time}</span>
              </div>
              <p style={{ fontSize:13, color:'#64748B', lineHeight:1.65, margin:0 }}>{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state hint */}
      <motion.div variants={fadeUp} style={{ marginTop:24, textAlign:'center', padding:'24px', background:'#F8FAFC', borderRadius:18, border:'1px dashed #E2E8F0' }}>
        <BellOff size={24} color="#CBD5E1" style={{ margin:'0 auto 10px' }} />
        <p style={{ fontSize:13, color:'#94A3B8', fontWeight:500 }}>Vous êtes à jour ! Aucune autre notification.</p>
      </motion.div>
    </motion.div>
  )
}

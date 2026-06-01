import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Globe, Moon, ChevronRight, LogOut, Camera } from 'lucide-react'
import { useStore } from '../store/useStore'

const fadeUp = { hidden:{opacity:0,y:18}, show:{opacity:1,y:0,transition:{duration:0.4,ease:'easeOut'}} } satisfies import('framer-motion').Variants
const stagger = { show:{transition:{staggerChildren:0.07}} } satisfies import('framer-motion').Variants

function Toggle({ on, onChange }: { on:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div onClick={() => onChange(!on)}
      style={{ width:46, height:26, background:on?'#6366F1':'#E2E8F0', borderRadius:999, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:on?22:3, width:20, height:20, background:'white', borderRadius:'50%', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s' }} />
    </div>
  )
}

export default function ReglagesPage() {
  const { user, logout } = useStore()
  const nav = useNavigate()
  const [notifs, setNotifs] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ fontFamily:"'Inter',sans-serif", maxWidth:620, margin:'0 auto' }}>
      <motion.div variants={fadeUp} style={{ marginBottom:32 }}>
        <p style={{ fontSize:12, color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>PARAMÈTRES</p>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#0F172A', letterSpacing:'-0.03em', marginBottom:4 }}>Réglages</h1>
        <p style={{ fontSize:14, color:'#64748B' }}>Gérez votre compte et vos préférences.</p>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={fadeUp} style={{ background:'linear-gradient(135deg,#EEF2FF,#E0E7FF)', borderRadius:22, padding:'24px', border:'1px solid #C7D2FE', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative' }}>
            {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'3px solid #6366F1', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }} />
            : <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, color:'white', border:'3px solid #6366F1' }}>{user?.name?.charAt(0).toUpperCase()}</div>
          }
            <button style={{ position:'absolute', bottom:0, right:0, width:24, height:24, background:'#6366F1', border:'2px solid white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Camera size={12} color="white" />
            </button>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:18, fontWeight:800, color:'#3730A3', margin:0 }}>{user?.name}</p>
            <p style={{ fontSize:13, color:'#6366F1', margin:0, marginTop:2 }}>{user?.email}</p>
            <span style={{ display:'inline-block', fontSize:11, fontWeight:700, color:'white', background:'#6366F1', padding:'3px 10px', borderRadius:999, marginTop:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Plan {user?.plan}
            </span>
          </div>
          <button style={{ padding:'9px 16px', background:'white', border:'1.5px solid #C7D2FE', borderRadius:12, fontSize:13, fontWeight:700, color:'#4F46E5', cursor:'pointer', fontFamily:'inherit' }}>
            Modifier
          </button>
        </div>
      </motion.div>

      {/* Settings sections */}
      {[
        {
          title:'Notifications', icon:Bell, color:'#6366F1', bg:'#EEF2FF',
          items:[
            { label:'Notifications push', desc:'Alertes simulations et mises à jour', toggle:true, value:notifs, onChange:setNotifs },
            { label:'Emails hebdomadaires', desc:'Résumé de vos activités', toggle:true, value:analytics, onChange:setAnalytics },
          ]
        },
        {
          title:'Confidentialité', icon:Shield, color:'#10B981', bg:'#ECFDF5',
          items:[
            { label:'Collecte analytique', desc:'Aide à améliorer l\'application', toggle:true, value:analytics, onChange:setAnalytics },
            { label:'Données anonymisées', desc:'Vos données ne sont jamais partagées', toggle:false, value:true, onChange:()=>{} },
          ]
        },
        {
          title:'Apparence', icon:Moon, color:'#8B5CF6', bg:'#F5F3FF',
          items:[
            { label:'Mode sombre', desc:'Thème sombre pour l\'interface', toggle:true, value:darkMode, onChange:setDarkMode },
          ]
        },
        {
          title:'Langue & Région', icon:Globe, color:'#F59E0B', bg:'#FFFBEB',
          items:[
            { label:'Langue', desc:'Français (Cameroun)', toggle:false, value:false, onChange:()=>{}, action:'Modifier' },
            { label:'Région', desc:'Afrique Centrale', toggle:false, value:false, onChange:()=>{}, action:'Modifier' },
          ]
        },
      ].map(({ title, icon:Icon, color, bg, items }) => (
        <motion.div key={title} variants={fadeUp} style={{ background:'white', borderRadius:20, border:'1px solid #E2E8F0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', marginBottom:14, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
            <div style={{ width:36, height:36, background:bg, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>{title}</span>
          </div>
          {items.map((item, i) => { const { label, desc, toggle, value, onChange } = item; const action = 'action' in item ? item.action : undefined; return (
            <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:i<items.length-1?'1px solid #F8FAFC':'none' }}>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:'#0F172A', margin:0 }}>{label}</p>
                <p style={{ fontSize:12, color:'#94A3B8', margin:0, marginTop:2 }}>{desc}</p>
              </div>
              {toggle
                ? <Toggle on={value} onChange={onChange} />
                : action
                  ? <button style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', fontSize:13, color:'#6366F1', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{action} <ChevronRight size={14} /></button>
                  : null
              }
            </div>
          )})}
        </motion.div>
      ))}

      {/* Account section */}
      <motion.div variants={fadeUp} style={{ background:'white', borderRadius:20, border:'1px solid #E2E8F0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', overflow:'hidden', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
          <div style={{ width:36, height:36, background:'#FEF2F2', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <User size={18} color="#EF4444" />
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>Compte</span>
        </div>
        <button onClick={() => { logout(); nav('/login') }} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'16px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          <LogOut size={17} color="#EF4444" />
          <span style={{ fontSize:14, fontWeight:600, color:'#EF4444' }}>Se déconnecter</span>
        </button>
      </motion.div>

      <motion.div variants={fadeUp} style={{ textAlign:'center', padding:'16px' }}>
        <p style={{ fontSize:12, color:'#CBD5E1', fontWeight:500 }}>Hearth v1.0.0 · EDSC-V 2018 · INS Cameroun</p>
      </motion.div>
    </motion.div>
  )
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, BarChart2, Clock, Bell, Settings, User, Plus, LogOut, Heart } from 'lucide-react'
import { useStore } from '../../store/useStore'
import Button from '../ui/Button'

const sidebarNav = [
  { to:'/dashboard',            label:'Accueil',    icon:Home,     end:true },
  { to:'/simulation',           label:'Simuler',    icon:BarChart2 },
  { to:'/dashboard/historique', label:'Historique', icon:Clock },
  { to:'/dashboard/alertes',    label:'Alertes',    icon:Bell },
  { to:'/dashboard/reglages',   label:'Réglages',   icon:Settings },
]
const bottomNav = [
  { to:'/dashboard',            label:'Accueil',    icon:Home,     end:true },
  { to:'/simulation',           label:'Simuler',    icon:BarChart2 },
  { to:'/dashboard/historique', label:'Historique', icon:Clock },
  { to:'/dashboard/reglages',   label:'Profil',     icon:User },
]

export default function DashboardLayout() {
  const user   = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const nav    = useNavigate()

  function handleLogout() {
    logout()
    nav('/login')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Sidebar desktop ── */}
      <aside className="db-sidebar" style={{
        width:256, background:'#070B18',
        display:'flex', flexDirection:'column',
        padding:'24px 14px',
        position:'fixed', top:0, left:0, bottom:0, zIndex:40,
      }}>
        {/* Logo */}
        <div onClick={() => nav('/')} style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 10px', marginBottom:36, cursor:'pointer' }}>
          <div style={{ width:38, height:38, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 18px rgba(99,102,241,0.5)', flexShrink:0 }}><Heart size={19} color="white" strokeWidth={2.5} /></div>
          <span style={{ fontWeight:800, fontSize:19, color:'white', letterSpacing:'-0.03em' }}>Hearth</span>
        </div>

        <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 10px', marginBottom:8 }}>NAVIGATION</p>

        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
          {sidebarNav.map(item => (
            <NavLink key={item.label} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12,
                textDecoration:'none', fontWeight:isActive?600:400, fontSize:14, transition:'all 0.15s',
                color:isActive?'white':'rgba(255,255,255,0.4)',
                background:isActive?'rgba(99,102,241,0.2)':'transparent',
                borderLeft:isActive?'2px solid #6366F1':'2px solid transparent',
              })}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button onClick={() => nav('/simulation')} fullWidth size="md" leftIcon={<Plus size={16} />}
          style={{ marginBottom:14 }}>
          Nouvelle simulation
        </Button>

        {user && (
          <div style={{ borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:15, fontWeight:700, color:'white' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:700, fontSize:13, color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', margin:0 }}>{user.name}</p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:0, marginTop:1, textTransform:'capitalize' }}>Plan {user.plan}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'rgba(239,68,68,0.08)', border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', color:'#FCA5A5', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background='rgba(239,68,68,0.16)')}
              onMouseOut={e => (e.currentTarget.style.background='rgba(239,68,68,0.08)')}>
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="db-main" style={{ flex:1, marginLeft:256, minHeight:'100vh', padding:'32px 28px 80px' }}>
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav className="db-bottom-nav" style={{ position:'fixed', bottom:0, left:0, right:0, background:'#070B18', borderTop:'1px solid rgba(255,255,255,0.07)', display:'none', padding:'6px 0 22px', zIndex:50 }}>
        <div style={{ display:'flex' }}>
          {bottomNav.map(item => (
            <NavLink key={item.label} to={item.to} end={item.end}
              style={({ isActive }) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', padding:'4px 0', color:isActive?'#818CF8':'rgba(255,255,255,0.3)', fontSize:10, fontWeight:isActive?700:400 })}>
              {({ isActive }) => (
                <>
                  <div style={{ width:48, height:30, borderRadius:16, background:isActive?'rgba(99,102,241,0.2)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <item.icon size={20} color={isActive?'#818CF8':'rgba(255,255,255,0.3)'} />
                  </div>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <style>{`
        @media(max-width:768px){
          .db-sidebar{display:none!important;}
          .db-bottom-nav{display:block!important;}
          .db-main{margin-left:0!important;padding:20px 16px 90px!important;}
        }
      `}</style>
    </div>
  )
}

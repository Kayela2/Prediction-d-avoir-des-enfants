import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, ArrowRight, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

const statusColors: Record<string, string> = {
  completed: '#16A34A',
  active:    '#4F46E5',
  archived:  '#94A3B8',
}
const statusLabels: Record<string, string> = {
  completed: 'Complété',
  active:    'En cours',
  archived:  'Archivé',
}

const tabs = ['Tous', 'En cours', 'Complétés', 'Archivés']

export default function HistoryPage() {
  const navigate = useNavigate()
  const { simulations, deleteSimulation } = useStore()
  const [tab, setTab] = useState('Tous')
  const [query, setQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { useStore.getState().fetchSimulations() }, [])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setDeleting(id)
    try { await deleteSimulation(id) } finally { setDeleting(null) }
  }

  const filtered = simulations.filter(s => {
    const matchTab =
      tab === 'Tous' ||
      (tab === 'En cours' && s.status === 'active') ||
      (tab === 'Complétés' && s.status === 'completed') ||
      (tab === 'Archivés' && s.status === 'archived')
    const matchQuery = s.title.toLowerCase().includes(query.toLowerCase())
    return matchTab && matchQuery
  })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>HISTORIQUE</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>Mes simulations</h1>
        </div>
        <button onClick={() => navigate('/simulation')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px',
            background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
            color: 'white', border: 'none', borderRadius: 999,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
          }}>
          <Plus size={14} /> Nouvelle
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} color="var(--text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Rechercher une simulation…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px 12px 40px',
            background: 'white', border: '1.5px solid var(--border)',
            borderRadius: 12, fontSize: 14, color: 'var(--text)',
            fontFamily: 'inherit', outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '7px 16px',
              background: tab === t ? 'var(--primary)' : 'white',
              color: tab === t ? 'white' : 'var(--text-muted)',
              border: `1.5px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>Aucune simulation trouvée</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Essayez un autre filtre ou créez une nouvelle simulation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((sim, i) => (
            <motion.div key={sim.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/dashboard/resultats/${sim.id}`)}
              style={{
                background: 'white', borderRadius: 18, padding: '18px 20px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(79,70,229,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-xs)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>

              <div style={{ width: 48, height: 48, background: 'var(--surface-low)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                {sim.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{sim.title}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: statusColors[sim.status], flexShrink: 0 }}>
                    {statusLabels[sim.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${sim.confidence ?? 0}%` }} transition={{ duration: 0.8, delay: 0.1 + i * 0.1 }}
                      style={{ height: '100%', background: `linear-gradient(90deg, var(--primary), #7C3AED)`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{sim.confidence ?? '–'}%</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0, marginTop: 4 }}>{fmtDate(sim.createdAt)}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={(e) => handleDelete(e, sim.id)}
                  disabled={deleting === sim.id}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: deleting === sim.id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  <Trash2 size={14} color="#EF4444" />
                </button>
                <ArrowRight size={16} color="var(--text-faint)" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

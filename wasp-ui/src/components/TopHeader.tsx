import { useLocation } from 'react-router-dom'
import { useActiveCase } from '../hooks/useActiveCase'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/cases': 'Cases',
  '/cases/new': 'New Case',
  '/evidence': 'Evidence',
  '/artifacts': 'Artifacts',
  '/timeline': 'Timeline',
  '/investigation': 'Investigation',
  '/lineage': 'Process Lineage',
  '/rules': 'Rules / Detection',
  '/reports': 'Reports',
  '/system': 'System Status',
  '/settings': 'Settings',
}

export function TopHeader() {
  const location = useLocation()
  const { activeCase } = useActiveCase()
  const pageLabel = PAGE_LABELS[location.pathname] || 'WASP'

  return (
    <header className="top-header">
      <div className="header-breadcrumb">
        <span>WASP</span>
        <span className="crumb-sep">›</span>
        <span className="crumb-active">{pageLabel}</span>
        {activeCase && (
          <>
            <span className="crumb-sep">›</span>
            <span style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {activeCase.case_id}
            </span>
          </>
        )}
      </div>

      <div className="header-meta">
        {activeCase && (
          <div className="header-badge">
            <span style={{ color: 'var(--text-muted)' }}>Case</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {activeCase.case_id}
            </span>
          </div>
        )}
        {activeCase && (
          <div className="header-badge">
            <span style={{ color: 'var(--text-muted)' }}>Examiner</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {activeCase.examiner?.split(' ').slice(0, 2).join(' ')}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

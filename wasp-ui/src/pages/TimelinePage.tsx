import { useState } from 'react'
import { useActiveCase } from '../hooks/useActiveCase'
import { useQuery } from '../hooks/useQuery'
import { getTimeline } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { SeverityBadge } from '../components/SeverityBadge'
import { Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'

function fmt(ts: string) {
  try { return format(new Date(ts), 'yyyy-MM-dd HH:mm:ss') } catch { return ts }
}

export function TimelinePage() {
  const { activeCaseId } = useActiveCase()
  
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('')
  const [limit, setLimit] = useState(200)

  // Quick debounce
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  // Actually we'll just search on enter or button click for simplicity in this demo,
  // or on blur. Let's just pass search as state directly to query and it will refetch.

  const { data: timeline, isLoading, error, refetch } = useQuery(
    `timeline-${activeCaseId}-${limit}-${severity}-${debouncedSearch}`,
    () => getTimeline(activeCaseId!, { limit, severity: severity || undefined, search: debouncedSearch || undefined }),
    { enabled: !!activeCaseId }
  )

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(search)
    }
  }

  if (!activeCaseId) {
    return (
      <div className="page-content">
        <div className="state-container">
          <Clock className="state-icon" />
          <div className="state-title">No Case Selected</div>
          <p className="state-message">Please select an active case to view the super timeline.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Super Timeline</div>
        <div className="page-subtitle">Chronological sequence of all forensic artifacts</div>
      </div>

      <div className="filter-bar">
        <Filter size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          className="filter-input" 
          placeholder="Search events... (Enter)" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          onBlur={() => setDebouncedSearch(search)}
        />
        <select className="filter-select" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="INFO">Info</option>
        </select>
        <select className="filter-select" value={limit} onChange={e => setLimit(Number(e.target.value))}>
          <option value="100">100 events</option>
          <option value="200">200 events</option>
          <option value="500">500 events</option>
        </select>
      </div>

      <div className="card">
        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && timeline?.events?.length === 0}
          emptyTitle="No Events Found"
          emptyMessage="No events match your current filters, or the timeline hasn't been built yet."
          onRetry={refetch}
        >
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Source</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Object / Path</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {timeline?.events.map(ev => (
                  <tr key={ev.event_id}>
                    <td className="td-mono">{fmt(ev.timestamp_utc)}</td>
                    <td className="td-muted">{ev.plugin}</td>
                    <td><span style={{ fontWeight: 600 }}>{ev.action}</span></td>
                    <td className="td-dim">{ev.user || '—'}</td>
                    <td className="td-dim" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ev.object_path || ''}>
                      {ev.object_path || '—'}
                    </td>
                    <td>
                      <SeverityBadge severity={ev.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </div>
  )
}

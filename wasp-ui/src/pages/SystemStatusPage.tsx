import { useHealth } from '../hooks/useHealth'
import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export function SystemStatusPage() {
  const { data: health, isLoading } = useHealth()

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">System Status</div>
        <div className="page-subtitle">WASP Platform Health</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <div className="card-title">Backend Connection</div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="state-container" style={{ minHeight: 100 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="kv-list">
              <div className="kv-row">
                <span className="kv-label">API Status</span>
                <span className="kv-value" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: health?.status === 'ok' ? 'var(--status-verified)' : 'var(--sev-critical)' }}>
                  {health?.status === 'ok' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {health?.status === 'ok' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Version</span>
                <span className="kv-value mono">{health?.version || '—'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">YARA Engine</span>
                <span className="kv-value">
                  {health?.yara_available ? 'Available' : 'Unavailable (yara-python not installed/compiled)'}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Server Time</span>
                <span className="kv-value mono">
                  {health?.timestamp ? format(new Date(health.timestamp), 'yyyy-MM-dd HH:mm:ss') : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

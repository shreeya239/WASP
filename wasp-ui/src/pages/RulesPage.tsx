import { useActiveCase } from '../hooks/useActiveCase'
import { useQuery } from '../hooks/useQuery'
import { getSigmaAlerts, getThreatAlerts } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { Shield } from 'lucide-react'
import { SeverityBadge } from '../components/SeverityBadge'

export function RulesPage() {
  const { activeCaseId } = useActiveCase()

  const { data: sigma, isLoading: sLoad } = useQuery(
    `sigma-${activeCaseId}`,
    () => getSigmaAlerts(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  const { data: yara, isLoading: yLoad } = useQuery(
    `threats-${activeCaseId}`,
    () => getThreatAlerts(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  if (!activeCaseId) {
    return (
      <div className="page-content">
        <div className="state-container">
          <Shield className="state-icon" />
          <div className="state-title">No Case Selected</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Rules &amp; Detection</div>
        <div className="page-subtitle">Sigma and YARA threat detection rules</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sigma Engine</div>
            <SeverityBadge severity="VERIFIED" label="ONLINE" />
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <AsyncState
              isLoading={sLoad}
              isEmpty={!sLoad && sigma?.length === 0}
              emptyTitle="No Sigma Matches"
              emptyMessage="No events matched any loaded Sigma rules."
            >
              {sigma?.map((alert, i) => (
                <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <SeverityBadge severity={alert.level} />
                    <span style={{ fontWeight: 600 }}>{alert.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Rule: <span className="td-mono">{alert.rule_id}</span>
                  </div>
                </div>
              ))}
            </AsyncState>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">YARA Engine</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <AsyncState
              isLoading={yLoad}
              isEmpty={!yLoad && yara?.length === 0}
              emptyTitle="No YARA Matches"
              emptyMessage="YARA scanning did not return any results, or the engine is unavailable."
            >
              {yara?.map((alert: any, i) => (
                <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                   <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <SeverityBadge severity={alert.severity || 'HIGH'} />
                    <span style={{ fontWeight: 600 }}>{alert.rule_name || 'YARA Match'}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Target: <span className="td-mono">{alert.target || '—'}</span>
                  </div>
                </div>
              ))}
            </AsyncState>
          </div>
        </div>
      </div>
    </div>
  )
}

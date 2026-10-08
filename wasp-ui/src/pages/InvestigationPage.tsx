import { useActiveCase } from '../hooks/useActiveCase'
import { useQuery } from '../hooks/useQuery'
import { getAnomalies, getSigmaAlerts, getCorroboration } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { SeverityBadge } from '../components/SeverityBadge'
import { Zap } from 'lucide-react'
import { format } from 'date-fns'

function fmt(ts: string) {
  try { return format(new Date(ts), 'yyyy-MM-dd HH:mm:ss') } catch { return ts }
}

export function InvestigationPage() {
  const { activeCaseId } = useActiveCase()

  const { data: anomalies, isLoading: aLoad } = useQuery(
    `anom-${activeCaseId}`,
    () => getAnomalies(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  const { data: sigma, isLoading: sLoad } = useQuery(
    `sigma-${activeCaseId}`,
    () => getSigmaAlerts(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  const { data: corroboration, isLoading: cLoad } = useQuery(
    `corrob-${activeCaseId}`,
    () => getCorroboration(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  const isLoading = aLoad || sLoad || cLoad

  if (!activeCaseId) {
    return (
      <div className="page-content">
        <div className="state-container">
          <Zap className="state-icon" />
          <div className="state-title">No Case Selected</div>
          <p className="state-message">Please select an active case to view investigation findings.</p>
        </div>
      </div>
    )
  }

  const hasFindings = (anomalies && anomalies.length > 0) || (sigma && sigma.length > 0) || (corroboration && corroboration.conflicts?.length > 0)

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Investigation Findings</div>
        <div className="page-subtitle">Suspicious events, statistical anomalies, and evidence conflicts</div>
      </div>

      <AsyncState isLoading={isLoading}>
        {!hasFindings ? (
          <div className="state-container card">
            <div className="state-title">No Suspicious Findings</div>
            <p className="state-message">Analysis completed without any high-confidence alerts, anomalies, or evidentiary conflicts.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {sigma && sigma.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-secondary)' }}>Sigma Threat Rules</h3>
                {sigma.map((alert, i) => (
                  <div key={i} className={`finding-card ${alert.level.toLowerCase()}`}>
                    <div className="finding-header">
                      <SeverityBadge severity={alert.level} />
                      <span className="finding-title">{alert.title}</span>
                    </div>
                    <div className="finding-body">{alert.description}</div>
                    <div className="finding-meta">
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Rule ID</span>
                        <span className="finding-meta-value">{alert.rule_id}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Time (UTC)</span>
                        <span className="finding-meta-value">{fmt(alert.timestamp_utc)}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Event ID</span>
                        <span className="finding-meta-value" style={{ fontSize: 10 }}>{alert.event_id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {anomalies && anomalies.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-secondary)' }}>Statistical Anomalies</h3>
                {anomalies.map((anom) => (
                  <div key={anom.anomaly_id} className={`finding-card ${anom.severity.toLowerCase()}`}>
                    <div className="finding-header">
                      <SeverityBadge severity={anom.severity} />
                      <span className="finding-title">{anom.title}</span>
                    </div>
                    <div className="finding-body">{anom.description}</div>
                    <div className="finding-meta">
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Window Start</span>
                        <span className="finding-meta-value">{fmt(anom.window_start_utc)}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Z-Score</span>
                        <span className="finding-meta-value">{anom.z_score.toFixed(2)}σ</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Value</span>
                        <span className="finding-meta-value">{anom.metric_value} (vs base {anom.baseline_value.toFixed(2)})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {corroboration && corroboration.conflicts?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-secondary)' }}>Anti-Forensics Conflicts</h3>
                {corroboration.conflicts.map((conf, i) => (
                  <div key={i} className={`finding-card ${conf.severity.toLowerCase()}`}>
                    <div className="finding-header">
                      <SeverityBadge severity={conf.severity} />
                      <span className="finding-title">{conf.conflict_type.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="finding-body">{conf.description}</div>
                    <div className="finding-meta">
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Entity</span>
                        <span className="finding-meta-value">{conf.entity}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Evidentiary Source</span>
                        <span className="finding-meta-value">{conf.evidence_ids.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AsyncState>
    </div>
  )
}

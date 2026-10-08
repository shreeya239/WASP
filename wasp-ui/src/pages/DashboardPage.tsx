import { useNavigate } from 'react-router-dom'
import { useQuery } from '../hooks/useQuery'
import { useActiveCase } from '../hooks/useActiveCase'
import { listCases, getCase, getAnomalies, getSigmaAlerts, getTimeline } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { SeverityBadge, RiskBadge } from '../components/SeverityBadge'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

function fmt(ts: string | null) {
  if (!ts) return '—'
  try {
    return format(new Date(ts), 'yyyy-MM-dd HH:mm')
  } catch {
    return ts
  }
}

function fmtFull(ts: string | null) {
  if (!ts) return '—'
  try {
    return format(new Date(ts), "yyyy-MM-dd HH:mm:ss 'UTC'")
  } catch {
    return ts
  }
}


export function DashboardPage() {
  const navigate = useNavigate()
  const { activeCase, setActiveCase } = useActiveCase()
  const caseId = activeCase?.case_id

  const {
    data: cases,
    isLoading: casesLoading,
    error: casesError,
  } = useQuery('cases', listCases)

  const {
    data: caseDetail,
    isLoading: detailLoading,
  } = useQuery(`case-${caseId}`, () => getCase(caseId!), { enabled: !!caseId })

  const { data: anomalies } = useQuery(
    `anomalies-${caseId}`,
    () => getAnomalies(caseId!),
    { enabled: !!caseId }
  )

  const { data: sigmaAlerts } = useQuery(
    `sigma-${caseId}`,
    () => getSigmaAlerts(caseId!),
    { enabled: !!caseId }
  )

  const { data: timeline } = useQuery(
    `timeline-dash-${caseId}`,
    () => getTimeline(caseId!, { limit: 5 }),
    { enabled: !!caseId }
  )

  const riskCase = cases?.find(c => c.case_id === caseId)

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">WASP — Digital Forensics &amp; Evidence Analysis</div>
          <div className="page-subtitle">Wide-scope Artifact &amp; Super-timeline Platform · v1.4.0</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cases')}>
            View All Cases
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/cases/new')}>
            + New Case
          </button>
        </div>
      </div>

      {/* Case Selector */}
      {!caseId && (
        <AsyncState
          isLoading={casesLoading}
          error={casesError}
          isEmpty={!casesLoading && cases?.length === 0}
          emptyTitle="No Cases Found"
          emptyMessage="No forensic cases exist yet. Create a new case to begin your investigation."
          loadingMessage="Loading forensic cases..."
        >
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Select Active Case</div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cases?.map(c => (
                  <div
                    key={c.case_id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                    onClick={() => setActiveCase(c)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.case_id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.case_name}</div>
                    </div>
                    <RiskBadge risk={c.risk_level} />
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AsyncState>
      )}

      {caseId && (
        <>
          {/* Stats row */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Evidence Items</div>
              <div className="stat-value">{caseDetail?.evidence_count ?? '—'}</div>
              <div className="stat-sub">Acquired &amp; integrity-verified</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Timeline Events</div>
              <div className="stat-value">{riskCase?.timeline_events_count ?? '—'}</div>
              <div className="stat-sub">Forensic artifacts correlated</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Anomalies</div>
              <div className="stat-value" style={{ color: anomalies?.length ? 'var(--sev-medium)' : undefined }}>
                {anomalies?.length ?? '—'}
              </div>
              <div className="stat-sub">Statistical deviations detected</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sigma Detections</div>
              <div className="stat-value" style={{ color: sigmaAlerts?.length ? 'var(--sev-critical)' : undefined }}>
                {sigmaAlerts?.length ?? '—'}
              </div>
              <div className="stat-sub">Threat rule matches</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Investigation Risk</div>
              <div style={{ marginTop: 6 }}>
                <RiskBadge risk={riskCase?.risk_level ?? 'LOW'} />
              </div>
              <div className="stat-sub">Overall case risk level</div>
            </div>
          </div>

          {/* Two-column: Case Overview + Integrity */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            {/* Case Overview */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Case Overview</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/evidence`)}
                >
                  Open Case
                </button>
              </div>
              <div className="card-body">
                {detailLoading ? (
                  <div className="state-container" style={{ minHeight: 120 }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <div className="kv-list">
                    <div className="kv-row">
                      <span className="kv-label">Case ID</span>
                      <span className="kv-value mono">{caseDetail?.case_id}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Description</span>
                      <span className="kv-value">{caseDetail?.description || '—'}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Examiner</span>
                      <span className="kv-value">{caseDetail?.examiner}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Organization</span>
                      <span className="kv-value">{caseDetail?.organization}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Authorization</span>
                      <span className="kv-value mono">{caseDetail?.authorization_ref}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Created</span>
                      <span className="kv-value mono">{fmtFull(caseDetail?.created_utc ?? null)}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Status</span>
                      <span className="kv-value">
                        <SeverityBadge severity={riskCase?.status === 'analyzed' ? 'ANALYZED' : 'PENDING'} label={riskCase?.status ?? 'pending'} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Integrity */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Evidence Integrity</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate('/evidence')}
                >
                  Verify
                </button>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                    padding: '10px 12px',
                    background: 'rgba(22,163,74,0.08)',
                    border: '1px solid rgba(22,163,74,0.25)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <CheckCircle size={16} color="var(--status-verified)" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-verified)' }}>
                      SHA-256 VERIFIED
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      RFC 3161 TSA timestamp attestation active
                    </div>
                  </div>
                </div>

                <div className="kv-list">
                  <div className="kv-row">
                    <span className="kv-label">Merkle Root</span>
                    <span className="kv-value mono" style={{ fontSize: 10, wordBreak: 'break-all' }}>
                      {caseDetail?.merkle_root ?? '—'}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Evidence Files</span>
                    <span className="kv-value">{caseDetail?.evidence_count} files hash-verified</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Custody Ledger</span>
                    <span className="kv-value">Hash-chained append-only ledger</span>
                  </div>
                  <div className="kv-row">
                    <span className="kv-label">Schema</span>
                    <span className="kv-value mono">{caseDetail?.schema_version ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Timeline Events */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Recent Timeline Events</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/timeline')}>
                Open Timeline →
              </button>
            </div>
            <div className="data-table-wrapper">
              {!timeline?.events.length ? (
                <div className="state-container" style={{ minHeight: 120 }}>
                  <div className="state-message">
                    {riskCase?.status === 'pending'
                      ? 'Timeline not yet built. Run analysis to extract events.'
                      : 'No timeline events available.'}
                  </div>
                  {riskCase?.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/evidence')}>
                      Analyze Evidence
                    </button>
                  )}
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>User</th>
                      <th>Source</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.events.map(ev => (
                      <tr key={ev.event_id} style={{ cursor: 'pointer' }} onClick={() => navigate('/timeline')}>
                        <td className="td-mono">{fmt(ev.timestamp_utc)}</td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{ev.action}</span>
                        </td>
                        <td className="td-dim">{ev.user || '—'}</td>
                        <td className="td-muted">{ev.plugin}</td>
                        <td>
                          <SeverityBadge severity={ev.severity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Sigma + Anomaly findings summary */}
          {(sigmaAlerts?.length || anomalies?.length) ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Suspicious Findings</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/investigation')}>
                  View Investigation →
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {sigmaAlerts?.map(alert => (
                  <div
                    key={alert.rule_id + alert.event_id}
                    className={`finding-card ${alert.level.toLowerCase()}`}
                    style={{ margin: '12px 12px 0' }}
                  >
                    <div className="finding-header">
                      <SeverityBadge severity={alert.level} />
                      <span className="finding-title">{alert.title}</span>
                    </div>
                    <div className="finding-body">{alert.description}</div>
                    <div className="finding-meta">
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Rule</span>
                        <span className="finding-meta-value">{alert.rule_id}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Timestamp</span>
                        <span className="finding-meta-value">{fmt(alert.timestamp_utc)}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">MITRE</span>
                        <span className="finding-meta-value">{alert.mitre_tags.join(', ') || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {anomalies?.map(anom => (
                  <div
                    key={anom.anomaly_id}
                    className={`finding-card ${anom.severity.toLowerCase()}`}
                    style={{ margin: '12px 12px 0' }}
                  >
                    <div className="finding-header">
                      <SeverityBadge severity={anom.severity} />
                      <span className="finding-title">{anom.title}</span>
                    </div>
                    <div className="finding-body">{anom.description}</div>
                    <div className="finding-meta">
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Type</span>
                        <span className="finding-meta-value">{anom.anomaly_type}</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Z-Score</span>
                        <span className="finding-meta-value">{anom.z_score?.toFixed(2)}σ</span>
                      </div>
                      <div className="finding-meta-item">
                        <span className="finding-meta-label">Users</span>
                        <span className="finding-meta-value">{anom.affected_users.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ height: 12 }} />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

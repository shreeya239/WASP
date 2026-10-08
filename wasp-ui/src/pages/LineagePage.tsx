import { useActiveCase } from '../hooks/useActiveCase'
import { useQuery } from '../hooks/useQuery'
import { getLineage } from '../api/client'; import type { ProcessNode } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { TreePine } from 'lucide-react'

function ProcessTreeNode({ node, level = 0 }: { node: ProcessNode, level?: number }) {
  const hasAlert = node.threat_alerts && node.threat_alerts.length > 0
  
  return (
    <div style={{ marginLeft: level > 0 ? 24 : 0 }}>
      {level > 0 && <span className="process-connector">↳ </span>}
      <div className={`process-node ${hasAlert ? 'has-alert' : ''}`} style={{ display: 'inline-block', minWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.process_name}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>PID: {node.pid}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>[{node.user || 'UNKNOWN'}]</span>
          {hasAlert && (
            <span style={{ color: 'var(--sev-high)', fontSize: 10, fontWeight: 700, padding: '1px 4px', background: 'var(--sev-high-bg)', borderRadius: 3 }}>
              ALERT
            </span>
          )}
        </div>
        <div style={{ color: 'var(--accent-light)', fontSize: 11, marginBottom: 4 }}>
          {node.command_line || '—'}
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>
          {node.timestamp_utc}
        </div>
      </div>
      {node.children?.map(child => (
        <ProcessTreeNode key={child.pid + child.timestamp_utc} node={child} level={level + 1} />
      ))}
    </div>
  )
}

export function LineagePage() {
  const { activeCaseId } = useActiveCase()

  const { data: lineage, isLoading, error } = useQuery(
    `lineage-${activeCaseId}`,
    () => getLineage(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  if (!activeCaseId) {
    return (
      <div className="page-content">
        <div className="state-container">
          <TreePine className="state-icon" />
          <div className="state-title">No Case Selected</div>
          <p className="state-message">Please select an active case to view process execution trees.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">Process Lineage</div>
        <div className="page-subtitle">Hierarchical execution tree (PPID → PID attack chain)</div>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && lineage?.length === 0}
        emptyTitle="No Process Lineage"
        emptyMessage="No process execution trees could be reconstructed for this case."
      >
        <div className="card">
          <div className="card-body">
            <div className="process-tree">
              {lineage?.map((rootNode, i) => (
                <div key={i} style={{ marginBottom: 32 }}>
                  <ProcessTreeNode node={rootNode} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AsyncState>
    </div>
  )
}

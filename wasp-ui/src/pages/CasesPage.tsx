import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, invalidateCachePrefix } from '../hooks/useQuery'
import { useActiveCase } from '../hooks/useActiveCase'
import { listCases, createCase } from '../api/client'; import type { CaseSummary } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { RiskBadge, SeverityBadge } from '../components/SeverityBadge'
import { format } from 'date-fns'
import { Plus, X } from 'lucide-react'

function fmt(ts: string) {
  try { return format(new Date(ts), 'yyyy-MM-dd HH:mm') } catch { return ts }
}

function NewCaseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CaseSummary) => void }) {
  const [form, setForm] = useState({
    case_id: `CASE-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`,
    examiner: '',
    description: '',
    organization: '',
    authorization_ref: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.case_id || !form.examiner) {
      setError('Case ID and Examiner are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const c = await createCase(form)
      invalidateCachePrefix('cases')
      onCreated(c as unknown as CaseSummary)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to create case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create New Forensic Case</div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Case ID *</label>
            <input className="form-input" value={form.case_id} onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Lead Examiner *</label>
            <input className="form-input" placeholder="Full name and title" value={form.examiner} onChange={e => setForm(f => ({ ...f, examiner: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Organization</label>
            <input className="form-input" placeholder="DFIR Unit / Agency" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Authorization Reference</label>
            <input className="form-input" placeholder="WARRANT-2026-XXXX" value={form.authorization_ref} onChange={e => setForm(f => ({ ...f, authorization_ref: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Brief investigation description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CasesPage() {
  const navigate = useNavigate()
  const { setActiveCase } = useActiveCase()
  const [showNew, setShowNew] = useState(false)

  const { data: cases, isLoading, error, refetch } = useQuery('cases', listCases)

  const handleOpen = (c: CaseSummary) => {
    setActiveCase(c)
    navigate('/')
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">Forensic Cases</div>
          <div className="page-subtitle">Manage active and archived investigation cases</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New Case
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Cases</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cases?.length ?? 0} case(s)</span>
        </div>
        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && cases?.length === 0}
          emptyTitle="No Cases Found"
          emptyMessage="No forensic cases have been created yet. Click 'New Case' to begin."
          loadingMessage="Loading case list..."
          onRetry={refetch}
        >
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Description</th>
                  <th>Examiner</th>
                  <th>Created</th>
                  <th>Evidence</th>
                  <th>Events</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases?.map(c => (
                  <tr key={c.case_id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
                        {c.case_id}
                      </span>
                    </td>
                    <td className="td-dim" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.case_name || '—'}
                    </td>
                    <td className="td-dim">{c.examiner?.split('(')[0].trim()}</td>
                    <td className="td-mono">{fmt(c.created_utc)}</td>
                    <td className="td-dim">{c.evidence_count}</td>
                    <td className="td-dim">{c.timeline_events_count}</td>
                    <td>
                      <SeverityBadge
                        severity={c.status === 'analyzed' ? 'ANALYZED' : 'PENDING'}
                        label={c.status}
                      />
                    </td>
                    <td>
                      <RiskBadge risk={c.risk_level} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(c)}>
                          Open
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setActiveCase(c); navigate('/reports') }}>
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>

      {showNew && (
        <NewCaseModal
          onClose={() => setShowNew(false)}
          onCreated={c => {
            setShowNew(false)
            setActiveCase(c)
            refetch()
            navigate('/')
          }}
        />
      )}
    </div>
  )
}

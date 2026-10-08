import { useState } from 'react'
import { useActiveCase } from '../hooks/useActiveCase'
import { useQuery } from '../hooks/useQuery'
import { listReports, generateReports, getReportUrl } from '../api/client'
import { AsyncState } from '../components/AsyncState'
import { FileText, Download, Play, Loader } from 'lucide-react'
import { format } from 'date-fns'

function fmt(ts: string) {
  try { return format(new Date(ts), 'yyyy-MM-dd HH:mm') } catch { return ts }
}

function fmtBytes(b: number) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

export function ReportsPage() {
  const { activeCaseId } = useActiveCase()
  const [generating, setGenerating] = useState(false)

  const { data: reports, isLoading, error, refetch } = useQuery(
    `reports-${activeCaseId}`,
    () => listReports(activeCaseId!),
    { enabled: !!activeCaseId }
  )

  const handleGenerate = async () => {
    if (!activeCaseId) return
    setGenerating(true)
    try {
      await generateReports(activeCaseId, ['html', 'md', 'json', 'csv'])
      await refetch()
    } finally {
      setGenerating(false)
    }
  }

  if (!activeCaseId) {
    return (
      <div className="page-content">
        <div className="state-container">
          <FileText className="state-icon" />
          <div className="state-title">No Case Selected</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">Investigation Reports</div>
          <div className="page-subtitle">Generated exports and summaries</div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader size={14} className="spinner" style={{ borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} /> : <Play size={14} fill="currentColor" />}
          {generating ? 'Generating...' : 'Generate Reports'}
        </button>
      </div>

      <div className="card">
        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && reports?.length === 0}
          emptyTitle="No Reports"
          emptyMessage="No reports have been generated yet."
        >
          <div className="card-body" style={{ padding: 0 }}>
            {reports?.map(r => (
              <div key={r.filename} className="report-row">
                <div className="report-format">{r.format}</div>
                <div className="report-name">{r.filename}</div>
                <div className="td-mono">{fmtBytes(r.size_bytes)}</div>
                <div className="td-mono" style={{ width: 120 }}>{fmt(r.generated_utc)}</div>
                <a
                  href={getReportUrl(activeCaseId, r.filename)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={14} /> View / DL
                </a>
              </div>
            ))}
          </div>
        </AsyncState>
      </div>
    </div>
  )
}

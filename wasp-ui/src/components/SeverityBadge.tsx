type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'VERIFIED' | 'PENDING' | 'FAILED' | string

const classMap: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
  INFO: 'badge-info',
  VERIFIED: 'badge-verified',
  MATCH: 'badge-verified',
  PENDING: 'badge-pending',
  FAILED: 'badge-failed',
  ANALYZED: 'badge-accent',
}

interface Props {
  severity: Severity
  label?: string
}

export function SeverityBadge({ severity, label }: Props) {
  const cls = classMap[severity?.toUpperCase?.()] ?? 'badge-info'
  return (
    <span className={`badge ${cls}`}>
      {label ?? severity}
    </span>
  )
}

export function RiskBadge({ risk }: { risk: string }) {
  return <SeverityBadge severity={risk} />
}

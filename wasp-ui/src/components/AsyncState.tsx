import type { ReactNode } from 'react'

interface Props {
  isLoading?: boolean
  error?: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  emptyTitle?: string
  loadingMessage?: string
  errorTitle?: string
  onRetry?: () => void
  children: ReactNode
}

export function AsyncState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'No data available.',
  emptyTitle = 'No Results',
  loadingMessage = 'Loading...',
  errorTitle = 'Unable to load data',
  onRetry,
  children,
}: Props) {
  if (isLoading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p className="state-message" style={{ marginTop: 14 }}>
          {loadingMessage}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="state-container">
        <div className="state-title" style={{ color: 'var(--sev-critical)' }}>
          {errorTitle}
        </div>
        <p className="state-message">{error.message || 'An unexpected error occurred.'}</p>
        {onRetry && (
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="state-container">
        <div className="state-title">{emptyTitle}</div>
        <p className="state-message">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}

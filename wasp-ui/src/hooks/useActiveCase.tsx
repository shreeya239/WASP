import { createContext, useContext, useState, useEffect } from 'react'; import type { ReactNode } from 'react'
import { listCases } from '../api/client'; import type { CaseSummary } from '../api/client'

interface ActiveCaseContext {
  activeCase: CaseSummary | null
  setActiveCase: (c: CaseSummary | null) => void
  activeCaseId: string | null
}

const Ctx = createContext<ActiveCaseContext>({
  activeCase: null,
  setActiveCase: () => {},
  activeCaseId: null,
})

export function ActiveCaseProvider({ children }: { children: ReactNode }) {
  const [activeCase, setActiveCase] = useState<CaseSummary | null>(null)

  // Load first available case on startup
  useEffect(() => {
    if (activeCase) return
    listCases()
      .then(cases => {
        if (cases.length > 0) setActiveCase(cases[0])
      })
      .catch(() => {})
  }, [])

  return (
    <Ctx.Provider
      value={{
        activeCase,
        setActiveCase,
        activeCaseId: activeCase?.case_id ?? null,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useActiveCase() {
  return useContext(Ctx)
}

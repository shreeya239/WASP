import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { TopHeader } from './components/TopHeader'
import { DashboardPage } from './pages/DashboardPage'
import { CasesPage } from './pages/CasesPage'
import { EvidencePage } from './pages/EvidencePage'
import { TimelinePage } from './pages/TimelinePage'
import { InvestigationPage } from './pages/InvestigationPage'
import { LineagePage } from './pages/LineagePage'
import { RulesPage } from './pages/RulesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SystemStatusPage } from './pages/SystemStatusPage'

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <TopHeader />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/new" element={<CasesPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/artifacts" element={<TimelinePage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/lineage" element={<LineagePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/system" element={<SystemStatusPage />} />
          <Route path="/settings" element={<SystemStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App

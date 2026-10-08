import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Shield,
  Database,
  Clock,
  Search,
  TreePine,
  Zap,
  FileText,
  Settings,
  Activity,
  
} from 'lucide-react'
import { useHealth } from '../hooks/useHealth'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { data: health } = useHealth()

  const backendOk = health?.status === 'ok'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-wordmark">WASP</div>
        <div className="sidebar-subtitle">Wide-scope Artifact &amp; Super-timeline Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Investigation</div>
        <NavItem to="/" icon={<LayoutDashboard size={15} />} label="Dashboard" />
        <NavItem to="/cases" icon={<FolderOpen size={15} />} label="Cases" />
        <NavItem to="/evidence" icon={<Database size={15} />} label="Evidence" />
        <NavItem to="/artifacts" icon={<Search size={15} />} label="Artifacts" />
        <NavItem to="/timeline" icon={<Clock size={15} />} label="Timeline" />

        <div className="sidebar-section-label">Analysis</div>
        <NavItem to="/investigation" icon={<Zap size={15} />} label="Investigation" />
        <NavItem to="/lineage" icon={<TreePine size={15} />} label="Process Lineage" />
        <NavItem to="/rules" icon={<Shield size={15} />} label="Rules / Detection" />

        <div className="sidebar-section-label">Output</div>
        <NavItem to="/reports" icon={<FileText size={15} />} label="Reports" />
        <NavItem to="/system" icon={<Activity size={15} />} label="System Status" />
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/system" className="sidebar-system-status" style={{ textDecoration: 'none' }}>
          <span
            className={`status-dot ${backendOk ? 'ok' : health ? 'error' : 'warning'}`}
          />
          <span>
            {backendOk
              ? 'Forensic Engine Online'
              : health
              ? 'Engine Offline'
              : 'Connecting...'}
          </span>
        </NavLink>
        <NavItem to="/settings" icon={<Settings size={15} />} label="Settings" />
      </div>
    </aside>
  )
}

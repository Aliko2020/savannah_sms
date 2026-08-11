import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  FileStack,
  GitBranch,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  NotebookPen,
  PanelLeft,
  Receipt,
  School,
  Settings,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';
import { Select } from '../ui/Select';
import { cn } from '../../lib/cn';
import type { AcademicYear, Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const TOP_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/teachers', label: 'Teachers', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: ['SUPER_ADMIN'] },
  { to: '/promotion-runs', label: 'Run Promotion', icon: TrendingUp, roles: ['SUPER_ADMIN'] },
  { to: '/teachers/me', label: 'My Profile', icon: User, roles: ['TEACHER'] },
  { to: '/teachers/class-list', label: 'Class List', icon: Users, roles: ['TEACHER'] },
];

const CONFIG_NAV_ITEMS: NavItem[] = [
  { to: '/classes', label: 'Class Setup', icon: School, roles: ['SUPER_ADMIN'] },
  { to: '/subjects', label: 'Subject Setup', icon: BookOpen, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/fees/setup', label: 'Fee Setup', icon: Receipt, roles: ['SUPER_ADMIN'] },
  { to: '/promotion-setup', label: 'Promotion Setup', icon: GitBranch, roles: ['SUPER_ADMIN'] },
  { to: '/settings/school', label: 'School Settings', icon: Building2, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

const ASSESSMENT_NAV_ITEMS: NavItem[] = [
  { to: '/teachers/assessment/entry', label: 'Grade Entry', icon: NotebookPen, roles: ['TEACHER'] },
  { to: '/teachers/assessment/view', label: 'View Assessment', icon: ClipboardList, roles: ['TEACHER'] },
];

const REPORTS_NAV_ITEMS: NavItem[] = [
  { to: '/report-cards', label: 'Report Cards', icon: FileStack, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/reports/score-sheet', label: 'Score Sheet', icon: FileSpreadsheet, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

function NavItemLink({ to, label, icon: Icon, onNavigate, collapsed }: NavItem & { onNavigate?: () => void; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-[var(--duration-fast)]',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-primary-50 text-primary-800' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        )
      }
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      <span className={cn('truncate', collapsed && 'hidden')}>{label}</span>
    </NavLink>
  );
}

function NavGroup({
  label,
  icon: Icon,
  items,
  onNavigate,
  collapsed,
}: {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  onNavigate: () => void;
  collapsed: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className={cn('pt-5', collapsed && 'border-t border-border pt-3')}>
      <div className={cn('flex items-center gap-1.5 px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400', collapsed && 'hidden')}>
        <Icon className="size-3" />
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItemLink key={item.to} {...item} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate, onToggleCollapsed }: { collapsed: boolean; onNavigate: () => void; onToggleCollapsed: () => void }) {
  const { user, logout } = useAuth();

  const visibleFor = (items: NavItem[]) => items.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  const topItems = visibleFor(TOP_NAV_ITEMS);
  const configItems = visibleFor(CONFIG_NAV_ITEMS);
  const assessmentItems = visibleFor(ASSESSMENT_NAV_ITEMS);
  const reportsItems = visibleFor(REPORTS_NAV_ITEMS);

  return (
    <>
      <div className={cn('flex items-center gap-2.5 px-4 py-4', collapsed && 'justify-center px-0')}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-900 text-[13px] font-bold text-white">S</div>
        <span className={cn('truncate text-[15px] font-semibold text-zinc-900', collapsed && 'hidden')}>EduSavannah</span>
        <button
          onClick={onNavigate}
          aria-label="Close menu"
          className="ml-auto rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 md:hidden"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {topItems.map((item) => (
          <NavItemLink key={item.to} {...item} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
        <NavGroup label="Enter Assessment" icon={ClipboardCheck} items={assessmentItems} onNavigate={onNavigate} collapsed={collapsed} />
        <NavGroup label="Reports" icon={FileStack} items={reportsItems} onNavigate={onNavigate} collapsed={collapsed} />
        <NavGroup label="Configuration" icon={Settings} items={configItems} onNavigate={onNavigate} collapsed={collapsed} />
      </nav>

      <div className={cn('flex items-center gap-2 border-t border-border p-2.5', collapsed && 'flex-col')}>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden shrink-0 rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 md:inline-flex"
        >
          <PanelLeft className="size-4" />
        </button>
        <button
          onClick={logout}
          title={collapsed ? 'Log out' : undefined}
          className={cn(
            'flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            collapsed && 'flex-none justify-center px-0',
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          <span className={cn(collapsed && 'hidden')}>Log out</span>
        </button>
      </div>
    </>
  );
}

interface DashboardLayoutProps {
  title: string;
  icon: LucideIcon;
  /** Page-specific buttons rendered on the right side of the top bar. */
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ title, icon: Icon, actions, children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  }

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });

  const [yearId, setYearId] = useState('');
  useEffect(() => {
    if (!yearId && academicYears) {
      setYearId(academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0]?.id ?? '');
    }
  }, [academicYears, yearId]);

  return (
    <div className="flex min-h-screen bg-canvas">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-[var(--duration-base)] md:static md:translate-x-0 print:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'md:w-[68px]',
        )}
      >
        <SidebarContent collapsed={collapsed} onNavigate={() => setMobileOpen(false)} onToggleCollapsed={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-sm print:hidden sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0 text-zinc-400" strokeWidth={2} />
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <Link to="/" className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700">
                <Home className="size-3.5" />
              </Link>
              <span className="text-zinc-300">/</span>
              <span className="truncate font-medium text-zinc-900">{title}</span>
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {actions}

            {academicYears && academicYears.length > 0 && (
              <div className="hidden w-40 sm:block">
                <Select
                  fieldSize="sm"
                  value={yearId}
                  onValueChange={setYearId}
                  options={academicYears.map((y) => ({
                    value: y.id,
                    label: (
                      <span className="flex items-center gap-1.5">
                        <CalendarRange className="size-3.5 text-zinc-400" />
                        {y.name}
                      </span>
                    ),
                  }))}
                />
              </div>
            )}

            <div className="flex items-center gap-2 border-l border-border pl-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary-100 text-[11px] font-semibold text-primary-800">
                {user?.username?.slice(-2) ?? '—'}
              </div>
              <span className="hidden text-[13px] font-medium text-zinc-700 lg:inline">{user?.role.replace('_', ' ')}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

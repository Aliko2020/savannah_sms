import type { SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookIcon,
  GraduationCapIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from './icons';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  roles?: Role[];
}

const TOP_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/teachers', label: 'Teachers', icon: UsersIcon, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/teachers/me', label: 'My Profile', icon: UserIcon, roles: ['TEACHER'] },
  { to: '/teachers/class-list', label: 'Class List', icon: GraduationCapIcon, roles: ['TEACHER'] },
];

const CONFIG_NAV_ITEMS: NavItem[] = [
  { to: '/users/new', label: 'Enrollment', icon: UserPlusIcon, roles: ['SUPER_ADMIN'] },
  { to: '/classes', label: 'Class Setup', icon: GraduationCapIcon, roles: ['SUPER_ADMIN'] },
  { to: '/subjects', label: 'Subject Setup', icon: BookIcon, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

const ASSESSMENT_NAV_ITEMS: NavItem[] = [
  { to: '/teachers/assessment/class', label: 'Class Assessment', icon: BookIcon, roles: ['TEACHER'] },
  { to: '/teachers/assessment/exam', label: 'Exam Assessment', icon: BookIcon, roles: ['TEACHER'] },
  { to: '/teachers/assessment/view', label: 'View Assessment', icon: BookIcon, roles: ['TEACHER'] },
];

function NavItemLink({ to, label, icon: Icon, onNavigate }: NavItem & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ml-6 ${
          isActive ? 'bg-brand-light text-white' : 'text-slate-300 hover:bg-brand-light hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function NavGroup({
  label,
  icon: Icon,
  items,
  onNavigate,
}: {
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  items: NavItem[];
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {items.map((item) => (
        <NavItemLink key={item.to} {...item} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const visibleFor = (items: NavItem[]) =>
    items.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  const topItems = visibleFor(TOP_NAV_ITEMS);
  const configItems = visibleFor(CONFIG_NAV_ITEMS);
  const assessmentItems = visibleFor(ASSESSMENT_NAV_ITEMS);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 flex-col bg-brand text-slate-200 md:static md:flex ${
          isOpen ? 'flex' : 'hidden'
        }`}
      >
        <div className="flex items-center gap-1 px-6 py-6">
          <div className="text-lg font-semibold text-white">SavannaSMS</div>
          <p className="mt-1 ml-2 truncate text-xs text-slate-400">({user?.role})</p>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded p-1 text-slate-300 hover:bg-brand-light hover:text-white md:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {topItems.map((item) => (
            <NavItemLink key={item.to} {...item} onNavigate={onClose} />
          ))}

          <NavGroup label="Enter Assessment" icon={GraduationCapIcon} items={assessmentItems} onNavigate={onClose} />
          <NavGroup label="Configuration" icon={SettingsIcon} items={configItems} onNavigate={onClose} />
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-1.5 text-sm text-slate-200 hover:bg-brand-light"
          >
            <LogOutIcon className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MenuIcon } from './icons';

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded p-1 text-slate-600 hover:bg-slate-100"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-brand">SavannaSMS</span>
        </header>

        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}

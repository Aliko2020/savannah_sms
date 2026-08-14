import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { NavDropdown } from './NavDropdown';
import { Button } from '../ui/Button';
import { productLinks, companyLinks } from '../../data/nav';
import { APP_URL } from '../../config';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <NavDropdown label="Products" items={productLinks} />
          <NavDropdown label="Company" items={companyLinks} />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" to="/contact">
            Book a Demo
          </Button>
          <Button variant="primary" href={APP_URL}>
            Get Started
          </Button>
        </div>

        <button
          type="button"
          className="text-paper md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-paper/10 px-6 py-6 md:hidden">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-paper-dim">Products</p>
          <div className="mb-6 flex flex-col gap-3">
            {productLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 text-paper"
              >
                <item.icon className="size-4 text-accent" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-paper-dim">Company</p>
          <div className="mb-6 flex flex-col gap-3">
            {companyLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 text-paper"
              >
                <item.icon className="size-4 text-accent" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="secondary" to="/contact" className="w-full" onClick={() => setMobileOpen(false)}>
              Book a Demo
            </Button>
            <Button variant="primary" href={APP_URL} className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

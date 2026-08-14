import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { LinkedInIcon, XIcon, InstagramIcon } from '../ui/SocialIcons';
import { productLinks, companyLinks } from '../../data/nav';

const socialLinks = [
  { label: 'LinkedIn', icon: LinkedInIcon, href: 'https://www.linkedin.com/company/edusavannah/' },
  { label: 'X', icon: XIcon, href: '#' },
  { label: 'Instagram', icon: InstagramIcon, href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-ink">
      <Container className="grid grid-cols-2 gap-10 py-16 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display text-lg font-bold text-paper">Edusavannah</span>
          <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-paper-dim">
            Software infrastructure for African institutions.
          </p>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-paper-dim">Products</p>
          <ul className="flex flex-col gap-3">
            {productLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="flex items-center gap-2 text-sm text-paper-muted hover:text-paper">
                  <item.icon className="size-3.5 text-accent" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-paper-dim">Company</p>
          <ul className="flex flex-col gap-3">
            {companyLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="flex items-center gap-2 text-sm text-paper-muted hover:text-paper">
                  <item.icon className="size-3.5 text-accent" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-paper-dim">Resources</p>
          <p className="text-sm text-paper-muted">
            Blog — Coming soon!
          </p>
        </div>
      </Container>

      <Container className="flex flex-col items-center justify-between gap-4 border-t border-paper/10 py-6 sm:flex-row">
        <p className="text-xs text-paper-dim">© {new Date().getFullYear()} Edusavannah. All rights reserved.</p>
        <div className="flex items-center gap-4">
          {socialLinks.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="text-paper-dim transition-colors hover:text-accent"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}

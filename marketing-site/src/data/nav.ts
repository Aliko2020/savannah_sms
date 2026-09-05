import { Code2, Mail, type LucideIcon } from 'lucide-react';

export interface NavLink {
  label: string;
  sub?: string;
  to: string;
  icon: LucideIcon;
}

export const productLinks: NavLink[] = [
  // { label: 'Edusavannah', sub: 'School Management', to: '/', icon: GraduationCap },
  { label: 'Digital Skills Training', sub: 'Workforce Development', to: '/training', icon: Code2 },
  // { label: 'Bulk SMS', sub: 'Messaging Infrastructure', to: '/bulk-sms', icon: MessageSquare },
];

export const companyLinks: NavLink[] = [
  // { label: 'About Us', sub: 'Who we are', to: '/about', icon: Info },
  { label: 'Contact Us', sub: 'Get in touch', to: '/contact', icon: Mail },
  // { label: 'Privacy Policy', sub: 'How we handle your data', to: '/privacy', icon: ShieldCheck },
];

import {
  UserPlus,
  Wallet,
  GraduationCap,
  CalendarCheck,
  Users,
  CalendarClock,
  Banknote,
  FolderOpen,
  Tag,
  Webhook,
  MessageSquare,
  Clock,
  BarChart3,
  Monitor,
  Building2,
  Code2,
  Megaphone,
  ShieldCheck,
  Siren,
  ReceiptText,
  BellRing,
  School,
  Sparkles,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';



export interface FeatureItem {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  image?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** False (default) means the answer text is a placeholder instruction, not real copy yet. */
  confirmed?: boolean;
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export const hero = {
  badge: 'Infrastructure for African Institutions — Built for Global Reach',
  headline: 'Software infrastructure built for how African institutions actually run',
  subhead:
    'Edusavannah gives schools, teams, and developers the operational backbone to run reliably — from your first signup to your millionth user.',
};

export const trustBand = {
  eyebrow: 'Trusted by progressive institutions across Africa',
  stats: [
    { value: 'X schools onboarded', placeholder: true },
    { value: 'X messages delivered/month', placeholder: true },
    { value: 'X% platform uptime', placeholder: true },
  ],
};

export interface ProblemSolutionRow {
  sector: string;
  problem: string;
  solution: string;
  icon: LucideIcon;
}

export const problemSolutionRows: ProblemSolutionRow[] = [
  {
    sector: 'Basic Schools',
    problem: 'Heavy administrative workload, manual grading, and delayed parent communication.',
    solution:
      'All-in-One School Platform: Digital student records, automated report cards, and instant messaging.',
    icon: School,
  },
  {
    sector: 'Young Talent',
    problem: 'Lack of access to practical, early-age technology and digital literacy training.',
    solution: 'First-Class Mentorship: Personalized 1-on-1 coding, tech, and language skills programs.',
    icon: Sparkles,
  },
  {
    sector: 'Local Businesses',
    problem: 'Unsuited generic software or manual processes holding back growth.',
    solution: 'Tailored Solutions: Custom software and communication infrastructure designed for local success.',
    icon: Briefcase,
  },
];

export interface ProductCard {
  name: string;
  category: string;
  headline: string;
  body: string;
  cta: string;
  to: string;
  icon: LucideIcon;
}

export const productCards: ProductCard[] = [
  {
    name: 'Edusavannah',
    category: 'School Management System',
    headline: 'Run your entire institution from one dashboard',
    body: 'Admissions, fees, results, and communication — unified, and engineered to work reliably on African network infrastructure.',
    cta: 'Explore Edusavannah',
    to: '/edusavannah',
    icon: GraduationCap,
  },
  {
    name: 'Bulk SMS',
    category: 'Messaging Infrastructure',
    headline: 'Reach anyone, instantly — at scale',
    body: 'A developer-friendly SMS platform for OTPs, alerts, and campaigns, with a dashboard non-technical teams can run themselves.',
    cta: 'Explore Bulk SMS',
    to: '/bulk-sms',
    icon: MessageSquare,
  },
  {
    name: 'Digital Skills Training',
    category: 'Workforce Development',
    headline: 'Train the next generation of African tech talent',
    body: 'Practical, hands-on programs in Bolgatanga or online — built for people who want to ship real work, not just certificates.',
    cta: 'Explore Training',
    to: '/training',
    icon: Code2,
  },
];

// ---------------------------------------------------------------------------
// Edusavannah product page
// ---------------------------------------------------------------------------

export const edusavannahFeatures: FeatureItem[] = [
  { title: 'Admissions & Enrollment', description: 'Digital applications, approvals, and offer letters in one flow', icon: UserPlus },
  { title: 'Fee Collection', description: 'Automated invoicing, payment reminders, and reconciliation', icon: Wallet },
  { title: 'Results & Report Cards', description: 'Generate grade sheets and print-ready report cards in one click', icon: GraduationCap },
  { title: 'Attendance', description: 'Real-time tracking, synced to parent notifications', icon: CalendarCheck },
  { title: 'Parent Portal', description: 'Direct, two-way communication with families', icon: Users },
  { title: 'Timetabling', description: 'Auto-scheduled classes with conflict detection', icon: CalendarClock },
  { title: 'Payroll & HR', description: 'Staff records, payroll, and HR in one place', icon: Banknote },
  { title: 'Document Center', description: 'One-click, print-ready official documents', icon: FolderOpen },
];

export const edusavannahFaq: FaqItem[] = [
  {
    question: 'Does Edusavannah work with unreliable internet?',
    answer:
      "Edusavannah is a cloud-based web application, so an active internet connection is required. Being web-based ensures your school's data is always backed up securely in real time, accessible anywhere on any device (phones, tablets, or computers), and never lost if a local device fails.",
    confirmed: true,
  },
  {
    question: 'Is there a free trial or pilot term?',
    answer:
      'Yes, new schools get a 3-month free trial. Test drive Edusavannah for a full 3 months with complete access to all features, staff onboarding, and dedicated support — completely free before making any commitment.',
    confirmed: true,
  },
  {
    question: 'Can we migrate our existing student records?',
    answer:
      "Yes, we handle the migration for you. You don't have to start from scratch or re-type student data manually. We provide simple Excel/CSV templates to batch-import your historical records — including student bio-data, parent contact info, class lists, and previous term grades — ensuring a smooth transition from paper or legacy systems.",
    confirmed: true,
  },
];

// ---------------------------------------------------------------------------
// Bulk SMS product page
// ---------------------------------------------------------------------------

export const bulkSmsFeatures: FeatureItem[] = [
  { title: 'Custom Sender ID', description: 'Send under your own brand name', icon: Tag },
  { title: 'Developer API & Webhooks', description: 'Integrate delivery, replies, and status events directly', icon: Webhook },
  { title: 'Two-Way SMS', description: 'Receive replies and automate responses', icon: MessageSquare },
  { title: 'Scheduled Campaigns', description: 'Queue and time bulk sends', icon: Clock },
  { title: 'Delivery Analytics', description: 'Track sent, delivered, and failed messages in real time', icon: BarChart3 },
];

export interface UseCase {
  label: string;
  icon: LucideIcon;
}

export const bulkSmsUseCases: UseCase[] = [
  { label: 'Marketing Campaigns', icon: Megaphone },
  { label: 'OTP & Verification', icon: ShieldCheck },
  { label: 'Emergency Alerts', icon: Siren },
  { label: 'Transactional Updates', icon: ReceiptText },
  { label: 'Appointment Reminders', icon: BellRing },
];

export const bulkSmsFaq: FaqItem[] = [
  { question: "Do I need a registered business to get a sender ID?", answer: 'Confirm requirement' },
  { question: "What's your average delivery rate?", answer: 'Confirm figure' },
  { question: 'Is there an API for developers?', answer: 'Yes — see Developer API above.', confirmed: true },
];

// ---------------------------------------------------------------------------
// Digital Skills Training product page
// ---------------------------------------------------------------------------

export interface CourseTrack {
  track: string;
  modules: string;
  targetAudience: string;
  /** False (default) means targetAudience is a placeholder instruction, not confirmed copy. */
  audienceConfirmed?: boolean;
  duration: string;
  /** False (default) means duration is a placeholder instruction, not a confirmed figure. */
  durationConfirmed?: boolean;
  deliveryModel: string;
}

export const courseCatalog: CourseTrack[] = [
  {
    track: 'Computer Fundamentals & Digital Literacy',
    modules: 'Hardware & OS Basics, File Management, Internet Safety & Email, Word Processing & Basic Spreadsheets',
    targetAudience: 'Grade 4 to JHS 3 Students, Absolute Beginners, Working Professionals, Schools',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  },
  {
    track: 'Python for Beginners',
    modules: 'Start Your Programming Journey with Python: Learn one of the world’s most popular languages, covering variables, loops, data structures, and basic problem-solving',
    targetAudience: 'Absolute Beginners, Schools, Young Professionals',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  },
  {
    track: 'Web Development with AI',
    modules: 'Build Modern Websites with the Power of AI: Learn how to design, develop, and deploy responsive websites using modern HTML/CSS, JavaScript, and AI-assisted coding tools',
    targetAudience: 'People with basic computer skills, Career switchers',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  },
  {
    track: 'French for Beginners',
    modules: 'French Fundamentals for Beginners',
    targetAudience: 'Learners with no prior French experience',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  },
  {
    track: 'Language & Global Skills',
    modules: 'French Fundamentals & Business Communication',
    targetAudience: 'Learners with no prior French experience',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  },
  {
    track: 'Cloud Fundamentals',
    modules: 'Introduction to Cloud Computing: Learn core cloud concepts, service models (IaaS, PaaS, SaaS), cloud security, storage, networking, and deployment across top cloud providers like AWS and Azure',
    targetAudience: 'People with basic computer skills, IT enthusiasts, Career switchers',
    audienceConfirmed: true,
    duration: '16 Weeks',
    durationConfirmed: true,
    deliveryModel: 'Virtual Classroom, In-Person (One-on-One)'
  }
];

export const deliveryModels: FeatureItem[] = [
  {
    title: 'In-Person (One-on-One)',
    description: 'Set days available to learn, Select a course you want to learn. Edusavannah works around your calendar.',
    icon: Building2,
    image: '/images/woman-teaching-kid.jpg',
  },
  {
    title: 'Live Online Learning',
    description: 'Dynamic, instructor-led sessions streamed live so you can learn from anywhere.',
    icon: Monitor,
    image: '/images/african.jpg',
  },
];

export const trainingFaq: FaqItem[] = [
  {
    question: 'Do I need prior experience?',
    answer:
      'No prior experience needed. Our programs are designed for complete beginners and early learners. We start with the fundamentals and build up step-by-step at a pace that works for you.',
    confirmed: true,
  },
  {
    question: 'Is a certificate provided on completion?',
    answer:
      'Yes, absolutely. Upon successfully completing the program, you will receive an official Edusavannah Certificate of Completion to showcase your practical skills and add to your academic or professional portfolio.',
    confirmed: true,
  },
  {
    question: "What's the class size?",
    answer:
      "Personalized 1-on-1 instruction. We don't run traditional overcrowded classrooms. Instead, we offer direct in-person mentoring or interactive online sessions via Google Meet so you get dedicated, focused guidance every step of the way.",
    confirmed: true,
  },
  {
    question: 'Can I enroll my kids?',
    answer:
      'Yes, absolutely! We specialize in early-age tech and language training. Our 1-on-1 sessions are tailored to be engaging, patient, and easy to follow for kids and teenagers — building core digital literacy and confidence early on.',
    confirmed: true,
  },
  {
    question: 'Where are classes held?',
    answer:
      'In-person in Bolgatanga & live online everywhere else. Our hands-on, in-person training is based in Bolgatanga. If you are outside the region or prefer learning from home, you can join our live 1-on-1 sessions online via Google Meet from anywhere.',
    confirmed: true,
  },
];

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const contactFaq: FaqItem[] = [
  { question: 'How fast do you respond to inquiries?', answer: 'within 1 business day' },
  { question: 'Do you offer custom integrations?', answer: 'Confirm' },
];

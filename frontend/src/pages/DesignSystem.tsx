import { useState } from 'react';
import { Mail, Search, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-14 w-full rounded-lg ring-1 ring-inset ring-black/5 ${className}`} />
      <span className="text-xs text-zinc-500">{name}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">{children}</div>
    </section>
  );
}

export function DesignSystemPage() {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(true);
  const [year, setYear] = useState('2026');

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-primary-600">SavannaSMS</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Design System</h1>
        <p className="mt-1 text-sm text-zinc-500">Base tokens and form primitives — Step 1 &amp; 2.</p>
      </header>

      <Section title="Color — Primary">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          <Swatch name="50" className="bg-primary-50" />
          <Swatch name="100" className="bg-primary-100" />
          <Swatch name="300" className="bg-primary-300" />
          <Swatch name="500" className="bg-primary-500" />
          <Swatch name="700" className="bg-primary-700" />
          <Swatch name="900 (brand)" className="bg-primary-900" />
        </div>
      </Section>

      <Section title="Color — Status">
        <div className="grid grid-cols-4 gap-3">
          <Swatch name="success-500" className="bg-success-500" />
          <Swatch name="warning-500" className="bg-warning-500" />
          <Swatch name="danger-500" className="bg-danger-500" />
          <Swatch name="info-500" className="bg-info-500" />
        </div>
      </Section>

      <Section title="Shadows">
        <div className="grid grid-cols-4 gap-6">
          <div className="flex h-16 items-center justify-center rounded-lg bg-white text-xs shadow-xs">shadow-xs</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-white text-xs shadow-sm">shadow-sm</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-white text-xs shadow-md">shadow-md</div>
          <div className="flex h-16 items-center justify-center rounded-lg bg-white text-xs shadow-lg">shadow-lg</div>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="secondary" aria-label="Search">
            <Search />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button loading={loading} onClick={() => setLoading((v) => !v)}>
            {loading ? 'Loading…' : 'Toggle loading'}
          </Button>
          <Button disabled>Disabled</Button>
          <Button disabled disabledReason="An academic year needs to be created first.">
            Add class
          </Button>
          <Button variant="secondary">
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Email" placeholder="you@school.edu" leftIcon={<Mail />} />
          <Input label="Search students" placeholder="Search…" leftIcon={<Search />} />
          <Input label="Admission number" hint="Assigned automatically if left blank." />
          <Input label="Amount" defaultValue="abc" error="Amount must be a number." />
          <Input label="Small" fieldSize="sm" placeholder="Small field" />
          <Input label="Large" fieldSize="lg" placeholder="Large field" />
        </div>
      </Section>

      <Section title="Select">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="Academic year"
            value={year}
            onValueChange={setYear}
            options={[
              { value: '2024', label: '2024/2025' },
              { value: '2025', label: '2025/2026' },
              { value: '2026', label: '2026/2027' },
            ]}
          />
          <Select
            label="Category"
            placeholder="Choose a category"
            options={[
              { value: 'pre', label: 'Pre-School' },
              { value: 'primary', label: 'Primary' },
              { value: 'jhs', label: 'JHS' },
            ]}
            error="Category is required."
          />
          <Select
            label="Grade Level"
            placeholder="No options available"
            options={[]}
            tooltip="Grade levels need to be created first — set one up on Promotion Setup."
          />
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="flex flex-col gap-4">
          <Checkbox checked={checked} onCheckedChange={setChecked} label="Set as current term" />
          <Checkbox label="Send SMS receipt" description="Texts the primary guardian when a payment is recorded." defaultChecked />
          <Checkbox label="Disabled option" disabled />
        </div>
      </Section>
    </div>
  );
}

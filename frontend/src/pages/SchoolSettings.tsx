import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Building2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiFetch, ApiError } from '../api/client';
import type { SchoolSettings } from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function SchoolSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => apiFetch<SchoolSettings>('/school-settings'),
  });

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setAddress(settings.address);
      setPhone(settings.phone);
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<SchoolSettings>('/school-settings', {
        method: 'PUT',
        body: JSON.stringify({ name, address, phone }),
      }),
    onSuccess: (data) => {
      toast.success('School settings saved.');
      queryClient.setQueryData(['school-settings'], data);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save school settings.')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <DashboardLayout title="School Settings" icon={Building2}>
      <div className="max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-zinc-900">Letterhead details</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Printed at the top of report cards and score sheets.
        </p>

        {isLoading && <p className="text-sm text-zinc-500">Loading…</p>}

        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="School name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Address" required value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button type="submit" loading={save.isPending}>
              Save changes
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

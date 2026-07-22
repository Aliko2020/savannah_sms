import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../components/AppLayout';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { PopulationDetail } from '../components/PopulationDetail';
import { StaffDetail } from '../components/StaffDetail';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, CashIcon, GraduationCapIcon, LaptopIcon, UserIcon, UserPlusIcon } from '../components/icons';
import type { DashboardStats } from '../types';

type DetailCard = 'population' | 'staff';

const PANEL_TITLES: Record<DetailCard, string> = {
  population: 'Population by Class',
  staff: 'Staff',
};

export function DashboardPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const [selectedCard, setSelectedCard] = useState<DetailCard | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiFetch<DashboardStats>('/dashboard/stats'),
  });

  function toggleCard(card: DetailCard) {
    setSelectedCard((current) => (current === card ? null : card));
  }

  return (
    <AppLayout>
      <PageHeader title="Dashboard" icon={LaptopIcon} />
      {!isLoading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={UserIcon}
            value={stats.population.total}
            label={isTeacher ? 'Total Students' : 'Population'}
            colorClassName="bg-stat-population"
            subtext={`${stats.population.boys} boys · ${stats.population.girls} girls`}
            onClick={isTeacher ? undefined : () => toggleCard('population')}
          />
          {stats.staff && (
            <StatCard
              icon={BriefcaseIcon}
              value={stats.staff.total}
              label="Total Staff"
              colorClassName="bg-stat-staff"
              subtext={`${stats.staff.teaching} teaching · ${stats.staff.nonTeaching} non-teaching`}
              onClick={() => toggleCard('staff')}
            />
          )}
          {stats.fees && (
            <StatCard
              icon={CashIcon}
              value={stats.fees.totalCollected}
              label="Fees"
              colorClassName="bg-stat-fees"
              subtext={`${stats.fees.totalDebtors} debtors`}
            />
          )}
          {stats.newEnrollments !== undefined && (
            <StatCard
              icon={UserPlusIcon}
              value={stats.newEnrollments}
              label="New Enrollment"
              colorClassName="bg-stat-enrollment"
              subtext="last 12 months"
            />
          )}
          {stats.classrooms && (
            <StatCard
              icon={GraduationCapIcon}
              value={stats.classrooms.total}
              label="Total Classrooms"
              colorClassName="bg-stat-classrooms"
              subtext={`${stats.classrooms.preSchool} pre-school · ${stats.classrooms.primary} primary · ${stats.classrooms.jhs} JHS`}
            />
          )}
        </div>
      )}

      {selectedCard && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{PANEL_TITLES[selectedCard]}</h2>
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {selectedCard === 'population' && <PopulationDetail />}
          {selectedCard === 'staff' && <StaffDetail />}
        </div>
      )}
    </AppLayout>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { PopulationDetail } from '../components/PopulationDetail';
import { StaffDetail } from '../components/StaffDetail';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BriefcaseIcon, CashIcon, UserIcon } from '../components/icons';
import { formatCurrency } from '../utils/format';
import type { DashboardStats } from '../types';

type DetailCard = 'population' | 'staff';

const PANEL_TITLES: Record<DetailCard, string> = {
  population: 'Population by Class',
  staff: 'Staff',
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <DashboardLayout title="Dashboard" icon={LayoutDashboard}>
      {!isLoading && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={UserIcon}
            value={stats.population.total}
            label={isTeacher ? 'Total Students' : 'Population'}
            colorKey="stat-population"
            subtext={`${stats.population.boys} boys · ${stats.population.girls} girls`}
            onClick={isTeacher ? undefined : () => toggleCard('population')}
          />
          {stats.staff && (
            <StatCard
              icon={BriefcaseIcon}
              value={stats.staff.total}
              label="Total Staff"
              colorKey="stat-staff"
              subtext={`${stats.staff.teaching} teaching · ${stats.staff.nonTeaching} non-teaching`}
              onClick={() => toggleCard('staff')}
            />
          )}
          {stats.fees && (
            <StatCard
              icon={CashIcon}
              value={formatCurrency(stats.fees.totalExpected)}
              label="Total Expected Revenue"
              colorKey="stat-fees"
              subtext="All academic years, all terms"
              onClick={() => navigate('/fees')}
            />
          )}
          {stats.fees && (
            <StatCard
              icon={CashIcon}
              value={formatCurrency(stats.fees.totalCollected)}
              label="Fees Collected"
              colorKey="stat-fees"
              subtext={
                stats.fees.termName
                  ? `${stats.fees.totalDebtors} debtors (${stats.fees.termName})`
                  : `${stats.fees.totalDebtors} debtors`
              }
              onClick={() => navigate('/fees?tab=log')}
            />
          )}
          {/* {stats.newEnrollments !== undefined && (
            <StatCard
              icon={UserPlusIcon}
              value={stats.newEnrollments}
              label="New Enrollment"
              colorKey="stat-enrollment"
              subtext="last 12 months"
            />
          )} */}
        </div>
      )}

      {selectedCard && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{PANEL_TITLES[selectedCard]}</h2>
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {selectedCard === 'population' && <PopulationDetail />}
          {selectedCard === 'staff' && <StaffDetail />}
        </div>
      )}
    </DashboardLayout>
  );
}

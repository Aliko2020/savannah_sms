import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CircleAlert, Printer, Search, Send, Wallet } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Tooltip } from '../components/ui/Tooltip';
import { StatCard } from '../components/StatCard';
import { PaymentReceiptCard } from '../components/PaymentReceiptCard';
import { apiFetch, ApiError } from '../api/client';
import { CashIcon, UsersIcon } from '../components/icons';
import { formatName, formatCurrency, titleCase } from '../utils/format';
import { BALANCE_STATUS_LABELS, FEE_STATUS_PILL_CLASSES, PAYMENT_METHOD_LABELS } from '../constants';
import type {
  AcademicYear,
  ClassItem,
  FeeAuditEntry,
  FeeReminderResult,
  FeeStatus,
  FeeSummary,
  PaymentReceipt,
  StudentFeeDetail,
  StudentFeeRow,
  Term,
} from '../types';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

type Tab = 'balances' | 'log';

// Radix Select reserves the empty string for "no selection", so the
// "All ___" options each need a real sentinel value that we translate
// back to '' (the actual filter state) at the call site.
const ALL = '__all__';

export function FeeManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(searchParams.get('tab') === 'log' ? 'log' : 'balances');

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => apiFetch<AcademicYear[]>('/academic-years'),
  });
  const [academicYearId, setAcademicYearId] = useState('');
  useEffect(() => {
    if (!academicYearId && academicYears && academicYears.length > 0) {
      setAcademicYearId(academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0].id);
    }
  }, [academicYears, academicYearId]);

  const { data: terms } = useQuery({
    queryKey: ['terms', academicYearId],
    queryFn: () => apiFetch<Term[]>(`/terms?academicYearId=${academicYearId}`),
    enabled: !!academicYearId,
  });
  const [termId, setTermId] = useState('');
  useEffect(() => {
    setTermId('');
  }, [academicYearId]);
  // No "All terms" option — billing is inherently term-scoped now, so the
  // view always pins to one specific term (defaulting to whichever is
  // currently active) rather than an ambiguous blended view.
  useEffect(() => {
    if (!termId && terms && terms.length > 0) {
      setTermId(terms.find((t) => t.isCurrent)?.id ?? terms[0].id);
    }
  }, [terms, termId]);

  const { data: classes } = useQuery({
    queryKey: ['classes', academicYearId],
    queryFn: () => apiFetch<ClassItem[]>(`/classes?academicYearId=${academicYearId}`),
    enabled: !!academicYearId,
  });
  const [classId, setClassId] = useState('');
  useEffect(() => {
    setClassId('');
  }, [academicYearId]);

  const [status, setStatus] = useState<FeeStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: summary } = useQuery({
    queryKey: ['fee-summary', academicYearId, classId, termId],
    queryFn: () =>
      apiFetch<FeeSummary>(
        `/fees/summary?academicYearId=${academicYearId}` +
          (classId ? `&classId=${classId}` : '') +
          (termId ? `&termId=${termId}` : ''),
      ),
    enabled: !!academicYearId,
  });

  const { data: rows, isLoading: rowsLoading } = useQuery({
    queryKey: ['fees-students', academicYearId, classId, termId, status, search],
    queryFn: () =>
      apiFetch<StudentFeeRow[]>(
        `/fees/students?academicYearId=${academicYearId}` +
          (classId ? `&classId=${classId}` : '') +
          (termId ? `&termId=${termId}` : '') +
          (status ? `&status=${status}` : '') +
          (search ? `&search=${encodeURIComponent(search)}` : ''),
      ),
    enabled: !!academicYearId,
  });

  // Independent of the interactive status filter above — this is always the
  // true defaulter set for the whole class/year, used by print + bulk SMS
  // regardless of what the admin currently has the status dropdown set to.
  const { data: allRows } = useQuery({
    queryKey: ['fees-students-all', academicYearId, classId],
    queryFn: () =>
      apiFetch<StudentFeeRow[]>(`/fees/students?academicYearId=${academicYearId}${classId ? `&classId=${classId}` : ''}`),
    enabled: !!academicYearId,
  });
  const defaulters = (allRows ?? []).filter((r) => r.status === 'PARTIAL' || r.status === 'UNPAID');

  const { data: auditTrail, isLoading: logLoading } = useQuery({
    queryKey: ['fee-audit-trail', academicYearId, termId, classId],
    queryFn: () =>
      apiFetch<FeeAuditEntry[]>(
        `/fees/audit-trail?academicYearId=${academicYearId}` +
          (termId ? `&termId=${termId}` : '') +
          (classId ? `&classId=${classId}` : '') +
          '&limit=100',
      ),
    enabled: !!academicYearId && activeTab === 'log',
  });

  // ---- Bulk SMS reminders (all defaulters matching the current filter) ----
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const sendReminders = useMutation({
    mutationFn: (message: string) =>
      apiFetch<FeeReminderResult>('/fees/reminders', {
        method: 'POST',
        body: JSON.stringify({ academicYearId, classId: classId || undefined, message: message || undefined }),
      }),
    onSuccess: (data) => {
      toast.success(
        `Sent ${data.sent} of ${data.totalDefaulters} reminder(s).` +
          (data.noGuardian ? ` ${data.noGuardian} had no guardian on file.` : ''),
      );
      setShowReminderPanel(false);
      setCustomMessage('');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send reminders.')),
  });

  function handleOpenReminderPanel() {
    if (defaulters.length === 0) {
      toast.info('No defaulters to remind for the current filter.');
      return;
    }
    setShowReminderPanel(true);
  }

  // ---- Print: mutually exclusive so only one print-only block is ever
  // visible at once (defaulters report vs. a single statement). ----
  const [printMode, setPrintMode] = useState<'defaulters' | 'statement' | null>(null);
  const [statementStudentId, setStatementStudentId] = useState<string | null>(null);

  const { data: statementData, isFetching: statementLoading } = useQuery({
    queryKey: ['fee-statement', statementStudentId, academicYearId],
    queryFn: () => apiFetch<StudentFeeDetail>(`/fees/students/${statementStudentId}?academicYearId=${academicYearId}`),
    enabled: !!statementStudentId,
  });

  useEffect(() => {
    if (printMode === 'defaulters') {
      window.print();
      setPrintMode(null);
    }
  }, [printMode]);

  useEffect(() => {
    if (printMode === 'statement' && statementStudentId && statementData && !statementLoading) {
      window.print();
      setPrintMode(null);
      setStatementStudentId(null);
    }
  }, [printMode, statementStudentId, statementData, statementLoading]);

  function handlePrintDefaulters() {
    if (defaulters.length === 0) {
      toast.info('No defaulters to print for the current filter.');
      return;
    }
    setPrintMode('defaulters');
  }

  function handlePrintStatement(studentId: string) {
    setStatementStudentId(studentId);
    setPrintMode('statement');
  }

  const defaultersByClass = new Map<string, StudentFeeRow[]>();
  for (const d of defaulters) {
    const key = d.class ? titleCase(d.class.name) : 'No Class';
    defaultersByClass.set(key, [...(defaultersByClass.get(key) ?? []), d]);
  }

  // ---- Reprint receipt (Payment Log tab) ----
  const [reprintReceipt, setReprintReceipt] = useState<PaymentReceipt | null>(null);
  const reprintMutation = useMutation({
    mutationFn: (paymentId: string) => apiFetch<PaymentReceipt>(`/fees/payments/${paymentId}/receipt`),
    onSuccess: (data) => setReprintReceipt(data),
    onError: (error) => toast.error(errorMessage(error, 'Could not load that receipt.')),
  });

  const currentYearName = academicYears?.find((y) => y.id === academicYearId)?.name ?? '';
  const currentClassName = classId ? titleCase(classes?.find((c) => c.id === classId)?.name ?? '') : 'All classes';

  return (
    <DashboardLayout title="Fee Management" icon={Wallet}>
      <div className="mb-4 flex flex-col gap-3 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-40">
            <Select
              value={academicYearId}
              onValueChange={setAcademicYearId}
              options={(academicYears ?? []).map((y) => ({ value: y.id, label: y.name }))}
              tooltip={
                academicYears && academicYears.length === 0
                  ? 'An academic year needs to be created first — set one up in Class Setup.'
                  : undefined
              }
            />
          </div>

          <div className="w-40">
            <Select
              value={termId || ALL}
              onValueChange={(v) => setTermId(v === ALL ? '' : v)}
              options={[{ value: ALL, label: 'All terms' }, ...(terms ?? []).map((t) => ({ value: t.id, label: t.name }))]}
            />
          </div>

          <div className="w-52">
            <Select
              value={classId || ALL}
              onValueChange={(v) => setClassId(v === ALL ? '' : v)}
              options={[
                { value: ALL, label: 'All classes' },
                ...(classes ?? []).map((c) => ({ value: c.id, label: titleCase(c.name) })),
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={status || ALL}
              onValueChange={(v) => setStatus(v === ALL ? '' : (v as FeeStatus))}
              options={[
                { value: ALL, label: 'All' },
                { value: 'PAID', label: 'Fully Paid' },
                { value: 'PARTIAL', label: 'Partial Payment' },
                { value: 'UNPAID', label: 'Defaulters/Unpaid' },
              ]}
            />
          </div>

          <Input
            ref={searchInputRef}
            containerClassName="flex-1 sm:max-w-xs"
            placeholder="Search by name…"
            leftIcon={<Search />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-wrap justify-between gap-2">
          <Button onClick={handlePrintDefaulters}>
            <Printer /> Print Defaulters List
          </Button>
          <Button onClick={handleOpenReminderPanel}>
            <Send /> Send Bulk SMS Reminders
          </Button>
        </div>

        {showReminderPanel && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-sm text-zinc-600">
              This will text <strong>{defaulters.length}</strong> guardian(s) of students who currently owe fees
              {classId ? ' in this class' : ''}.
            </p>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">Custom message (optional)</label>
            <textarea
              className="mb-3 w-full rounded-lg px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-border transition-shadow focus:outline-none focus:ring-[1.5px] focus:ring-primary-500"
              rows={3}
              placeholder="Leave blank to send each guardian the default reminder (with their child's name and balance), or type a message to send the same text to everyone."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Button loading={sendReminders.isPending} onClick={() => sendReminders.mutate(customMessage)}>
                Send to {defaulters.length} guardian(s)
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReminderPanel(false);
                  setCustomMessage('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <StatCard
            icon={UsersIcon}
            value={summary.totalStudents}
            label="Total Students"
            colorKey="stat-population"
            subtext={`${summary.paidCount} fully paid · ${summary.partialCount} partial · ${summary.unpaidCount} defaulters`}
          />
          <StatCard
            icon={CashIcon}
            value={formatCurrency(summary.totalExpected)}
            label="Total Expected Revenue"
            colorKey="stat-fees"
          />
          <StatCard
            icon={CashIcon}
            value={formatCurrency(summary.totalCollected)}
            label="Total Collected"
            colorKey="stat-enrollment"
          />
          <StatCard
            icon={CashIcon}
            value={formatCurrency(summary.totalOutstanding)}
            label="Total Outstanding Balance"
            colorKey="stat-staff"
          />
        </div>
      )}

      <div className="mb-4 flex w-fit gap-1 rounded-lg bg-zinc-100 p-1 print:hidden">
        <button
          onClick={() => setActiveTab('balances')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'balances' ? 'bg-white text-primary-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Student Balances
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'log' ? 'bg-white text-primary-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Payment Log
        </button>
      </div>

      {activeTab === 'balances' && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm print:hidden">
          {rowsLoading && <p className="px-6 py-10 text-center text-sm text-zinc-500">Loading…</p>}
          {!rowsLoading && rows && rows.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-zinc-500">No students found.</p>
          )}
          {!rowsLoading && rows && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Admin No.</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Class</th>
                    <th className="px-6 py-3 font-semibold">Billed</th>
                    <th className="px-6 py-3 font-semibold">Amt Paid</th>
                    <th className="px-6 py-3 font-semibold">Owed</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/fees/students/${r.id}?academicYearId=${academicYearId}`)}
                      className="cursor-pointer transition-colors hover:bg-zinc-50"
                    >
                      <td className="px-6 py-3 text-zinc-500">{r.admissionNumber}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{formatName(r.firstName, r.lastName)}</td>
                      <td className="px-6 py-3 text-zinc-500">{r.class ? titleCase(r.class.name) : 'Not assigned'}</td>
                      <td className="px-6 py-3 tabular-nums text-zinc-500">
                        {r.expected !== null ? (
                          r.configuredForYear ? (
                            formatCurrency(r.expected)
                          ) : (
                            <Tooltip content="No fee structure has been set for this academic year yet — this is last year's rate, carried forward. Confirm it in Fee Setup.">
                              <span className="inline-flex cursor-default items-center gap-1">
                                {formatCurrency(r.expected)}
                                <CircleAlert className="size-3.5 text-warning-500" />
                              </span>
                            </Tooltip>
                          )
                        ) : (
                          <Tooltip content="No fee structure has been set for this student's class and term yet. Set one up in Fee Setup to start billing.">
                            <span className="inline-flex cursor-default items-center gap-1 text-zinc-400">
                              <CircleAlert className="size-3.5" />
                              Not configured
                            </span>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-6 py-3 tabular-nums text-zinc-500">{formatCurrency(r.collected)}</td>
                      <td className="px-6 py-3 tabular-nums text-zinc-500">
                        {r.balance !== null ? formatCurrency(r.balance) : 'Not configured'}
                      </td>
                      <td className="px-6 py-3">
                        {r.status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STATUS_PILL_CLASSES[r.status]}`}
                          >
                            {BALANCE_STATUS_LABELS[r.status]}
                          </span>
                        ) : (
                          <Tooltip content="Fee not set for this student's class and term — nothing to bill or pay yet.">
                            <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                              <CircleAlert className="size-3.5" />
                              Fee Not Set
                            </span>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => handlePrintStatement(r.id)}>
                          Print Statement
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div className="print:hidden">
          {reprintReceipt && <PaymentReceiptCard receipt={reprintReceipt} onClose={() => setReprintReceipt(null)} />}

          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Daily Payment Log
            </div>
            {logLoading && <p className="px-6 py-10 text-center text-sm text-zinc-500">Loading…</p>}
            {!logLoading && (!auditTrail || auditTrail.length === 0) && (
              <p className="px-6 py-10 text-center text-sm text-zinc-500">No transactions recorded yet.</p>
            )}
            {!logLoading && auditTrail && auditTrail.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date / Time</th>
                      <th className="px-6 py-3 font-semibold">Receipt No.</th>
                      <th className="px-6 py-3 font-semibold">Student</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">Method</th>
                      <th className="px-6 py-3 font-semibold">Recorded By</th>
                      <th className="px-6 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditTrail.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-3 text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-3 text-zinc-500">{entry.receiptNumber}</td>
                        <td className="px-6 py-3 font-medium text-zinc-900">
                          {entry.studentName} ({entry.admissionNumber})
                        </td>
                        <td className="px-6 py-3 tabular-nums text-zinc-900">{formatCurrency(entry.amount)}</td>
                        <td className="px-6 py-3 text-zinc-500">{PAYMENT_METHOD_LABELS[entry.method]}</td>
                        <td className="px-6 py-3 text-zinc-500">{entry.recordedBy}</td>
                        <td className="px-6 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={reprintMutation.isPending}
                            onClick={() => reprintMutation.mutate(entry.id)}
                          >
                            Reprint Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print-only: Defaulters Report, grouped by class. No buttons, no chrome. */}
      {printMode === 'defaulters' && (
        <div className="hidden print:block">
          <h1 className="text-xl font-bold text-black">Defaulters Report</h1>
          <p className="mb-6 text-sm text-black">
            {currentYearName} · {currentClassName} · Generated {new Date().toLocaleDateString()}
          </p>
          {Array.from(defaultersByClass.entries()).map(([className, students]) => (
            <div key={className} className="mb-6 break-inside-avoid">
              <h2 className="mb-2 border-b border-black pb-1 text-base font-semibold text-black">
                {className} ({students.length})
              </h2>
              <table className="w-full text-left text-sm text-black">
                <thead>
                  <tr>
                    <th className="border-b border-black py-1 pr-4">Admission No.</th>
                    <th className="border-b border-black py-1 pr-4">Name</th>
                    <th className="border-b border-black py-1 pr-4">Billed</th>
                    <th className="border-b border-black py-1 pr-4">Paid</th>
                    <th className="border-b border-black py-1">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="py-1 pr-4">{s.admissionNumber}</td>
                      <td className="py-1 pr-4">{formatName(s.firstName, s.lastName)}</td>
                      <td className="py-1 pr-4">{s.expected !== null ? formatCurrency(s.expected) : 'Not configured'}</td>
                      <td className="py-1 pr-4">{formatCurrency(s.collected)}</td>
                      <td className="py-1">{s.balance !== null ? formatCurrency(s.balance) : 'Not configured'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Print-only: single-student statement. */}
      {printMode === 'statement' && statementData && (
        <div className="hidden print:block">
          <h1 className="text-xl font-bold text-black">Fee Statement</h1>
          <p className="mb-4 text-sm text-black">
            {formatName(statementData.firstName, statementData.lastName)} · {statementData.admissionNumber} ·{' '}
            {statementData.class ? titleCase(statementData.class.name) : 'Not assigned'} · {currentYearName}
          </p>
          <table className="mb-6 w-full text-left text-sm text-black">
            <thead>
              <tr>
                <th className="border-b border-black py-1 pr-4">Total Billed</th>
                <th className="border-b border-black py-1 pr-4">Amount Paid</th>
                <th className="border-b border-black py-1 pr-4">Balance Owed</th>
                <th className="border-b border-black py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 pr-4">{statementData.expected !== null ? formatCurrency(statementData.expected) : 'Not configured'}</td>
                <td className="py-1 pr-4">{formatCurrency(statementData.collected)}</td>
                <td className="py-1 pr-4">{statementData.balance !== null ? formatCurrency(statementData.balance) : 'Not configured'}</td>
                <td className="py-1">{statementData.status ? BALANCE_STATUS_LABELS[statementData.status] : 'Not configured'}</td>
              </tr>
            </tbody>
          </table>
          <h2 className="mb-2 text-base font-semibold text-black">Payment History</h2>
          <table className="w-full text-left text-sm text-black">
            <thead>
              <tr>
                <th className="border-b border-black py-1 pr-4">Date</th>
                <th className="border-b border-black py-1 pr-4">Receipt No.</th>
                <th className="border-b border-black py-1 pr-4">Amount</th>
                <th className="border-b border-black py-1">Method</th>
              </tr>
            </thead>
            <tbody>
              {statementData.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-1 pr-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-1 pr-4">{p.receiptNumber}</td>
                  <td className="py-1 pr-4">{formatCurrency(p.amount)}</td>
                  <td className="py-1">{PAYMENT_METHOD_LABELS[p.method]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

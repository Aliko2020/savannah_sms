import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle2, Wallet, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { PaymentReceiptCard } from '../components/PaymentReceiptCard';
import { apiFetch, ApiError } from '../api/client';
import { formatName, formatCurrency, titleCase } from '../utils/format';
import {
  FEE_STATUS_LABELS,
  FEE_STATUS_PILL_CLASSES,
  GHANA_BANKS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '../constants';
import type { PaymentDuplicateCheck, PaymentMethod, PaymentReceipt, StudentFeeDetail } from '../types';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function FeeStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const academicYearId = searchParams.get('academicYearId') ?? '';
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery({
    queryKey: ['fee-student', id, academicYearId],
    queryFn: () => apiFetch<StudentFeeDetail>(`/fees/students/${id}?academicYearId=${academicYearId}`),
    enabled: !!id && !!academicYearId,
  });

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchOrChannel, setBranchOrChannel] = useState('');
  const [paidAt, setPaidAt] = useState(todayIsoDate());
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  // Bank Receipt entries get a live duplicate check as the admin types the
  // receipt/ref number — debounced so it doesn't fire on every keystroke.
  const [debouncedReference, setDebouncedReference] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedReference(reference.trim()), 500);
    return () => clearTimeout(t);
  }, [reference]);

  useEffect(() => {
    setConfirmDuplicate(false);
  }, [debouncedReference, amount]);

  const { data: duplicateCheck } = useQuery({
    queryKey: ['payment-duplicate-check', id, debouncedReference, amount],
    queryFn: () =>
      apiFetch<PaymentDuplicateCheck>(
        `/fees/payments/check-reference?studentId=${id}&reference=${encodeURIComponent(debouncedReference)}&amount=${amount}`,
      ),
    enabled: method === 'BANK_TRANSFER' && !!debouncedReference && Number(amount) > 0,
  });
  const checkStatus = method === 'BANK_TRANSFER' ? duplicateCheck?.status : undefined;

  const recordPayment = useMutation({
    mutationFn: () =>
      apiFetch<PaymentReceipt>('/fees/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: id,
          academicYearId,
          amount: Number(amount),
          method,
          reference: reference || undefined,
          bankName: method === 'BANK_TRANSFER' ? bankName : undefined,
          branchOrChannel: method === 'BANK_TRANSFER' ? branchOrChannel || undefined : undefined,
          paidAt,
          confirmDuplicate,
        }),
      }),
    onSuccess: (data) => {
      toast.success('Payment recorded.');
      setReceipt(data);
      setAmount('');
      setReference('');
      setBankName('');
      setBranchOrChannel('');
      setPaidAt(todayIsoDate());
      setConfirmDuplicate(false);
      queryClient.invalidateQueries({ queryKey: ['fee-student', id, academicYearId] });
      queryClient.invalidateQueries({ queryKey: ['fees-students'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record payment.')),
  });

  const saveDisabled =
    recordPayment.isPending || checkStatus === 'duplicate' || (checkStatus === 'soft_match' && !confirmDuplicate);

  if (isLoading) {
    return (
      <DashboardLayout title="Student Fees" icon={Wallet}>
        <p className="text-sm text-slate-500">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Fees" icon={Wallet}>
        <p className="text-sm text-slate-500">Student not found.</p>
      </DashboardLayout>
    );
  }

  const fullName = formatName(student.firstName, student.lastName);
  const notConfigured = student.expected === null;

  return (
    <DashboardLayout title="Student Fees" icon={Wallet}>
      <Link to="/fees" className="mb-4 inline-block text-sm text-brand hover:underline print:hidden">
        ← Back to Fee Collection
      </Link>

      <div className="max-w-5xl">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <h1 className="text-xl font-semibold text-slate-900">{fullName}</h1>
          <p className="text-sm text-slate-500">
            Admission No: {student.admissionNumber} · {student.class ? titleCase(student.class.name) : 'No class'}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase text-slate-400">Expected</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {student.expected !== null ? formatCurrency(student.expected) : 'Not configured'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Collected</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatCurrency(student.collected)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Balance</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {student.balance !== null ? formatCurrency(student.balance) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Status</dt>
              <dd>
                {student.status && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STATUS_PILL_CLASSES[student.status]}`}
                  >
                    {FEE_STATUS_LABELS[student.status]}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {receipt && <PaymentReceiptCard receipt={receipt} onClose={() => setReceipt(null)} />}

        {!receipt && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Record Payment</h2>

          {notConfigured ? (
            <p className="text-sm text-slate-500">
              No fee amount has been configured for this class level and academic year yet.{' '}
              <Link to="/fees/setup" className="font-medium text-brand hover:underline">
                Set it up first
              </Link>
              .
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordPayment.mutate();
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                label="Amount (GHS)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Select
                label="Payment Method"
                value={method}
                onValueChange={(v) => setMethod(v as PaymentMethod)}
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
              />
              <Input
                type="date"
                required
                label="Payment Date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />

              {method === 'BANK_TRANSFER' && (
                <>
                  <Select
                    label="Bank Name"
                    required
                    placeholder="Select a bank"
                    value={bankName || undefined}
                    onValueChange={setBankName}
                    options={GHANA_BANKS.map((b) => ({ value: b, label: b }))}
                  />
                  <Input
                    label="Branch / Channel"
                    value={branchOrChannel}
                    onChange={(e) => setBranchOrChannel(e.target.value)}
                    placeholder="e.g. Mobile App, Agency Banking"
                  />
                </>
              )}

              <Input
                required={method === 'BANK_TRANSFER'}
                label={method === 'BANK_TRANSFER' ? 'Bank Receipt / Ref No. *' : 'Transaction Reference'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={method === 'BANK_TRANSFER' ? 'Receipt number printed on the pay-in slip' : 'Optional'}
                rightIcon={
                  checkStatus === 'new' ? (
                    <CheckCircle2 className="text-success-500" />
                  ) : checkStatus === 'soft_match' ? (
                    <AlertTriangle className="text-warning-500" />
                  ) : checkStatus === 'duplicate' ? (
                    <XCircle className="text-danger-500" />
                  ) : undefined
                }
                className={
                  checkStatus === 'duplicate'
                    ? 'ring-danger-500 focus:ring-danger-500'
                    : checkStatus === 'soft_match'
                      ? 'ring-warning-500 focus:ring-warning-500'
                      : checkStatus === 'new'
                        ? 'ring-success-500 focus:ring-success-500'
                        : undefined
                }
              />

              {checkStatus === 'duplicate' && duplicateCheck?.status === 'duplicate' && (
                <div className="rounded-lg border border-danger-500/20 bg-danger-50 p-3 text-sm text-danger-700 sm:col-span-3">
                  Duplicate Receipt Flagged: Receipt #{duplicateCheck.existing.reference ?? duplicateCheck.existing.receiptNumber}{' '}
                  was already recorded on {new Date(duplicateCheck.existing.paidAt).toLocaleDateString()} for student{' '}
                  {duplicateCheck.existing.studentName}
                  {duplicateCheck.existing.className ? ` (${duplicateCheck.existing.className})` : ''} by{' '}
                  {duplicateCheck.existing.recordedByName}.
                </div>
              )}

              {checkStatus === 'soft_match' && duplicateCheck?.status === 'soft_match' && (
                <div className="rounded-lg border border-warning-500/20 bg-warning-50 p-3 text-sm text-warning-700 sm:col-span-3">
                  <p>
                    Possible Duplicate Entry: A payment of GHS {duplicateCheck.existing.amount.toFixed(2)} was already
                    recorded for this student today under Receipt #
                    {duplicateCheck.existing.reference ?? duplicateCheck.existing.receiptNumber}. Are you sure this is a
                    different payment?
                  </p>
                  <Checkbox
                    containerClassName="mt-2.5"
                    checked={confirmDuplicate}
                    onCheckedChange={(checked) => setConfirmDuplicate(checked === true)}
                    label="Confirm this is a distinct valid transaction."
                  />
                </div>
              )}

              <div className="sm:col-span-3">
                <Button type="submit" loading={recordPayment.isPending} disabled={saveDisabled}>
                  Record Payment
                </Button>
              </div>
            </form>
          )}
        </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:hidden">
          <div className="border-b border-slate-100 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Payment History
          </div>
          {student.payments.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No payments recorded yet.</p>
          )}
          {student.payments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Receipt No.</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Method</th>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 text-slate-500">{p.receiptNumber}</td>
                      <td className="px-6 py-3 text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-3 text-slate-500">{PAYMENT_METHOD_LABELS[p.method]}</td>
                      <td className="px-6 py-3 text-slate-500">{p.reference ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-500">{p.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

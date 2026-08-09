import { formatName, formatCurrency, titleCase } from '../utils/format';
import { FEE_STATUS_LABELS, FEE_STATUS_PILL_CLASSES, PAYMENT_METHOD_LABELS } from '../constants';
import { Button } from './ui/Button';
import type { PaymentReceipt } from '../types';

export function PaymentReceiptCard({ receipt, onClose }: { receipt: PaymentReceipt; onClose: () => void }) {
  return (
    <div className="mb-6 rounded-xl border border-success-500/20 bg-success-50 p-6 text-sm text-zinc-800 print:border-zinc-300 print:bg-white">
      <div className="mb-3 flex items-center justify-between print:hidden">
        <h2 className="text-base font-semibold text-success-700">Payment Receipt</h2>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            Print
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <h2 className="mb-3 hidden text-base font-semibold text-zinc-900 print:block">Payment Receipt</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Receipt Number</dt>
          <dd className="font-semibold">{receipt.receiptNumber}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Date &amp; Time</dt>
          <dd className="font-semibold">{new Date(receipt.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Student</dt>
          <dd className="font-semibold">
            {formatName(receipt.student.firstName, receipt.student.lastName)} ({receipt.student.admissionNumber})
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Class / Academic Year</dt>
          <dd className="font-semibold">
            {receipt.student.class ? titleCase(receipt.student.class.name) : '—'} · {receipt.academicYear.name}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Payment Method</dt>
          <dd className="font-semibold">{PAYMENT_METHOD_LABELS[receipt.method]}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Transaction Reference</dt>
          <dd className="font-semibold">{receipt.reference ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Amount Paid</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(receipt.amount)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Balance</dt>
          <dd className="font-semibold tabular-nums">
            {receipt.previousBalance !== null ? formatCurrency(receipt.previousBalance) : '—'} →{' '}
            {receipt.currentBalance !== null ? formatCurrency(receipt.currentBalance) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Status</dt>
          <dd>
            {receipt.status && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${FEE_STATUS_PILL_CLASSES[receipt.status]}`}
              >
                {FEE_STATUS_LABELS[receipt.status]}
              </span>
            )}
          </dd>
        </div>
      </dl>
      {receipt.smsSent !== undefined && (
        <p className="mt-3 text-xs text-zinc-500 print:hidden">
          {receipt.smsSent ? 'SMS notification sent to guardian.' : `SMS not sent${receipt.smsError ? ` (${receipt.smsError})` : '.'}`}
        </p>
      )}
    </div>
  );
}

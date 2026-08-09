import { ClassCategory, Prisma } from '../generated/prisma/client';
import { prisma } from '../config/db';

export type FeeStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface StudentFeeSummary {
  expected: number | null; // null when no FeeStructure is configured for this category+academic year
  collected: number;
  balance: number | null;
  status: FeeStatus | null;
  // False when `expected` is only non-null because it was carried forward
  // from a PRIOR academic year's rate (see buildBillingResolver) — no one
  // has actually confirmed a fee for this category in this academic year yet.
  configuredForYear: boolean;
}

// A student's expected fee is looked up by their current active enrollment's
// class category (Pre-School/Primary/JHS), not their specific class — fee
// amounts are set per level, per academic year.
export async function getStudentCategory(studentId: string): Promise<ClassCategory | null> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, isActive: true },
    select: { class: { select: { category: true } } },
  });
  return enrollment?.class.category ?? null;
}

export function computeFeeSummary(expected: number | null, collected: number): StudentFeeSummary {
  if (expected === null) {
    return { expected: null, collected, balance: null, status: null, configuredForYear: false };
  }
  const balance = expected - collected;
  const status: FeeStatus = balance <= 0 ? 'PAID' : collected > 0 ? 'PARTIAL' : 'UNPAID';
  // Reached only via the opening-balance-only fallback below (no category
  // rate known at all), so this figure was never a configured fee rate.
  return { expected, collected, balance, status, configuredForYear: false };
}

export interface TermWindow {
  id: string;
  startDate: Date;
}

// Billing is termly: a student's expected fee is the SUM of the per-term fee
// amount across every term from their enrolment term through whichever term
// is currently active — never terms before enrolment (the arrears rule: a
// mid-year admission is never billed for terms that predate them) and never
// terms after the current one (a future term hasn't started yet, so it
// hasn't billed anything). This is what makes an unpaid balance roll
// forward: as a new term becomes current, its fee adds to the running
// total, so a student who was fully paid up under the old total shows a
// fresh balance owing once the new term's charge lands.
//
// A student with no enrolment term on record (legacy data) or one that
// isn't among this academic year's terms (e.g. they enrolled in an earlier
// year and are a continuing student) is billed from the first term onward.
// If there's no current term configured at all, every term in the year is
// treated as billed — the conservative fallback for an otherwise-broken setup.
export function billedTerms(termsInYear: TermWindow[], enrolmentTermId: string | null, currentTermId: string | null): TermWindow[] {
  if (termsInYear.length === 0) return [];
  const sorted = [...termsInYear].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const enrolIndex = enrolmentTermId ? sorted.findIndex((t) => t.id === enrolmentTermId) : -1;
  const startIndex = enrolIndex === -1 ? 0 : enrolIndex;

  const currentIndex = currentTermId ? sorted.findIndex((t) => t.id === currentTermId) : -1;
  const endIndex = currentIndex === -1 ? sorted.length - 1 : currentIndex;

  if (startIndex > endIndex) return [];
  return sorted.slice(startIndex, endIndex + 1);
}

// Whether a student existed at the school as of a given term — used to
// exclude them entirely from a term-filtered view, not just bill them
// nothing. A student who enrolled in Term 2 was never present in Term 1, so
// filtering the fee list to Term 1 should drop them, not show them billed
// for zero (which still looks like a real, cleared record for that term).
export function isEnrolledAsOfTerm(
  termsInYear: TermWindow[],
  enrolmentTermId: string | null,
  asOfTermId: string | null,
): boolean {
  if (!enrolmentTermId || !asOfTermId) return true;
  const sorted = [...termsInYear].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const enrolIndex = sorted.findIndex((t) => t.id === enrolmentTermId);
  const asOfIndex = sorted.findIndex((t) => t.id === asOfTermId);
  if (enrolIndex === -1 || asOfIndex === -1) return true;
  return enrolIndex <= asOfIndex;
}

export interface ExpectedFeeInput {
  category: ClassCategory | null;
  enrolmentTermId: string | null;
  openingBalance: number;
}

// The resolved per-term charges behind a student's bill, chronological
// order, before any payment is applied. `known: false` means at least one
// billed term (or the category itself) has no rate on record — the total is
// genuinely unknown, not zero.
export interface ResolvedBilling {
  termAmounts: number[];
  openingBalance: number;
  known: boolean;
  // False when at least one billed term's rate had to fall back to a prior
  // academic year's fee structure — see the `configuredForYear` note on
  // StudentFeeSummary.
  configuredForYear: boolean;
}

// Batch-friendly resolver: fetches per-term fee structures + this year's
// terms once, then hands back a plain function so callers looping over many
// students (defaulter lists, bulk SMS, summary totals) don't each re-query
// and re-duplicate the logic. asOfTermId lets a caller pin the billing
// cutoff to a specific term (e.g. the Fee Management term filter) instead of
// always using whichever term is actually live right now — "what did this
// student owe as of Term 1" versus "what do they owe today".
export async function buildBillingResolver(
  academicYearId: string,
  asOfTermId?: string | null,
): Promise<(input: ExpectedFeeInput) => ResolvedBilling> {
  const [feeStructures, termsInYearRaw, currentTerm, priorFeeStructures] = await Promise.all([
    prisma.feeStructure.findMany({ where: { term: { academicYearId } } }),
    prisma.term.findMany({ where: { academicYearId }, select: { id: true, startDate: true } }),
    asOfTermId ? Promise.resolve(null) : prisma.term.findFirst({ where: { academicYearId, isCurrent: true }, select: { id: true } }),
    // Cross-year fallback: the most recently configured rate per category
    // from any OTHER academic year, used only once this year's own terms are
    // exhausted with nothing set — a brand-new academic year starts out
    // billing at last year's rate rather than $0 until Fee Setup is
    // explicitly updated for it.
    prisma.feeStructure.findMany({
      where: { term: { academicYearId: { not: academicYearId } } },
      orderBy: { term: { startDate: 'desc' } },
    }),
  ]);
  const cutoffTermId = asOfTermId ?? currentTerm?.id ?? null;
  const amountByKey = new Map(feeStructures.map((s) => [`${s.category}:${s.termId}`, Number(s.amount)]));
  const sortedTerms = [...termsInYearRaw].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const priorAmountByCategory = new Map<ClassCategory, number>();
  for (const s of priorFeeStructures) {
    if (!priorAmountByCategory.has(s.category)) {
      priorAmountByCategory.set(s.category, Number(s.amount));
    }
  }

  // A term with no fee configured carries forward the most recent PRIOR
  // term's rate (schools often keep charging the same amount until Fee
  // Setup is explicitly updated) — only truly unconfigured if not even an
  // earlier term in the year, nor any prior academic year, ever had an
  // amount set for this category. `fromPriorYear` flags the cross-year
  // fallback specifically, since that's the case nobody has confirmed a
  // rate for THIS academic year yet.
  function carriedAmount(category: ClassCategory, termId: string): { amount: number; fromPriorYear: boolean } | null {
    const index = sortedTerms.findIndex((t) => t.id === termId);
    for (let i = index; i >= 0; i--) {
      const amount = amountByKey.get(`${category}:${sortedTerms[i].id}`);
      if (amount !== undefined) return { amount, fromPriorYear: false };
    }
    const priorAmount = priorAmountByCategory.get(category);
    return priorAmount !== undefined ? { amount: priorAmount, fromPriorYear: true } : null;
  }

  return ({ category, enrolmentTermId, openingBalance }) => {
    if (!category) {
      return { termAmounts: [], openingBalance, known: openingBalance > 0, configuredForYear: false };
    }

    const terms = billedTerms(sortedTerms, enrolmentTermId, cutoffTermId);
    const termAmounts: number[] = [];
    let configuredForYear = true;
    for (const term of terms) {
      const resolved = carriedAmount(category, term.id);
      if (resolved === null) {
        return { termAmounts: [], openingBalance, known: openingBalance > 0, configuredForYear: false };
      }
      termAmounts.push(resolved.amount);
      if (resolved.fromPriorYear) configuredForYear = false;
    }

    return { termAmounts, openingBalance, known: true, configuredForYear };
  };
}

// The TRUE total ever billed across every term in the range — every charge
// counted once, whether or not it's since been paid off. This is deliberately
// different from summarizeBilling's `expected`, which is scoped to the
// current/viewed term plus any unpaid rollover: once a term is fully paid,
// it drops out of that figure entirely, which is correct for "what does this
// student currently owe" but wrong for "how much revenue was this ever worth"
// — a dashboard-level total must never come out lower than what's actually
// been collected just because old charges happened to get settled.
export function totalBilled(billing: ResolvedBilling): number | null {
  if (!billing.known) {
    return billing.openingBalance > 0 ? billing.openingBalance : null;
  }
  return billing.termAmounts.reduce((sum, amount) => sum + amount, 0) + billing.openingBalance;
}

// Turns a resolved billing breakdown + total collected-to-date into a
// summary for the SPECIFIC term being viewed — not a cumulative total
// across the student's whole enrollment, but not blind to history either.
// Payments don't say which term they're for, so they're applied in
// chronological order (oldest charge first, an opening balance counting as
// the very oldest); any shortfall left over from an earlier term carries
// forward and is added on top of the next term's own charge — a student who
// pays 400 of a 500 term bill still owes that 100 once the following term's
// fee lands, rather than it quietly disappearing. A term whose prior
// balance was fully cleared simply carries forward nothing, which is why a
// student who paid Term 1 in full sees Term 2 billed at just Term 2's own
// rate, not Term 1 + Term 2.
export function summarizeBilling(billing: ResolvedBilling, collected: number): StudentFeeSummary {
  if (!billing.known) {
    const expected = billing.openingBalance > 0 ? billing.openingBalance : null;
    return computeFeeSummary(expected, collected);
  }

  const queue = billing.openingBalance > 0 ? [billing.openingBalance, ...billing.termAmounts] : billing.termAmounts;

  if (queue.length === 0) {
    return { expected: 0, collected: 0, balance: 0, status: 'PAID', configuredForYear: billing.configuredForYear };
  }

  let remainingCollected = collected;
  let carry = 0;
  let billedThisTerm = 0;
  let paidThisTerm = 0;
  for (const amount of queue) {
    billedThisTerm = carry + amount;
    paidThisTerm = Math.min(Math.max(remainingCollected, 0), billedThisTerm);
    remainingCollected -= paidThisTerm;
    carry = billedThisTerm - paidThisTerm;
  }

  const balance = billedThisTerm - paidThisTerm;
  let status: FeeStatus;
  if (balance <= 0) status = 'PAID';
  else if (paidThisTerm > 0) status = 'PARTIAL';
  else status = 'UNPAID';

  return { expected: billedThisTerm, collected: paidThisTerm, balance, status, configuredForYear: billing.configuredForYear };
}

export async function getStudentFeeSummary(studentId: string, academicYearId: string): Promise<StudentFeeSummary> {
  const [category, student, resolveBilling, paymentAgg] = await Promise.all([
    getStudentCategory(studentId),
    prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { enrolmentTermId: true, openingBalance: true },
    }),
    buildBillingResolver(academicYearId),
    prisma.payment.aggregate({ where: { studentId, academicYearId }, _sum: { amount: true } }),
  ]);

  const billing = resolveBilling({
    category,
    enrolmentTermId: student?.enrolmentTermId ?? null,
    openingBalance: Number(student?.openingBalance ?? 0),
  });
  const collected = Number(paymentAgg._sum.amount ?? 0);

  return summarizeBilling(billing, collected);
}

export interface DuplicatePaymentInfo {
  receiptNumber: string;
  reference: string | null;
  amount: number;
  paidAt: Date;
  studentName: string;
  className: string | null;
  recordedByName: string;
}

export type PaymentDuplicateCheck =
  | { status: 'new' }
  | { status: 'duplicate'; existing: DuplicatePaymentInfo }
  | { status: 'soft_match'; existing: DuplicatePaymentInfo };

const duplicateCheckInclude = {
  student: {
    select: {
      user: { select: { firstName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { name: true } } },
      },
    },
  },
  recordedBy: { select: { firstName: true, lastName: true } },
} as const;

function shapeDuplicateInfo(payment: {
  receiptNumber: string;
  reference: string | null;
  amount: Prisma.Decimal;
  paidAt: Date;
  student: {
    user: { firstName: string; lastName: string };
    enrollments: { class: { name: string } | null }[];
  };
  recordedBy: { firstName: string; lastName: string };
}): DuplicatePaymentInfo {
  return {
    receiptNumber: payment.receiptNumber,
    reference: payment.reference,
    amount: Number(payment.amount),
    paidAt: payment.paidAt,
    studentName: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
    className: payment.student.enrollments[0]?.class?.name ?? null,
    recordedByName: `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}`,
  };
}

// Two-tier duplicate protection for bank receipt entry:
//  - "duplicate" (red, blocking): the exact Bank Receipt/Ref No. already
//    exists on another payment, anywhere — a receipt number is meant to be
//    a unique key, so any repeat is treated as the same transaction re-entered.
//  - "soft_match" (amber, needs confirmation): no reference collision, but
//    the same student was charged the same amount within the last 24 hours —
//    plausibly a genuine second payment, but worth a human double-check.
export async function checkPaymentDuplicate(input: {
  reference?: string | null;
  studentId: string;
  amount: number;
}): Promise<PaymentDuplicateCheck> {
  if (input.reference) {
    const exact = await prisma.payment.findFirst({
      where: { reference: input.reference },
      include: duplicateCheckInclude,
      orderBy: { createdAt: 'desc' },
    });
    if (exact) {
      return { status: 'duplicate', existing: shapeDuplicateInfo(exact) };
    }
  }

  const since = new Date();
  since.setHours(since.getHours() - 24);
  const soft = await prisma.payment.findFirst({
    where: { studentId: input.studentId, amount: input.amount, createdAt: { gte: since } },
    include: duplicateCheckInclude,
    orderBy: { createdAt: 'desc' },
  });
  if (soft) {
    return { status: 'soft_match', existing: shapeDuplicateInfo(soft) };
  }

  return { status: 'new' };
}

// REC-YYYYMMDD-XXXX, sequential per day across the whole school.
export async function generateReceiptNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const countToday = await tx.payment.count({ where: { createdAt: { gte: startOfDay } } });
  return `REC-${datePart}-${String(countToday + 1).padStart(4, '0')}`;
}

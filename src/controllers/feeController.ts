import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { ClassCategory, PaymentMethod } from '../generated/prisma/client';
import { buildNameSearchWhere } from '../utils/nameSearch';
import {
  buildBillingResolver,
  checkPaymentDuplicate,
  generateReceiptNumber,
  getStudentCategory,
  getStudentFeeSummary,
  isEnrolledAsOfTerm,
  summarizeBilling,
  totalBilled,
} from '../services/feeService';
import { getPrimaryGuardianContact } from '../services/guardianService';
import { sendSms } from '../services/smsService';

const VALID_CATEGORIES: ClassCategory[] = ['PRE_SCHOOL', 'PRIMARY', 'JHS'];
const VALID_METHODS: PaymentMethod[] = ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'];

export const listFeeStructures = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, termId } = req.query;

  const structures = await prisma.feeStructure.findMany({
    where: {
      ...(termId ? { termId: String(termId) } : {}),
      ...(academicYearId ? { term: { academicYearId: String(academicYearId) } } : {}),
    },
    include: { term: { select: { id: true, name: true, academicYearId: true } } },
    orderBy: [{ term: { startDate: 'asc' } }, { category: 'asc' }],
  });

  return res.status(200).json(
    structures.map((s) => ({
      id: s.id,
      category: s.category,
      termId: s.termId,
      termName: s.term.name,
      academicYearId: s.term.academicYearId,
      amount: Number(s.amount),
    })),
  );
};

export const upsertFeeStructure = async (req: Request, res: Response): Promise<Response> => {
  const { category, termId, amount } = req.body;

  if (!category || !termId || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'category, termId, and amount are required.' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ error: 'amount must be a non-negative number.' });
  }

  try {
    const structure = await prisma.feeStructure.upsert({
      where: { category_termId: { category, termId } },
      update: { amount: numericAmount },
      create: { category, termId, amount: numericAmount },
      include: { term: { select: { id: true, name: true, academicYearId: true } } },
    });

    return res.status(200).json({
      id: structure.id,
      category: structure.category,
      termId: structure.termId,
      termName: structure.term.name,
      academicYearId: structure.term.academicYearId,
      amount: Number(structure.amount),
    });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'That term does not exist.' });
    }
    console.error('Upsert Fee Structure Error:', error);
    return res.status(500).json({ error: 'Internal server error while saving fee structure.' });
  }
};

export const listStudentFees = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, classId, termId, status, search } = req.query;

  if (!academicYearId) {
    return res.status(400).json({ error: 'academicYearId is required.' });
  }

  const students = await prisma.studentProfile.findMany({
    where: {
      ...(classId ? { enrollments: { some: { classId: String(classId), isActive: true } } } : {}),
      user: buildNameSearchWhere(search),
    },
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { id: true, name: true, code: true, category: true } } },
      },
    },
    orderBy: { user: { firstName: 'asc' } },
  });

  const asOfTermId = termId ? String(termId) : null;
  const [resolveBilling, paymentTotals, termsInYear] = await Promise.all([
    buildBillingResolver(String(academicYearId), asOfTermId),
    prisma.payment.groupBy({ by: ['studentId'], where: { academicYearId: String(academicYearId) }, _sum: { amount: true } }),
    asOfTermId ? prisma.term.findMany({ where: { academicYearId: String(academicYearId) }, select: { id: true, startDate: true } }) : Promise.resolve([]),
  ]);

  const collectedByStudent = new Map(paymentTotals.map((p) => [p.studentId, Number(p._sum.amount ?? 0)]));

  // Filtering to a specific term excludes students who weren't enrolled yet
  // as of that term — a student who joined in Term 2 was never present in
  // Term 1, so they shouldn't appear (billed or otherwise) in a Term 1 view.
  const visibleStudents = asOfTermId
    ? students.filter((s) => isEnrolledAsOfTerm(termsInYear, s.enrolmentTermId, asOfTermId))
    : students;

  const rows = visibleStudents.map((s) => {
    const activeClass = s.enrollments[0]?.class ?? null;
    const billing = resolveBilling({
      category: activeClass?.category ?? null,
      enrolmentTermId: s.enrolmentTermId,
      openingBalance: Number(s.openingBalance),
    });
    const collected = collectedByStudent.get(s.id) ?? 0;
    const summary = summarizeBilling(billing, collected);

    return {
      id: s.id,
      admissionNumber: s.admissionNumber,
      firstName: s.user.firstName,
      otherName: s.user.otherName,
      lastName: s.user.lastName,
      class: activeClass,
      ...summary,
    };
  });

  const filtered = status ? rows.filter((r) => r.status === status) : rows;

  return res.status(200).json(filtered);
};

export const getStudentFeeDetail = async (req: Request, res: Response): Promise<Response> => {
  const studentId = String(req.params.studentId);
  const { academicYearId } = req.query;

  if (!academicYearId) {
    return res.status(400).json({ error: 'academicYearId is required.' });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { id: true, name: true, code: true, category: true } } },
      },
    },
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const [summary, payments] = await Promise.all([
    getStudentFeeSummary(studentId, String(academicYearId)),
    prisma.payment.findMany({
      where: { studentId, academicYearId: String(academicYearId) },
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return res.status(200).json({
    id: student.id,
    admissionNumber: student.admissionNumber,
    firstName: student.user.firstName,
    otherName: student.user.otherName,
    lastName: student.user.lastName,
    class: student.enrollments[0]?.class ?? null,
    enrolmentDate: student.enrolmentDate,
    openingBalance: Number(student.openingBalance),
    ...summary,
    payments: payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      recordedBy: `${p.recordedBy.firstName} ${p.recordedBy.lastName}`,
      createdAt: p.createdAt,
    })),
  });
};

// Live check the Bank Receipt entry form calls (debounced, on blur) before
// the admin is allowed to save — see checkPaymentDuplicate for the two-tier
// duplicate/soft-match logic. This is advisory only; recordPayment re-runs
// the same check server-side so the result can't be bypassed.
export const checkPaymentReference = async (req: Request, res: Response): Promise<Response> => {
  const { reference, studentId, amount } = req.query;

  if (!studentId || amount === undefined) {
    return res.status(400).json({ error: 'studentId and amount are required.' });
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' });
  }

  const result = await checkPaymentDuplicate({
    reference: reference ? String(reference) : null,
    studentId: String(studentId),
    amount: numericAmount,
  });

  return res.status(200).json(result);
};

export const recordPayment = async (req: Request, res: Response): Promise<Response> => {
  const {
    studentId,
    academicYearId,
    amount,
    method,
    reference,
    bankName,
    branchOrChannel,
    paidAt,
    confirmDuplicate,
  } = req.body;

  if (!studentId || !academicYearId || amount === undefined || amount === null || !method) {
    return res.status(400).json({ error: 'studentId, academicYearId, amount, and method are required.' });
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' });
  }
  if (!VALID_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method.' });
  }

  // Bank Receipt entries carry the extra paperwork trail a cash/momo entry
  // doesn't need: the receipt/ref number is the unique key duplicate
  // detection hangs off, and bankName identifies where the deposit landed.
  if (method === 'BANK_TRANSFER' && !reference) {
    return res.status(400).json({ error: 'Bank Receipt / Ref No. is required for bank receipt payments.' });
  }
  if (method === 'BANK_TRANSFER' && !bankName) {
    return res.status(400).json({ error: 'Bank Name is required for bank receipt payments.' });
  }

  // Re-run the same duplicate check the live UI check used — never trust the
  // client's word that a receipt was clean or that a soft-match was reviewed.
  const duplicateCheck = await checkPaymentDuplicate({
    reference: reference || null,
    studentId,
    amount: numericAmount,
  });
  if (duplicateCheck.status === 'duplicate') {
    return res.status(409).json({
      error: `Duplicate Receipt Flagged: Receipt #${reference} was already recorded on ${duplicateCheck.existing.paidAt.toISOString().slice(0, 10)} for student ${duplicateCheck.existing.studentName}${duplicateCheck.existing.className ? ` (${duplicateCheck.existing.className})` : ''} by ${duplicateCheck.existing.recordedByName}.`,
    });
  }
  if (duplicateCheck.status === 'soft_match' && !confirmDuplicate) {
    return res.status(409).json({
      error: `Possible Duplicate Entry: A payment of GHS ${duplicateCheck.existing.amount.toFixed(2)} was already recorded for this student today under Receipt #${duplicateCheck.existing.reference ?? duplicateCheck.existing.receiptNumber}. Confirm this is a distinct transaction to proceed.`,
      requiresConfirmation: true,
    });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { firstName: true, otherName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { id: true, name: true, code: true, category: true } } },
      },
    },
  });
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  if (!academicYear) {
    return res.status(404).json({ error: 'Academic year not found.' });
  }

  const category = await getStudentCategory(studentId);
  const feeStructure = category
    ? await prisma.feeStructure.findFirst({ where: { category, term: { academicYearId } } })
    : null;

  if (!feeStructure) {
    return res
      .status(400)
      .json({ error: 'No fee amount has been configured for this class level in any term of this academic year yet.' });
  }

  const [resolveBilling, previousSummary] = await Promise.all([
    buildBillingResolver(academicYearId),
    getStudentFeeSummary(studentId, academicYearId),
  ]);
  const billing = resolveBilling({
    category,
    enrolmentTermId: student.enrolmentTermId,
    openingBalance: Number(student.openingBalance),
  });

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx);
      return tx.payment.create({
        data: {
          receiptNumber,
          studentId,
          academicYearId,
          amount: numericAmount,
          method,
          reference: reference || null,
          bankName: bankName || null,
          branchOrChannel: branchOrChannel || null,
          ...(paidAt ? { paidAt: new Date(paidAt) } : {}),
          recordedById: req.user!.id,
        },
      });
    });

    const newSummary = summarizeBilling(billing, (previousSummary.collected ?? 0) + numericAmount);
    const studentName = `${student.user.firstName} ${student.user.lastName}`;

    // Best-effort: the payment is already committed, so a missing guardian
    // phone or an SMS provider failure must never turn into an error response.
    const guardian = await getPrimaryGuardianContact(studentId);
    const smsResult = guardian
      ? await sendSms(
          guardian.phone,
          `Dear ${guardian.fullName}, we have received GHS ${numericAmount.toFixed(2)} for ${studentName}'s school fees (${academicYear.name}). Receipt: ${payment.receiptNumber}. Balance: GHS ${(newSummary.balance ?? 0).toFixed(2)}. Thank you - Waller Academy.`,
        )
      : { sent: false, error: 'No guardian on file for this student.' };

    return res.status(201).json({
      receiptNumber: payment.receiptNumber,
      createdAt: payment.createdAt,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.user.firstName,
        otherName: student.user.otherName,
        lastName: student.user.lastName,
        class: student.enrollments[0]?.class ?? null,
      },
      academicYear: { id: academicYear.id, name: academicYear.name },
      amount: numericAmount,
      method,
      reference: reference || null,
      bankName: bankName || null,
      branchOrChannel: branchOrChannel || null,
      paidAt: payment.paidAt,
      previousBalance: previousSummary.balance,
      currentBalance: newSummary.balance,
      status: newSummary.status,
      smsSent: smsResult.sent,
      smsError: smsResult.sent ? undefined : smsResult.error,
    });
  } catch (error) {
    console.error('Record Payment Error:', error);
    return res.status(500).json({ error: 'Internal server error while recording payment.' });
  }
};

export const getFeeSummary = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, classId, termId } = req.query;

  if (!academicYearId) {
    return res.status(400).json({ error: 'academicYearId is required.' });
  }

  const students = await prisma.studentProfile.findMany({
    where: classId ? { enrollments: { some: { classId: String(classId), isActive: true } } } : undefined,
    include: {
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { category: true } } },
      },
    },
  });

  const asOfTermId = termId ? String(termId) : null;
  const [resolveBilling, paymentTotals, termsInYear] = await Promise.all([
    buildBillingResolver(String(academicYearId), asOfTermId),
    prisma.payment.groupBy({ by: ['studentId'], where: { academicYearId: String(academicYearId) }, _sum: { amount: true } }),
    asOfTermId ? prisma.term.findMany({ where: { academicYearId: String(academicYearId) }, select: { id: true, startDate: true } }) : Promise.resolve([]),
  ]);

  const collectedByStudent = new Map(paymentTotals.map((p) => [p.studentId, Number(p._sum.amount ?? 0)]));

  const visibleStudents = asOfTermId
    ? students.filter((s) => isEnrolledAsOfTerm(termsInYear, s.enrolmentTermId, asOfTermId))
    : students;

  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let totalExpected = 0;
  let totalCollected = 0;

  for (const s of visibleStudents) {
    const activeClass = s.enrollments[0]?.class ?? null;
    const billing = resolveBilling({
      category: activeClass?.category ?? null,
      enrolmentTermId: s.enrolmentTermId,
      openingBalance: Number(s.openingBalance),
    });
    const collected = collectedByStudent.get(s.id) ?? 0;
    const summary = summarizeBilling(billing, collected);
    const billed = totalBilled(billing);

    if (billed !== null) totalExpected += billed;
    totalCollected += collected;

    if (summary.status === 'PAID') paidCount += 1;
    else if (summary.status === 'PARTIAL') partialCount += 1;
    else if (summary.status === 'UNPAID') unpaidCount += 1;
  }

  const defaulterCount = partialCount + unpaidCount;

  return res.status(200).json({
    totalStudents: visibleStudents.length,
    paidCount,
    partialCount,
    unpaidCount,
    defaulterCount,
    defaulterPercent: students.length > 0 ? (defaulterCount / students.length) * 100 : 0,
    totalExpected,
    totalCollected,
    totalOutstanding: totalExpected - totalCollected,
  });
};

export const getAuditTrail = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, termId, classId, limit } = req.query;

  let createdAtFilter: { gte: Date; lt: Date } | undefined;
  if (termId) {
    const term = await prisma.term.findUnique({ where: { id: String(termId) } });
    if (!term) {
      return res.status(404).json({ error: 'Term not found.' });
    }
    const endExclusive = new Date(term.endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);
    createdAtFilter = { gte: term.startDate, lt: endExclusive };
  }

  const payments = await prisma.payment.findMany({
    where: {
      ...(academicYearId ? { academicYearId: String(academicYearId) } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(classId ? { student: { enrollments: { some: { classId: String(classId), isActive: true } } } } : {}),
    },
    include: {
      student: { select: { admissionNumber: true, user: { select: { firstName: true, lastName: true } } } },
      academicYear: { select: { name: true } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? Number(limit) : 50,
  });

  return res.status(200).json(
    payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      studentName: `${p.student.user.firstName} ${p.student.user.lastName}`,
      admissionNumber: p.student.admissionNumber,
      academicYearName: p.academicYear.name,
      amount: Number(p.amount),
      method: p.method,
      reference: p.reference,
      recordedBy: `${p.recordedBy.firstName} ${p.recordedBy.lastName}`,
      createdAt: p.createdAt,
    })),
  );
};

// Reconstructs a receipt exactly as it would have looked at the moment this
// payment was recorded — balances are derived from the ledger (every other
// payment for this student+year that happened strictly before this one),
// never stored, so a reprint stays accurate even if later payments changed
// the *current* balance.
export const getPaymentReceipt = async (req: Request, res: Response): Promise<Response> => {
  const id = String(req.params.id);

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          enrolmentTermId: true,
          openingBalance: true,
          user: { select: { firstName: true, otherName: true, lastName: true } },
          enrollments: {
            where: { isActive: true },
            take: 1,
            select: { class: { select: { id: true, name: true, code: true, category: true } } },
          },
        },
      },
      academicYear: { select: { id: true, name: true } },
    },
  });

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found.' });
  }

  const resolveBilling = await buildBillingResolver(payment.academicYearId);
  const billing = resolveBilling({
    category: payment.student.enrollments[0]?.class.category ?? null,
    enrolmentTermId: payment.student.enrolmentTermId,
    openingBalance: Number(payment.student.openingBalance),
  });

  const priorAgg = await prisma.payment.aggregate({
    where: {
      studentId: payment.student.id,
      academicYearId: payment.academicYearId,
      createdAt: { lt: payment.createdAt },
    },
    _sum: { amount: true },
  });
  const collectedBefore = Number(priorAgg._sum.amount ?? 0);
  const amount = Number(payment.amount);

  const previousSummary = summarizeBilling(billing, collectedBefore);
  const newSummary = summarizeBilling(billing, collectedBefore + amount);

  return res.status(200).json({
    receiptNumber: payment.receiptNumber,
    createdAt: payment.createdAt,
    student: {
      id: payment.student.id,
      admissionNumber: payment.student.admissionNumber,
      firstName: payment.student.user.firstName,
      otherName: payment.student.user.otherName,
      lastName: payment.student.user.lastName,
      class: payment.student.enrollments[0]?.class ?? null,
    },
    academicYear: { id: payment.academicYear.id, name: payment.academicYear.name },
    amount,
    method: payment.method,
    reference: payment.reference,
    previousBalance: previousSummary.balance,
    currentBalance: newSummary.balance,
    status: newSummary.status,
    // No smsSent/smsError here — a reprint doesn't re-send anything, and we
    // never recorded whether the original send succeeded, so the receipt UI
    // simply omits that line for reprints rather than guessing.
  });
};

// Texts every guardian of a student who currently owes money (PARTIAL or
// UNPAID) within the given academic year, optionally narrowed to one class.
// Restricted to students with a real balance server-side regardless of what
// the caller passes — a "remind" action must never text a parent who has
// already paid in full. If `message` is given, that exact text goes to every
// recipient verbatim (no per-guardian personalization); otherwise each
// guardian gets the default personalized reminder.
export const sendFeeReminders = async (req: Request, res: Response): Promise<Response> => {
  const { academicYearId, classId, message: customMessage } = req.body;

  if (!academicYearId) {
    return res.status(400).json({ error: 'academicYearId is required.' });
  }

  const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  if (!academicYear) {
    return res.status(404).json({ error: 'Academic year not found.' });
  }

  const students = await prisma.studentProfile.findMany({
    where: classId ? { enrollments: { some: { classId: String(classId), isActive: true } } } : undefined,
    include: {
      user: { select: { firstName: true, lastName: true } },
      enrollments: {
        where: { isActive: true },
        take: 1,
        select: { class: { select: { category: true } } },
      },
    },
  });

  const [resolveBilling, paymentTotals] = await Promise.all([
    buildBillingResolver(String(academicYearId)),
    prisma.payment.groupBy({ by: ['studentId'], where: { academicYearId: String(academicYearId) }, _sum: { amount: true } }),
  ]);

  const collectedByStudent = new Map(paymentTotals.map((p) => [p.studentId, Number(p._sum.amount ?? 0)]));

  const summaryFor = (s: (typeof students)[number]) => {
    const billing = resolveBilling({
      category: s.enrollments[0]?.class.category ?? null,
      enrolmentTermId: s.enrolmentTermId,
      openingBalance: Number(s.openingBalance),
    });
    const collected = collectedByStudent.get(s.id) ?? 0;
    return summarizeBilling(billing, collected);
  };

  const defaulters = students.filter((s) => {
    const summary = summaryFor(s);
    return summary.status === 'PARTIAL' || summary.status === 'UNPAID';
  });

  let sent = 0;
  let failed = 0;
  let noGuardian = 0;

  for (const s of defaulters) {
    const summary = summaryFor(s);

    const guardian = await getPrimaryGuardianContact(s.id);
    if (!guardian) {
      noGuardian += 1;
      continue;
    }

    const studentName = `${s.user.firstName} ${s.user.lastName}`;
    const message =
      customMessage && String(customMessage).trim()
        ? String(customMessage).trim()
        : `Dear ${guardian.fullName}, this is a reminder that ${studentName}'s school fees balance of GHS ${(summary.balance ?? 0).toFixed(2)} for ${academicYear.name} is outstanding. Kindly settle at your earliest convenience. Thank you - SavannaSMS.`;

    const result = await sendSms(guardian.phone, message);
    if (result.sent) sent += 1;
    else failed += 1;
  }

  return res.status(200).json({
    totalDefaulters: defaulters.length,
    sent,
    failed,
    noGuardian,
  });
};

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  lastLogin: string | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface LoginOtpRequiredResponse {
  requiresOtp: true;
  username: string;
  message: string;
}

export interface DashboardStats {
  population: { total: number; boys: number; girls: number };
  staff?: { total: number; teaching: number; nonTeaching: number };
  fees?: {
    totalCollected: number;
    totalDebtors: number;
    totalExpected: number;
    academicYearName: string | null;
    termName: string | null;
  };
  newEnrollments?: number;
  classrooms?: { total: number; preSchool: number; primary: number; jhs: number };
}

export interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface SchoolSettings {
  name: string;
  address: string;
  phone: string;
}

export type ClassCategory = 'PRE_SCHOOL' | 'PRIMARY' | 'JHS';

export type Gender = 'MALE' | 'FEMALE';

export type Department = 'PRE_SCHOOL' | 'PRIMARY' | 'JHS' | 'ICT' | 'NON_TEACHING';

export type GuardianRelation = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';

export type EmploymentStatus = 'FULL_TIME' | 'PART_TIME' | 'SUBSTITUTE';

export type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'TEMPORARY';

export interface Teacher {
  id: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  employeeId: string;
  department: Department | null;
  phone: string | null;
  gender: Gender | null;
  qualification: string | null;
  employmentStatus: EmploymentStatus | null;
  assignedClass: { id: string; name: string } | null;
}

export interface TeacherDetail extends Teacher {
  username: string;
  email: string | null;
  contractType: ContractType | null;
  hiredAt: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  ssnitNumber: string | null;
  assignedClasses: { id: string; name: string; code: string; category: ClassCategory; studentCount: number }[];
  totalStudents: number;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  category: ClassCategory;
  academicYearId: string;
  gradeLevelId: string;
  gradeLevel: { id: string; name: string; order: number } | null;
  formTeacher: { id: string; firstName: string; lastName: string } | null;
  studentCount: number;
}

export interface PromotionRule {
  id: string;
  gradeLevelId: string | null;
  gradeLevel?: { id: string; name: string } | null;
  promoteMinAverage: number;
  probationMinAverage: number;
  probationPromotes: boolean;
}

export interface GradeLevel {
  id: string;
  name: string;
  category: ClassCategory;
  order: number;
  promotesToId: string | null;
  promotesTo: { id: string; name: string } | null;
  promotionRule: PromotionRule | null;
  classCount: number;
}

export type PromotionStatus = 'DRAFT' | 'EXECUTED';
export type PromotionDecision = 'PROMOTED' | 'PROBATION' | 'REPEATED' | 'GRADUATED';
export type SectionStrategy = 'MAINTAIN_STREAM' | 'AUTO_DISTRIBUTE' | 'UNASSIGNED_POOL';

export interface PromotionResultItem {
  id: string;
  promotionRunId: string;
  studentId: string;
  fromClassId: string;
  cumulativeAverage: number;
  decision: PromotionDecision;
  decisionOverridden: boolean;
  targetGradeLevelId: string | null;
  student: { id: string; admissionNumber: string; user: { firstName: string; otherName: string | null; lastName: string } };
  fromClass: { id: string; name: string };
  toClass: { id: string; name: string } | null;
}

export interface PromotionRun {
  id: string;
  fromAcademicYearId: string;
  toAcademicYearId: string;
  fromAcademicYear: { id: string; name: string };
  toAcademicYear: { id: string; name: string };
  status: PromotionStatus;
  sectionStrategy: SectionStrategy | null;
  createdBy: { id: string; firstName: string; lastName: string };
  executedAt: string | null;
  createdAt: string;
  _count: { results: number };
  results?: PromotionResultItem[];
}

export interface StaffUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  categories: ClassCategory[];
}

export interface ClassStudent {
  id: string;
  admissionNumber: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  gender: Gender | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianAddress: string | null;
  guardianRelation: GuardianRelation | null;
}

export interface Term {
  id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface CurrentTerm extends Term {
  academicYear: { id: string; name: string };
}

export interface ClassSubjectItem {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacher: { id: string; firstName: string; lastName: string } | null;
}

export interface ScoreRoster {
  termId: string;
  students: StudentScore[];
}

export interface StudentScore {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  classScore: number | null;
  examScore: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
}

export interface ClassReportSubject {
  classSubjectId: string;
  subjectName: string;
  subjectCode: string;
}

export interface ClassReportStudent {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  scores: Record<string, number | null>;
}

export interface ClassReport {
  subjects: ClassReportSubject[];
  students: ClassReportStudent[];
}

export interface ReportCardSubject {
  subjectName: string;
  classScore: number | null;
  examScore: number | null;
  total: number | null;
  position: string | null;
  remark: string | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
}

export interface StudentReportCard {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    otherName: string | null;
    lastName: string;
    gender: Gender | null;
  };
  academicYear: { id: string; name: string };
  term: { id: string; name: string };
  class: { id: string; name: string };
  noOnRoll: number;
  nextTermBeginDate: string | null;
  isFinalTerm: boolean;
  averageScore: number | null;
  positionInClass: string | null;
  cumulativeAverage: number | null;
  subjects: ReportCardSubject[];
}

export interface ClassReportCards {
  class: { id: string; name: string };
  term: { id: string; name: string };
  students: StudentReportCard[];
}

export interface StudentListItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  gender: Gender | null;
  dateOfBirth: string;
  class: { id: string; name: string; code: string; category: ClassCategory } | null;
}

export interface StudentGuardianDetail {
  guardianId: string;
  fullName: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  relation: GuardianRelation;
  isPrimary: boolean;
}

export interface StudentDetail extends StudentListItem {
  username: string;
  guardians: StudentGuardianDetail[];
}

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';

export type FeeStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface FeeStructureItem {
  id: string;
  category: ClassCategory;
  termId: string;
  termName: string;
  academicYearId: string;
  amount: number;
}

export interface StudentFeeRow {
  id: string;
  admissionNumber: string;
  firstName: string;
  otherName: string | null;
  lastName: string;
  class: { id: string; name: string; code: string; category: ClassCategory } | null;
  expected: number | null;
  collected: number;
  balance: number | null;
  status: FeeStatus | null;
  // False when `expected` is only non-null because it was carried forward
  // from a prior academic year's rate — no fee has been set for this year yet.
  configuredForYear: boolean;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface StudentFeeDetail extends StudentFeeRow {
  payments: PaymentRecord[];
}

export interface PaymentReceipt {
  receiptNumber: string;
  createdAt: string;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    otherName: string | null;
    lastName: string;
    class: { id: string; name: string; code: string; category: ClassCategory } | null;
  };
  academicYear: { id: string; name: string };
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  bankName?: string | null;
  branchOrChannel?: string | null;
  paidAt?: string;
  previousBalance: number | null;
  currentBalance: number | null;
  status: FeeStatus | null;
  smsSent?: boolean;
  smsError?: string;
}

export interface DuplicatePaymentInfo {
  receiptNumber: string;
  reference: string | null;
  amount: number;
  paidAt: string;
  studentName: string;
  className: string | null;
  recordedByName: string;
}

export type PaymentDuplicateCheck =
  | { status: 'new' }
  | { status: 'duplicate'; existing: DuplicatePaymentInfo }
  | { status: 'soft_match'; existing: DuplicatePaymentInfo };

export interface FeeSummary {
  totalStudents: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  defaulterCount: number;
  defaulterPercent: number;
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface FeeReminderResult {
  totalDefaulters: number;
  sent: number;
  failed: number;
  noGuardian: number;
}

export interface FeeAuditEntry {
  id: string;
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  academicYearName: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  recordedBy: string;
  createdAt: string;
}

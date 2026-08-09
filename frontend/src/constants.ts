import type {
  ClassCategory,
  ContractType,
  Department,
  EmploymentStatus,
  FeeStatus,
  GuardianRelation,
  PaymentMethod,
} from './types';

// Keep in sync with the `gradeRemark` bands in src/controllers/reportCardController.ts.
export const GRADE_INTERPRETATION =
  '90-100=Excellent, 80-89=Very Good, 70-79=Good, 60-69=Credit, 50-59=Pass, 40-49=Weak, 0-39=Very Weak';

export const CLASS_CATEGORIES: ClassCategory[] = ['PRE_SCHOOL', 'PRIMARY', 'JHS'];

export const CLASS_CATEGORY_LABELS: Record<ClassCategory, string> = {
  PRE_SCHOOL: 'Pre-School',
  PRIMARY: 'Primary',
  JHS: 'JHS',
};

export const DEPARTMENTS: Department[] = ['PRE_SCHOOL', 'PRIMARY', 'JHS', 'ICT', 'NON_TEACHING'];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  PRE_SCHOOL: 'Pre-School',
  PRIMARY: 'Primary',
  JHS: 'Junior High School',
  ICT: 'ICT',
  NON_TEACHING: 'Non Teaching',
};

export const GUARDIAN_RELATIONS: GuardianRelation[] = ['MOTHER', 'FATHER','OTHER','GUARDIAN'];

export const GUARDIAN_RELATION_LABELS: Record<GuardianRelation, string> = {
  MOTHER: 'Mother',
  FATHER: 'Father',
  GUARDIAN: 'Guardian',
  OTHER: 'Other',
};

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['FULL_TIME', 'PART_TIME', 'SUBSTITUTE'];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  SUBSTITUTE: 'Substitute',
};

export const CONTRACT_TYPES: ContractType[] = ['PERMANENT', 'FIXED_TERM', 'TEMPORARY'];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  PERMANENT: 'Permanent',
  FIXED_TERM: 'Fixed-Term',
  TEMPORARY: 'Temporary',
};

export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  MOBILE_MONEY: 'Momo',
  BANK_TRANSFER: 'Bank Receipt',
};

export const GHANA_BANKS = [
  'GCB Bank',
  'Ecobank',
  'Zenith Bank',
  'CalBank',
  'Absa Bank',
  'Stanbic Bank',
  'Fidelity Bank',
  'Access Bank',
  'Republic Bank',
  'ADB Bank',
  'UBA',
  'Other',
];

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

export const FEE_STATUS_PILL_CLASSES: Record<FeeStatus, string> = {
  PAID: 'bg-success-50 text-success-700',
  PARTIAL: 'bg-warning-50 text-warning-700',
  UNPAID: 'bg-danger-50 text-danger-700',
};

// Balances table on the Fee Management dashboard uses this specific wording
// for the same three statuses (a "defaulter" is just an UNPAID student).
export const BALANCE_STATUS_LABELS: Record<FeeStatus, string> = {
  PAID: 'Cleared',
  PARTIAL: 'Partial',
  UNPAID: 'Defaulter',
};

import type { ClassCategory, ContractType, Department, EmploymentStatus, GuardianRelation } from './types';

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

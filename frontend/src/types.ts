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

export interface DashboardStats {
  population: { total: number; boys: number; girls: number };
  staff?: { total: number; teaching: number; nonTeaching: number };
  fees?: { totalCollected: number; totalDebtors: number };
  newEnrollments?: number;
  classrooms?: { total: number; preSchool: number; primary: number; jhs: number };
}

export interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
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
}

export interface TeacherDetail extends Teacher {
  username: string;
  contractType: ContractType | null;
  hiredAt: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  ssnitNumber: string | null;
  assignedClasses: { id: string; name: string; code: string; category: ClassCategory }[];
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  category: ClassCategory;
  roomNumber: string | null;
  academicYearId: string;
  formTeacher: { id: string; firstName: string; lastName: string } | null;
  studentCount: number;
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

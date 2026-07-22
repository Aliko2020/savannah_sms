import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { apiFetch, ApiError } from "../api/client";
import {
  CLASS_CATEGORIES,
  CLASS_CATEGORY_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  GUARDIAN_RELATIONS,
  GUARDIAN_RELATION_LABELS,
} from "../constants";
import { titleCase } from "../utils/format";
import type {
  AcademicYear,
  ClassItem,
  ContractType,
  Department,
  EmploymentStatus,
  Gender,
  GuardianRelation,
  Role,
} from "../types";
import { LaptopIcon } from "../components/icons";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

interface CreateUserResponse {
  message: string;
  userId: string;
  username: string;
  admissionNumber?: string;
  employeeId?: string;
  generatedPassword?: string;
}

interface StaffUser {
  id: string;
  role: Role;
}

export function CreateUserPage() {
  const { user: currentUser } = useAuth();

  // Admins can only enroll teachers/students; only a Super Admin can create
  // an Admin, and a Super Admin can only ever exist once.
  const { data: existingSuperAdmins } = useQuery({
    queryKey: ["users", "SUPER_ADMIN"],
    queryFn: () => apiFetch<StaffUser[]>("/users?role=SUPER_ADMIN"),
    enabled: currentUser?.role === "SUPER_ADMIN",
  });
  const superAdminExists = (existingSuperAdmins?.length ?? 0) > 0;

  const ROLES: Role[] =
    currentUser?.role === "SUPER_ADMIN"
      ? (["STUDENT", "TEACHER", "ADMIN", ...(superAdminExists ? [] : ["SUPER_ADMIN" as const])])
      : ["STUDENT", "TEACHER"];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [otherName, setOtherName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");

  // STUDENT/TEACHER get an auto-generated username + password instead of typing one.
  const autoGenerateCredentials = role === "STUDENT" || role === "TEACHER";

  // STUDENT-only fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [classId, setClassId] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianAlternatePhone, setGuardianAlternatePhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [guardianRelation, setGuardianRelation] =
    useState<GuardianRelation>("GUARDIAN");

  // TEACHER-only fields
  const [department, setDepartment] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherGender, setTeacherGender] = useState<Gender>("MALE");
  const [qualification, setQualification] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | "">("");
  const [contractType, setContractType] = useState<ContractType | "">("");
  const [ssnitNumber, setSsnitNumber] = useState("");

  const { data: academicYears } = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => apiFetch<AcademicYear[]>("/academic-years"),
    enabled: role === "STUDENT",
  });
  const currentYear =
    academicYears?.find((y) => y.isCurrent) ?? academicYears?.[0];

  const { data: classes } = useQuery({
    queryKey: ["classes", currentYear?.id],
    queryFn: () =>
      apiFetch<ClassItem[]>(`/classes?academicYearId=${currentYear!.id}`),
    enabled: role === "STUDENT" && !!currentYear,
  });

  const studentBlocked = role === "STUDENT" && (classes?.length ?? 0) === 0;

  const mutation = useMutation({
    mutationFn: () => {
      const profileData =
        role === "STUDENT"
          ? {
              dateOfBirth,
              gender,
              classId,
              guardianName,
              guardianPhone,
              guardianAlternatePhone: guardianAlternatePhone || undefined,
              guardianEmail: guardianEmail || undefined,
              guardianAddress: guardianAddress || undefined,
              guardianRelation,
            }
          : role === "TEACHER"
            ? {
                department: department || undefined,
                phone: teacherPhone,
                gender: teacherGender,
                qualification: qualification || undefined,
                employmentStatus: employmentStatus || undefined,
                contractType: contractType || undefined,
                ssnitNumber: ssnitNumber || undefined,
              }
            : undefined;

      return apiFetch<CreateUserResponse>("/users", {
        method: "POST",
        body: JSON.stringify({
          ...(autoGenerateCredentials ? {} : { username, password }),
          firstName,
          otherName: otherName || undefined,
          lastName,
          role,
          profileData,
        }),
      });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <AppLayout>
      <PageHeader title="Enroll Student / Add Teacher" icon={LaptopIcon} />
      <div className="max-w-5xl rounded-lg bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Other name
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            {!autoGenerateCredentials && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {role === "STUDENT" && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date of birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Grade / Class <span className="text-red-500">*</span>
                  </label>
                  {classes && classes.length > 0 ? (
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a class
                    </option>
                    {CLASS_CATEGORIES.map((category) => {
                      const inCategory = classes.filter(
                        (c) => c.category === category,
                      );
                      if (inCategory.length === 0) return null;
                      return (
                        <optgroup
                          key={category}
                          label={CLASS_CATEGORY_LABELS[category]}
                        >
                          {inCategory.map((c) => (
                            <option key={c.id} value={c.id}>
                              {titleCase(c.name)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                ) : (
                  <p className="rounded border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                    No classes set up yet.{" "}
                    <Link
                      to="/classes"
                      className="font-medium text-brand hover:underline"
                    >
                      Create one first
                    </Link>
                    .
                  </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Parent / Guardian
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Relationship
                    </label>
                    <select
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianRelation}
                      onChange={(e) =>
                        setGuardianRelation(e.target.value as GuardianRelation)
                      }
                    >
                      {GUARDIAN_RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {GUARDIAN_RELATION_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Alternate phone
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianAlternatePhone}
                      onChange={(e) => setGuardianAlternatePhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Address
                    </label>
                    <input
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={guardianAddress}
                      onChange={(e) => setGuardianAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {role === "TEACHER" && (
            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value as Department | "")
                  }
                  required
                >
                  <option value="" disabled>
                    Select a department
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {DEPARTMENT_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Gender
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={teacherGender}
                  onChange={(e) => setTeacherGender(e.target.value as Gender)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Employment Status
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={employmentStatus}
                  onChange={(e) =>
                    setEmploymentStatus(e.target.value as EmploymentStatus | "")
                  }
                >
                  <option value="">—</option>
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {EMPLOYMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Contract Type
                </label>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={contractType}
                  onChange={(e) =>
                    setContractType(e.target.value as ContractType | "")
                  }
                >
                  <option value="">—</option>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {CONTRACT_TYPE_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  SSNIT Number
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={ssnitNumber}
                  onChange={(e) => setSsnitNumber(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Qualification
                </label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  placeholder="e.g. B.Ed Mathematics"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : "Something went wrong."}
            </p>
          )}
          {mutation.isSuccess && mutation.data && (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <p className="font-medium">Enrolled successfully.</p>
              {mutation.data.admissionNumber && (
                <p>
                  Admission number:{" "}
                  <span className="font-semibold">
                    {mutation.data.admissionNumber}
                  </span>
                </p>
              )}
              {mutation.data.employeeId && (
                <p>
                  Employee ID:{" "}
                  <span className="font-semibold">
                    {mutation.data.employeeId}
                  </span>
                </p>
              )}
              {mutation.data.generatedPassword && (
                <p>
                  Login:{" "}
                  <span className="font-semibold">
                    {mutation.data.username}
                  </span>{" "}
                  / password:{" "}
                  <span className="font-semibold">
                    {mutation.data.generatedPassword}
                  </span>{" "}
                  — share this once and have them change it after logging in.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || studentBlocked}
            className="w-32 rounded bg-brand py-2 font-medium text-white hover:bg-brand-light disabled:opacity-50"
          >
            {mutation.isPending
              ? "Enrolling…"
              : studentBlocked
                ? "Create a class first"
                : "Enroll"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

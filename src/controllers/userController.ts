import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { createUserAccount } from '../services/userService';
import { ContractType, Department, EmploymentStatus, GuardianRelation, Role } from '../generated/prisma/client';
import { normalizeGhanaPhone } from '../utils/phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
  const { role } = req.query;
  const roles = role
    ? String(role)
        .split(',')
        .filter((r): r is Role => Object.values(Role).includes(r as Role))
    : undefined;

  const users = await prisma.user.findMany({
    where: roles ? { role: { in: roles } } : undefined,
    select: { id: true, username: true, firstName: true, lastName: true, role: true },
    orderBy: { firstName: 'asc' },
  });

  return res.status(200).json(users);
};

export const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password, firstName, otherName, lastName, role, profileData } = req.body;

  if (!firstName || !lastName || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  // Admin accounts are provisioned once, at initial setup (via the seed
  // script), not through the running app — this endpoint only creates
  // TEACHER/STUDENT accounts from here on.
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: "Admin accounts can only be created during initial setup." });
  }

  // STUDENT/TEACHER — the only roles this endpoint can create — always get
  // auto-generated credentials rather than a chosen username/password.
  if (role !== 'STUDENT' && role !== 'TEACHER') {
    return res.status(400).json({ error: "Invalid role." });
  }

  if (role === 'STUDENT' && !profileData?.classId) {
    return res.status(400).json({ error: "A class must be selected to enroll a student." });
  }

  if (role === 'TEACHER' && !profileData?.phone) {
    return res.status(400).json({ error: "A phone number is required to add a teacher." });
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const normalizedPhone = role === 'TEACHER' && profileData?.phone ? normalizeGhanaPhone(profileData.phone) : undefined;
  if (role === 'TEACHER' && profileData?.phone && !normalizedPhone) {
    return res.status(400).json({ error: "Invalid phone number. Use a 10-digit Ghanaian number, e.g. 0501234567." });
  }

  const normalizedGuardianPhone =
    role === 'STUDENT' && profileData?.guardianPhone ? normalizeGhanaPhone(profileData.guardianPhone) : undefined;
  if (role === 'STUDENT' && profileData?.guardianPhone && !normalizedGuardianPhone) {
    return res.status(400).json({ error: "Invalid guardian phone number. Use a 10-digit Ghanaian number, e.g. 0501234567." });
  }

  const normalizedGuardianAltPhone =
    role === 'STUDENT' && profileData?.guardianAlternatePhone
      ? normalizeGhanaPhone(profileData.guardianAlternatePhone)
      : undefined;
  if (role === 'STUDENT' && profileData?.guardianAlternatePhone && !normalizedGuardianAltPhone) {
    return res
      .status(400)
      .json({ error: "Invalid guardian alternate phone number. Use a 10-digit Ghanaian number, e.g. 0501234567." });
  }

  if (role === 'TEACHER' && !profileData?.department) {
    return res.status(400).json({ error: "A department is required to add a teacher." });
  }

  if (role === 'TEACHER' && profileData?.department && !Object.values(Department).includes(profileData.department)) {
    return res.status(400).json({ error: "Invalid department." });
  }

  if (
    role === 'TEACHER' &&
    profileData?.employmentStatus &&
    !Object.values(EmploymentStatus).includes(profileData.employmentStatus)
  ) {
    return res.status(400).json({ error: "Invalid employment status." });
  }

  if (
    role === 'TEACHER' &&
    profileData?.contractType &&
    !Object.values(ContractType).includes(profileData.contractType)
  ) {
    return res.status(400).json({ error: "Invalid contract type." });
  }

  if (
    role === 'STUDENT' &&
    profileData?.guardianRelation &&
    !Object.values(GuardianRelation).includes(profileData.guardianRelation)
  ) {
    return res.status(400).json({ error: "Invalid guardian relationship." });
  }

  if (
    role === 'STUDENT' &&
    profileData?.openingBalance !== undefined &&
    (!Number.isFinite(Number(profileData.openingBalance)) || Number(profileData.openingBalance) < 0)
  ) {
    return res.status(400).json({ error: "openingBalance must be a non-negative number." });
  }

  try {
    const { user, admissionNumber, employeeId, generatedPassword } = await createUserAccount({
      username,
      email,
      password,
      firstName,
      otherName,
      lastName,
      role,
      profileData: profileData
        ? {
            ...profileData,
            ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            ...(normalizedGuardianPhone ? { guardianPhone: normalizedGuardianPhone } : {}),
            ...(normalizedGuardianAltPhone ? { guardianAlternatePhone: normalizedGuardianAltPhone } : {}),
          }
        : profileData,
    });

    return res.status(201).json({
      message: `${role} account created successfully!`,
      userId: user.id,
      username: user.username,
      ...(admissionNumber ? { admissionNumber } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(generatedPassword ? { generatedPassword } : {}),
    });

  } catch (error: any) {
    console.error("User Creation Error:", error);
    if (error.code === 'P2002') {
      if (String(error.meta?.target).includes('users_single_super_admin')) {
        return res.status(400).json({ error: "A Super Admin account already exists. Only one is allowed." });
      }
      return res.status(400).json({ error: "An account with this identifier already exists." });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: "The selected class does not exist." });
    }
    return res.status(500).json({ error: "Internal server error during user creation." });
  }
};

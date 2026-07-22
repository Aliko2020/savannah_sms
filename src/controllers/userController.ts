import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { createUserAccount } from '../services/userService';
import { ContractType, Department, EmploymentStatus, GuardianRelation, Role } from '../generated/prisma/client';

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

  // Admins can enroll teachers/students but cannot create other admin-level
  // accounts — only a Super Admin can create an Admin (or, once, itself).
  if (req.user?.role === 'ADMIN' && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
    return res.status(403).json({ error: "Admins cannot create Admin or Super Admin accounts." });
  }

  if (role === 'SUPER_ADMIN') {
    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existingSuperAdmin) {
      return res.status(400).json({ error: "A Super Admin account already exists. Only one is allowed." });
    }
  }

  // STUDENT/TEACHER get an auto-generated username + password; ADMIN/SUPER_ADMIN
  // still choose their own since those are typically set up deliberately, not in bulk.
  const autoGenerateCredentials = role === 'STUDENT' || role === 'TEACHER';
  if (!autoGenerateCredentials && (!username || !password)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (role === 'STUDENT' && !profileData?.classId) {
    return res.status(400).json({ error: "A class must be selected to enroll a student." });
  }

  if (role === 'TEACHER' && !profileData?.phone) {
    return res.status(400).json({ error: "A phone number is required to add a teacher." });
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

  try {
    const { user, admissionNumber, employeeId, generatedPassword } = await createUserAccount({
      username,
      email,
      password,
      firstName,
      otherName,
      lastName,
      role,
      profileData,
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

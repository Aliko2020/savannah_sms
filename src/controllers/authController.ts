import { Request, Response } from 'express';
import { prisma } from '../config/db'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { usernameOrPhone, password } = req.body;

  if (!usernameOrPhone || !password) {
    return res.status(400).json({ error: "Please provide both credentials." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { usernameOrPhone },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact administration." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { 
        usernameOrPhone: user.usernameOrPhone, 
        role: user.role 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' } 
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        usernameOrPhone: user.usernameOrPhone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role 
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "An internal server error occurred during login." });
  }
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { 
    usernameOrPhone, 
    email, 
    password, 
    firstName, 
    lastName, 
    role,
    profileData 
  } = req.body;

  if (!usernameOrPhone || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: "Missing required registration fields." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      
      const newUser = await tx.user.create({
        data: {
          usernameOrPhone,
          email: email || null,
          password: hashedPassword,
          role,
          firstName,
          lastName,
        },
      });

      if (role === 'TEACHER' && profileData) {
        await tx.teacherProfile.create({
          data: {
            teacherPhone: newUser.usernameOrPhone,
            employeeId: profileData.employeeId,
            department: profileData.department,
          },
        });
      } 
      
      else if (role === 'STUDENT' && profileData) {
        await tx.studentProfile.create({
          data: {
            admissionNumber: newUser.usernameOrPhone,
            dateOfBirth: new Date(profileData.dateOfBirth),
            guardianName: profileData.guardianName,
            guardianPhone: profileData.guardianPhone,
          },
        });
      }

      return newUser;
    });

    return res.status(201).json({ 
      message: `${role} account registered successfully!`, 
      userId: result.usernameOrPhone 
    });

  } catch (error: any) {
    console.error("Registration Error:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "An account with this identifier already exists." });
    }
    return res.status(500).json({ error: "Internal server error during registration." });
  }
};
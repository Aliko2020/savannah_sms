import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Please provide both credentials." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
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
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    const previousLogin = user.lastLoginAt;
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: previousLogin
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "An internal server error occurred during login." });
  }
};

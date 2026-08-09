import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { requestOtp, verifyOtp } from '../services/otpService';
import { normalizeGhanaPhone } from '../utils/phone';

const LOGIN_OTP_PURPOSE = 'LOGIN';

function issueToken(user: { id: string; role: string }): string {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '2h' });
}

// Admin/Super Admin accounts log in with their phone number as their
// username, which doubles as where a two-factor code can be sent — proving
// whoever's completing the login actually has that phone, not just the
// password. Teacher/Student accounts don't have a phone-based username the
// same way, so they're unaffected and log in in one step as before.
//
// Toggleable via LOGIN_OTP_ENABLED so it can be switched off temporarily
// (e.g. during heavy manual testing) without ripping the feature out —
// default is enabled unless explicitly set to "false".
const LOGIN_OTP_ENABLED = process.env.LOGIN_OTP_ENABLED !== 'false';
const REQUIRES_OTP_ROLES = ['ADMIN', 'SUPER_ADMIN'];

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

    if (LOGIN_OTP_ENABLED && REQUIRES_OTP_ROLES.includes(user.role)) {
      const phone = normalizeGhanaPhone(user.username);
      if (!phone) {
        return res.status(500).json({ error: 'No valid phone number is on file for this account.' });
      }

      const result = await requestOtp(user.id, LOGIN_OTP_PURPOSE, phone);
      if (!result.sent) {
        return res.status(502).json({ error: result.error ?? 'Could not send verification code.' });
      }

      return res.status(200).json({
        requiresOtp: true,
        username: user.username,
        message: 'A verification code has been sent to your phone.',
      });
    }

    const token = issueToken(user);
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

// Completes the two-step login for Admin/Super Admin: the password was
// already checked in login() above, which is what triggered this code being
// sent in the first place — this step only needs to confirm the code.
export const verifyLoginOtp = async (req: Request, res: Response): Promise<Response> => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).json({ error: 'username and code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await verifyOtp(user.id, LOGIN_OTP_PURPOSE, String(code));
    if (!valid) {
      return res.status(401).json({ error: 'Invalid or expired verification code.' });
    }

    const token = issueToken(user);
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
    console.error("Verify Login OTP Error:", error);
    return res.status(500).json({ error: "An internal server error occurred during verification." });
  }
};

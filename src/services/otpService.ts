import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { sendSms } from './smsService';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;

function generateCode(): string {
  // crypto.randomInt avoids the slight modulo bias of Math.random, and is
  // rejection-sampled internally so every 6-digit code is equally likely.
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

export interface RequestOtpResult {
  sent: boolean;
  error?: string;
}

// Generates a fresh code for (userId, purpose), invalidating any prior
// unconsumed one for that same purpose so only the most recently requested
// code is ever valid — a stale code left over from an earlier attempt can't
// be reused once a new one's been sent.
export async function requestOtp(userId: string, purpose: string, phone: string): Promise<RequestOtpResult> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpCode.create({ data: { userId, purpose, codeHash, expiresAt } }),
  ]);

  const result = await sendSms(phone, `Your Waller Academy verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. Do not share this code.`);
  return result;
}

// Single-use: a valid match immediately consumes the code so it can never
// be replayed, whether by re-submitting the same form or by anyone who saw
// the SMS after it was already used once.
export async function verifyOtp(userId: string, purpose: string, code: string): Promise<boolean> {
  const candidate = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!candidate) return false;

  const matches = await bcrypt.compare(code, candidate.codeHash);
  if (!matches) return false;

  await prisma.otpCode.update({ where: { id: candidate.id }, data: { consumedAt: new Date() } });
  return true;
}

// Accepts common local Ghanaian formats ("050 123 4567", "050-123-4567") and
// the 233 international prefix; returns the canonical 0XXXXXXXXX form, or
// null if it isn't a valid 10-digit Ghana mobile number (all current mobile
// network prefixes start 02_ or 05_, so checking the second digit is 2-5
// covers them without hard-coding a specific, ever-changing prefix list).
export function normalizeGhanaPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('233') ? `0${digits.slice(3)}` : digits;
  return /^0[2-5]\d{8}$/.test(local) ? local : null;
}

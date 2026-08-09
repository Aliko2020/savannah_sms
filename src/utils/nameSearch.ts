import { Prisma } from '../generated/prisma/client';

// Splits "Mike Adongo" into ["Mike", "Adongo"] and requires every word to
// match at least one name field — so full-name searches work, not just
// matches against a single field. Returns {} (no filtering) for an empty query.
export function buildNameSearchWhere(search: unknown): Prisma.UserWhereInput {
  const words = search
    ? String(search)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    : [];

  if (words.length === 0) return {};

  return {
    AND: words.map((word) => ({
      OR: [
        { firstName: { contains: word, mode: 'insensitive' as const } },
        { lastName: { contains: word, mode: 'insensitive' as const } },
        { otherName: { contains: word, mode: 'insensitive' as const } },
      ],
    })),
  };
}

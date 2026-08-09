import { ClassCategory, PrismaClient } from '../generated/prisma/client';

interface StandardSubject {
  name: string;
  code: string;
  categories: ClassCategory[];
}

// NaCCA / GES Standards-Based Curriculum subjects for Basic School
// (Creche–JHS 3). Category granularity matches the system's three tiers —
// where NaCCA distinguishes lower/upper Primary (e.g. Science vs History),
// this list keeps them as separate subjects rather than forcing one name
// across the whole Primary tier.
export const STANDARD_SUBJECTS: StandardSubject[] = [
  { name: 'Language and Literacy', code: 'LANGLIT', categories: ['PRE_SCHOOL'] },
  { name: 'Numeracy', code: 'NUM', categories: ['PRE_SCHOOL'] },
  { name: 'Physical Development', code: 'PHYSDEV', categories: ['PRE_SCHOOL'] },
  { name: 'Our World, Our People', code: 'OWOP', categories: ['PRE_SCHOOL', 'PRIMARY'] },
  { name: 'English Language', code: 'ENG', categories: ['PRIMARY', 'JHS'] },
  { name: 'Mathematics', code: 'MATH', categories: ['PRIMARY', 'JHS'] },
  { name: 'Science', code: 'SCI', categories: ['PRIMARY'] },
  { name: 'Integrated Science', code: 'INTSCI', categories: ['JHS'] },
  { name: 'History', code: 'HIST', categories: ['PRIMARY'] },
  { name: 'Social Studies', code: 'SOC', categories: ['JHS'] },
  { name: 'Religious and Moral Education', code: 'RME', categories: ['PRIMARY', 'JHS'] },
  { name: 'Creative Arts and Design', code: 'CAD', categories: ['PRE_SCHOOL', 'PRIMARY', 'JHS'] },
  { name: 'Ghanaian Language and Culture', code: 'GHLANG', categories: ['PRIMARY', 'JHS'] },
  { name: 'Computing', code: 'COMP', categories: ['PRIMARY', 'JHS'] },
  { name: 'Career Technology', code: 'CARTECH', categories: ['JHS'] },
  { name: 'French', code: 'FRENCH', categories: ['PRIMARY', 'JHS'] },
];

// Additive only: creates whichever standard subjects don't already exist
// (matched by code) and leaves everything else — including admin edits to
// existing standard subjects — untouched. Safe to call more than once.
export async function ensureStandardSubjects(client: PrismaClient): Promise<number> {
  const result = await client.subject.createMany({
    data: STANDARD_SUBJECTS,
    skipDuplicates: true,
  });
  return result.count;
}

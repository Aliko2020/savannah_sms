-- CreateEnum
CREATE TYPE "Department" AS ENUM ('PRE_SCHOOL', 'PRIMARY', 'JHS', 'ICT', 'NON_TEACHING');

-- AlterTable
-- Converts the free-text department column to the new enum. Existing values
-- that don't match the new controlled vocabulary (e.g. "Science", "Math",
-- "Art") become NULL rather than blocking the migration or being guessed at.
ALTER TABLE "teacher_profiles"
  ALTER COLUMN "department" TYPE "Department"
  USING (
    CASE "department"
      WHEN 'Pre-School' THEN 'PRE_SCHOOL'
      WHEN 'Primary' THEN 'PRIMARY'
      WHEN 'Junior High School' THEN 'JHS'
      WHEN 'ICT' THEN 'ICT'
      WHEN 'Non Teaching' THEN 'NON_TEACHING'
      ELSE NULL
    END::"Department"
  );

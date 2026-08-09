-- Fee bug fix: a mid-year admission was being billed the full annual fee
-- and flagged as a defaulter for terms that predate their enrollment.
-- Adds the enrolment term/date used to prorate a student's expected fee,
-- and an admin-only opening balance override for pre-existing debt (e.g.
-- a transferred student).

ALTER TABLE "student_profiles" ADD COLUMN "enrolmentTermId" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "enrolmentDate" DATE;
ALTER TABLE "student_profiles" ADD COLUMN "openingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "student_profiles"
  ADD CONSTRAINT "student_profiles_enrolmentTermId_fkey"
  FOREIGN KEY ("enrolmentTermId") REFERENCES "terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill enrolmentDate (informational) from each student's earliest
-- enrollment record. enrolmentTermId is deliberately left NULL for every
-- pre-existing student: without it, the app bills them in full (fraction of
-- 1), which is exactly their current behavior — nothing changes retroactively
-- for students who were already being billed correctly. Only new
-- registrations from here on get a real enrolmentTermId set at creation.
UPDATE "student_profiles" sp
SET "enrolmentDate" = sub.earliest
FROM (
  SELECT "studentId", MIN("enrolledAt") AS earliest
  FROM "enrollments"
  GROUP BY "studentId"
) sub
WHERE sp.id = sub."studentId";

-- A teacher can now be the form teacher of at most one class PER ACADEMIC
-- YEAR, not one class ever — the prior global-unique constraint meant a
-- teacher who was a form teacher last year could never be reassigned once
-- that academic year ended and its classes stuck around as history.
ALTER TABLE "classes" DROP CONSTRAINT "classes_formTeacherId_key";

-- CreateIndex
CREATE UNIQUE INDEX "classes_formTeacherId_academicYearId_key" ON "classes"("formTeacherId", "academicYearId");

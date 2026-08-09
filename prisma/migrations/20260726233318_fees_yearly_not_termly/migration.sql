-- Fees move from per-term to per-academic-year: FeeStructure and Payment
-- both switch from termId to academicYearId, backfilled via each row's
-- existing term's academicYearId (every Term belongs to exactly one year).

-- fee_structures: add + backfill academicYearId
ALTER TABLE "fee_structures" ADD COLUMN "academicYearId" TEXT;

UPDATE "fee_structures" fs
SET "academicYearId" = t."academicYearId"
FROM "terms" t
WHERE t.id = fs."termId";

-- Defensive de-dup: if a school had already configured different amounts
-- per term for the same category within one academic year, keep only the
-- most recently updated row per (category, academicYearId) so the new
-- unique constraint below doesn't fail. Not expected to affect any real row
-- given fee amounts are currently only ever set on one term per year.
DELETE FROM "fee_structures" fs
USING "fee_structures" newer
WHERE fs."category" = newer."category"
  AND fs."academicYearId" = newer."academicYearId"
  AND fs."updatedAt" < newer."updatedAt";

ALTER TABLE "fee_structures" ALTER COLUMN "academicYearId" SET NOT NULL;

ALTER TABLE "fee_structures" DROP CONSTRAINT "fee_structures_termId_fkey";
DROP INDEX "fee_structures_category_termId_key";
ALTER TABLE "fee_structures" DROP COLUMN "termId";

CREATE UNIQUE INDEX "fee_structures_category_academicYearId_key" ON "fee_structures"("category", "academicYearId");
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- payments: add + backfill academicYearId
ALTER TABLE "payments" ADD COLUMN "academicYearId" TEXT;

UPDATE "payments" p
SET "academicYearId" = t."academicYearId"
FROM "terms" t
WHERE t.id = p."termId";

ALTER TABLE "payments" ALTER COLUMN "academicYearId" SET NOT NULL;

ALTER TABLE "payments" DROP CONSTRAINT "payments_termId_fkey";
ALTER TABLE "payments" DROP COLUMN "termId";

ALTER TABLE "payments" ADD CONSTRAINT "payments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

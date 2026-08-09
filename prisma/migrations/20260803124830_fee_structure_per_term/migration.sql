-- Fees switch from per-academic-year back to per-term: billing is now
-- termly, so a fee amount is configured per (category, term) rather than
-- per (category, year). Existing per-year amounts can't be sensibly split
-- across terms automatically, so they're cleared here — the admin
-- reconfigures fresh per-term amounts via Fee Setup. Payment stays
-- academicYearId-scoped (a running ledger against the cumulative bill), so
-- existing payment history is untouched.

DELETE FROM "fee_structures";

DROP INDEX "fee_structures_category_academicYearId_key";
ALTER TABLE "fee_structures" DROP CONSTRAINT "fee_structures_academicYearId_fkey";
ALTER TABLE "fee_structures" DROP COLUMN "academicYearId";

ALTER TABLE "fee_structures" ADD COLUMN "termId" TEXT NOT NULL;
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "fee_structures_category_termId_key" ON "fee_structures"("category", "termId");

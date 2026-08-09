-- Promotion Module refactor: decouple Grade Levels from Class sections and
-- replace the old 1:1 Class.nextClassId mapping with a proper GradeLevel
-- progression + PromotionRule/PromotionRun/PromotionResult pipeline.

-- ---------------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------------
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'EXECUTED');
CREATE TYPE "PromotionDecision" AS ENUM ('PROMOTED', 'PROBATION', 'REPEATED', 'GRADUATED');
CREATE TYPE "SectionStrategy" AS ENUM ('MAINTAIN_STREAM', 'AUTO_DISTRIBUTE', 'UNASSIGNED_POOL');

-- ---------------------------------------------------------------------------
-- 2. grade_levels table
-- ---------------------------------------------------------------------------
CREATE TABLE "grade_levels" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "category" "ClassCategory" NOT NULL,
    "order" INTEGER NOT NULL,
    "promotesToId" TEXT,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grade_levels_name_key" ON "grade_levels"("name");
CREATE UNIQUE INDEX "grade_levels_order_key" ON "grade_levels"("order");

ALTER TABLE "grade_levels"
    ADD CONSTRAINT "grade_levels_promotesToId_fkey"
    FOREIGN KEY ("promotesToId") REFERENCES "grade_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one GradeLevel per distinct existing class name (two "Grade Two"
-- rows in different academic years collapse into a single grade level, which
-- is the intended behavior). Ordered by category tier then name so
-- progression numbering is sane by default; admins can still edit later.
INSERT INTO "grade_levels" ("id", "name", "category", "order")
SELECT
    gen_random_uuid()::text,
    ranked.name,
    ranked.category,
    ranked.rn
FROM (
    SELECT DISTINCT ON (c.name)
        c.name,
        c.category,
        ROW_NUMBER() OVER (
            ORDER BY
                CASE c.category WHEN 'PRE_SCHOOL' THEN 0 WHEN 'PRIMARY' THEN 1 WHEN 'JHS' THEN 2 END,
                c.name
        ) AS rn
    FROM "classes" c
) ranked;

-- ---------------------------------------------------------------------------
-- 3. classes.gradeLevelId (nullable -> backfilled -> NOT NULL -> FK)
-- ---------------------------------------------------------------------------
ALTER TABLE "classes" ADD COLUMN "gradeLevelId" TEXT;

UPDATE "classes" c
SET "gradeLevelId" = gl."id"
FROM "grade_levels" gl
WHERE gl."name" = c."name";

ALTER TABLE "classes" ALTER COLUMN "gradeLevelId" SET NOT NULL;

ALTER TABLE "classes"
    ADD CONSTRAINT "classes_gradeLevelId_fkey"
    FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Port the old per-class nextClassId mapping onto the new grade-level
-- progression: if any class of grade level A pointed at a class of grade
-- level B, A now promotes to B.
UPDATE "grade_levels" src
SET "promotesToId" = (
    SELECT DISTINCT nc."gradeLevelId"
    FROM "classes" c
    JOIN "classes" nc ON nc."id" = c."nextClassId"
    WHERE c."gradeLevelId" = src."id"
      AND c."nextClassId" IS NOT NULL
    LIMIT 1
)
WHERE src."promotesToId" IS NULL;

-- ---------------------------------------------------------------------------
-- 4. Drop the old self-referencing mapping on classes
-- ---------------------------------------------------------------------------
ALTER TABLE "classes" DROP CONSTRAINT "classes_nextClassId_fkey";
ALTER TABLE "classes" DROP COLUMN "nextClassId";

-- ---------------------------------------------------------------------------
-- 5. promotion_rules
-- ---------------------------------------------------------------------------
CREATE TABLE "promotion_rules" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "gradeLevelId" TEXT,
    "promoteMinAverage" DECIMAL(5,2) NOT NULL,
    "probationMinAverage" DECIMAL(5,2) NOT NULL,
    "probationPromotes" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_rules_gradeLevelId_key" ON "promotion_rules"("gradeLevelId");

ALTER TABLE "promotion_rules"
    ADD CONSTRAINT "promotion_rules_gradeLevelId_fkey"
    FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. promotion_runs
-- ---------------------------------------------------------------------------
CREATE TABLE "promotion_runs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "fromAcademicYearId" TEXT NOT NULL,
    "toAcademicYearId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "sectionStrategy" "SectionStrategy",
    "createdById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_runs_fromAcademicYearId_toAcademicYearId_key" ON "promotion_runs"("fromAcademicYearId", "toAcademicYearId");

ALTER TABLE "promotion_runs"
    ADD CONSTRAINT "promotion_runs_fromAcademicYearId_fkey"
    FOREIGN KEY ("fromAcademicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_runs"
    ADD CONSTRAINT "promotion_runs_toAcademicYearId_fkey"
    FOREIGN KEY ("toAcademicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_runs"
    ADD CONSTRAINT "promotion_runs_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. promotion_results
-- ---------------------------------------------------------------------------
CREATE TABLE "promotion_results" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "promotionRunId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClassId" TEXT NOT NULL,
    "cumulativeAverage" DECIMAL(5,2) NOT NULL,
    "decision" "PromotionDecision" NOT NULL,
    "decisionOverridden" BOOLEAN NOT NULL DEFAULT false,
    "targetGradeLevelId" TEXT,
    "toClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_results_promotionRunId_studentId_key" ON "promotion_results"("promotionRunId", "studentId");

ALTER TABLE "promotion_results"
    ADD CONSTRAINT "promotion_results_promotionRunId_fkey"
    FOREIGN KEY ("promotionRunId") REFERENCES "promotion_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_results"
    ADD CONSTRAINT "promotion_results_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_results"
    ADD CONSTRAINT "promotion_results_fromClassId_fkey"
    FOREIGN KEY ("fromClassId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_results"
    ADD CONSTRAINT "promotion_results_toClassId_fkey"
    FOREIGN KEY ("toClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

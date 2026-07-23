-- A subject can now belong to multiple class categories.
ALTER TABLE "subjects" ADD COLUMN "categories" "ClassCategory"[] NOT NULL DEFAULT ARRAY[]::"ClassCategory"[];

-- Preserve existing single-category data as a one-element array.
UPDATE "subjects" SET "categories" = ARRAY["category"];

ALTER TABLE "subjects" DROP COLUMN "category";

-- Promotion setup: each class can point at the class its students promote
-- into (normally in the following academic year). Self-referencing FK on
-- Class, nullable — null means "not mapped yet" or "students graduate here".

ALTER TABLE "classes" ADD COLUMN "nextClassId" TEXT;

ALTER TABLE "classes" ADD CONSTRAINT "classes_nextClassId_fkey" FOREIGN KEY ("nextClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

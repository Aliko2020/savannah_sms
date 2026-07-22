-- CreateEnum
CREATE TYPE "ClassCategory" AS ENUM ('PRE_SCHOOL', 'PRIMARY', 'JHS');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "category" "ClassCategory" NOT NULL DEFAULT 'PRIMARY';

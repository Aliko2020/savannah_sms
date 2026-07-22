-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('FULL_TIME', 'PART_TIME', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PERMANENT', 'FIXED_TERM', 'TEMPORARY');

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "contractType" "ContractType",
ADD COLUMN     "employmentStatus" "EmploymentStatus";

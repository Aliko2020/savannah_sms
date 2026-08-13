-- AlterTable: student_profiles
ALTER TABLE "student_profiles" ADD COLUMN "previousSchool" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "reasonForLeaving" TEXT;
ALTER TABLE "student_profiles" ADD COLUMN "medicalCondition" TEXT;

-- AlterTable: guardians
ALTER TABLE "guardians" ADD COLUMN "occupation" TEXT;

-- AlterTable: teacher_profiles
ALTER TABLE "teacher_profiles" ADD COLUMN "religion" TEXT;
ALTER TABLE "teacher_profiles" ADD COLUMN "isLicensed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "teacher_profiles" ADD COLUMN "licenseNumber" TEXT;

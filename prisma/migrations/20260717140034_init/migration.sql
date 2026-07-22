/*
  Warnings:

  - You are about to drop the column `teacherId` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `finalExamGrade` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `midtermGrade` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `overallGrade` on the `enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `guardianName` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `guardianPhone` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `teacherPhone` on the `teacher_profiles` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `usernameOrPhone` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,date]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `student_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `teacher_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `termId` to the `attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicYearId` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `student_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `teacher_profiles` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_classId_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_classId_fkey";

-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_admissionNumber_fkey";

-- DropForeignKey
ALTER TABLE "teacher_profiles" DROP CONSTRAINT "teacher_profiles_teacherPhone_fkey";

-- DropIndex
DROP INDEX "attendance_studentId_classId_date_key";

-- DropIndex
DROP INDEX "teacher_profiles_teacherPhone_key";

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "termId" TEXT NOT NULL,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "teacherId",
ADD COLUMN     "academicYearId" TEXT NOT NULL,
ADD COLUMN     "formTeacherId" TEXT;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "finalExamGrade",
DROP COLUMN "midtermGrade",
DROP COLUMN "overallGrade",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "guardianName",
DROP COLUMN "guardianPhone",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "dateOfBirth" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "teacher_profiles" DROP COLUMN "teacherPhone",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "usernameOrPhone",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relation" "GuardianRelation" NOT NULL DEFAULT 'GUARDIAN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("studentId","guardianId")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classScore" DECIMAL(5,2),
    "examScore" DECIMAL(5,2),
    "total" DECIMAL(5,2),
    "grade" TEXT,
    "remark" TEXT,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "terms_academicYearId_name_key" ON "terms"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "scores_studentId_classSubjectId_termId_key" ON "scores"("studentId", "classSubjectId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_studentId_date_key" ON "attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_formTeacherId_fkey" FOREIGN KEY ("formTeacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

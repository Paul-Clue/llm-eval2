/*
  Warnings:

  - You are about to drop the column `createdAt` on the `evaluation_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `evaluation_metrics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "evaluation_metrics" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

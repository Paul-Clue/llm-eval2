/*
  Warnings:

  - Added the required column `user_id` to the `evaluation_metrics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "evaluation_metrics" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "evaluation_metrics_user_id_idx" ON "evaluation_metrics"("user_id");

-- AddForeignKey
ALTER TABLE "evaluation_metrics" ADD CONSTRAINT "evaluation_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

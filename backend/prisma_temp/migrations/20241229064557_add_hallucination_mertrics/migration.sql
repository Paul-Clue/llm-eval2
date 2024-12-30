-- AlterTable
ALTER TABLE "evaluation_metrics" ADD COLUMN     "hallucination_feedback" TEXT,
ADD COLUMN     "hallucination_score" DOUBLE PRECISION;

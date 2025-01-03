-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_metrics" (
    "id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT,
    "model_type" TEXT NOT NULL,
    "model_provider" TEXT NOT NULL,
    "model_config" TEXT,
    "system_prompt" TEXT NOT NULL,
    "user_prompt" TEXT NOT NULL,
    "expected_output" TEXT,
    "relevance_score" DOUBLE PRECISION,
    "accuracy_score" DOUBLE PRECISION,
    "clarity_score" DOUBLE PRECISION,
    "coherence_score" DOUBLE PRECISION,
    "creativity_score" DOUBLE PRECISION,
    "alignment_score" DOUBLE PRECISION,
    "response" TEXT,
    "evaluation" TEXT,
    "evaluation_score" DOUBLE PRECISION,
    "evaluation_feedback" TEXT,
    "hallucination_score" DOUBLE PRECISION,
    "hallucination_feedback" TEXT,
    "test_type" TEXT,

    CONSTRAINT "evaluation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

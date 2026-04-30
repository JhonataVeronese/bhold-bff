ALTER TABLE "GrupoPlanoConta"
ADD COLUMN "systemDefault" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PlanoConta"
ADD COLUMN "systemDefault" BOOLEAN NOT NULL DEFAULT false;

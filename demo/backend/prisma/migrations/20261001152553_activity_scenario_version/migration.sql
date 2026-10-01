/*
  Warnings:

  - Added the required column `scenarioVersionId` to the `ActivitySession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivitySession" ADD COLUMN     "scenarioVersionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_scenarioVersionId_fkey" FOREIGN KEY ("scenarioVersionId") REFERENCES "ScenarioVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `UserBroker` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserBroker" DROP CONSTRAINT "UserBroker_brokerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserBroker" DROP CONSTRAINT "UserBroker_userId_fkey";

-- DropTable
DROP TABLE "public"."UserBroker";

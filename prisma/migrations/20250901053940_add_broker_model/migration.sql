-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "brokerId" TEXT,
ALTER COLUMN "brokerageFirm" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Broker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Broker_name_key" ON "public"."Broker"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_code_key" ON "public"."Broker"("code");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

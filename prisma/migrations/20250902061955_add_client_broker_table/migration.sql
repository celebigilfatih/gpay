-- CreateTable
CREATE TABLE "public"."ClientBroker" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientBroker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientBroker_clientId_brokerId_key" ON "public"."ClientBroker"("clientId", "brokerId");

-- AddForeignKey
ALTER TABLE "public"."ClientBroker" ADD CONSTRAINT "ClientBroker_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientBroker" ADD CONSTRAINT "ClientBroker_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

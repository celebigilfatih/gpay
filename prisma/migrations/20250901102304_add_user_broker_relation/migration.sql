-- CreateTable
CREATE TABLE "public"."UserBroker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,

    CONSTRAINT "UserBroker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBroker_userId_brokerId_key" ON "public"."UserBroker"("userId", "brokerId");

-- AddForeignKey
ALTER TABLE "public"."UserBroker" ADD CONSTRAINT "UserBroker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBroker" ADD CONSTRAINT "UserBroker_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

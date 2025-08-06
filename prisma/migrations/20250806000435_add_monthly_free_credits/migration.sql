-- AlterEnum
ALTER TYPE "public"."CreditTransactionType" ADD VALUE 'MONTHLY_FREE';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "lastFreeCreditsDate" TIMESTAMP(3);

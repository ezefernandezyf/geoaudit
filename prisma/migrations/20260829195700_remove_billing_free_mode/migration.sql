-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropTable
DROP TABLE "StripeWebhookEvent";

-- DropTable
DROP TABLE "Subscription";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tier";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "Tier";
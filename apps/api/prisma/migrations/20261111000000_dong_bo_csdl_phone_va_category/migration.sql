-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'BARISTA', 'CASHIER', 'MANAGER');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Insert default categories
INSERT INTO "Category" ("id", "name") VALUES (1, 'Cà phê') ON CONFLICT ("id") DO NOTHING;

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "categoryId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey Product -> Category
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey from Order to User
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Order_userId_idempotencyKey_key";
DROP INDEX IF EXISTS "Order_userId_idx";

-- AlterTable User: change id to phone, add role, drop email unique
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
UPDATE "User" SET "phone" = '0900000000' WHERE "phone" IS NULL;
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("phone");
ALTER TABLE "User" DROP COLUMN IF EXISTS "id";
DROP INDEX IF EXISTS "User_email_key";
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable Order: add userPhone, drop userId
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userPhone" TEXT NOT NULL DEFAULT '0900000000';
ALTER TABLE "Order" DROP COLUMN IF EXISTS "userId";

-- CreateIndex Order
CREATE INDEX "Order_userPhone_idx" ON "Order"("userPhone");
CREATE UNIQUE INDEX "Order_userPhone_idempotencyKey_key" ON "Order"("userPhone", "idempotencyKey");

-- AddForeignKey Order -> User
ALTER TABLE "Order" ADD CONSTRAINT "Order_userPhone_fkey" FOREIGN KEY ("userPhone") REFERENCES "User"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;

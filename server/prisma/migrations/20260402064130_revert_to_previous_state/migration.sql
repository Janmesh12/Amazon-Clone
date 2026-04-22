/*
  Warnings:

  - You are about to drop the column `addressId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `seller_id` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isBanned` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropIndex
DROP INDEX "OrderItem_seller_id_idx";

-- DropIndex
DROP INDEX "Product_category_idx";

-- DropIndex
DROP INDEX "Product_sellerId_idx";

-- DropIndex
DROP INDEX "Product_status_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "addressId",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Confirmed';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "seller_id";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "status",
DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isBanned";

-- DropTable
DROP TABLE "Address";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ProductStatus";

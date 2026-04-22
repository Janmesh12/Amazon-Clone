/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `requestedRole` on the `AccessRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SELLER', 'USER');

-- AlterTable
ALTER TABLE "AccessRequest" DROP COLUMN "requestedRole",
ADD COLUMN     "requestedRole" "RoleType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleId" INTEGER,
DROP COLUMN "role",
ADD COLUMN     "role" "RoleType" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "DynamicRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSeller" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicRole_name_key" ON "DynamicRole"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "DynamicRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

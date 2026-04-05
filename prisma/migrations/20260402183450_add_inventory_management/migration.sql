-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('FURNITURE', 'ELECTRONICS', 'STATIONERY', 'EQUIPMENT', 'SUPPLIES', 'MAINTENANCE', 'UTILITY', 'RENT', 'MARKETING', 'TRAINING', 'TRANSPORT', 'SOFTWARE', 'LICENSES', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'BROKEN');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'LOST', 'DISPOSED');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'MAINTENANCE', 'DISPOSAL', 'RETURN', 'LOAN', 'USAGE');

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "InventoryCategory" NOT NULL,
    "subcategory" TEXT,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "condition" "InventoryCondition" NOT NULL DEFAULT 'NEW',
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "supplier" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "consultancyId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "reference" TEXT,
    "purpose" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_key" ON "inventory"("sku");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_consultancyId_fkey" FOREIGN KEY ("consultancyId") REFERENCES "consultancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

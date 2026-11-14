-- CreateTable
CREATE TABLE "StockUsage" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StockUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockUsage_orderId_ingredientId_key" ON "StockUsage"("orderId", "ingredientId");

-- AddForeignKey
ALTER TABLE "StockUsage" ADD CONSTRAINT "StockUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockUsage" ADD CONSTRAINT "StockUsage_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "StockUsage" ADD CONSTRAINT "StockUsage_quantity_check" CHECK ("quantity" > 0);

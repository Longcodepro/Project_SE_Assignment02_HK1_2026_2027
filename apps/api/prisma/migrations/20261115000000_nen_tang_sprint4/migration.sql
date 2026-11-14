-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('G', 'ML', 'PIECE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "Unit" NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdByPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "size" "Size" NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topping" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Topping_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "SizeSurcharge" (
    "size" "Size" NOT NULL,
    "extra" INTEGER NOT NULL,

    CONSTRAINT "SizeSurcharge_pkey" PRIMARY KEY ("size")
);

-- CreateTable
CREATE TABLE "ToppingRecipeItem" (
    "id" SERIAL NOT NULL,
    "toppingCode" TEXT NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ToppingRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "StockReceipt_ingredientId_idx" ON "StockReceipt"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_productId_size_ingredientId_key" ON "RecipeItem"("productId", "size", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ToppingRecipeItem_toppingCode_ingredientId_key" ON "ToppingRecipeItem"("toppingCode", "ingredientId");

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_createdByPhone_fkey" FOREIGN KEY ("createdByPhone") REFERENCES "User"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToppingRecipeItem" ADD CONSTRAINT "ToppingRecipeItem_toppingCode_fkey" FOREIGN KEY ("toppingCode") REFERENCES "Topping"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToppingRecipeItem" ADD CONSTRAINT "ToppingRecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Ràng buộc an toàn ở tầng CSDL: kho không âm, số lượng luôn dương
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_stock_check" CHECK ("stock" >= 0 AND "minStock" >= 0);
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "ToppingRecipeItem" ADD CONSTRAINT "ToppingRecipeItem_quantity_check" CHECK ("quantity" > 0);

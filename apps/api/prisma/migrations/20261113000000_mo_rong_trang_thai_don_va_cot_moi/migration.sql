-- Sprint 3 (S3.1): thêm trạng thái pha chế, nhận món, hoàn tất, hủy
-- và 3 cột cho phép rỗng nên các đơn hiện có không bị ảnh hưởng.

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE 'READY';
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "pickupCode" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

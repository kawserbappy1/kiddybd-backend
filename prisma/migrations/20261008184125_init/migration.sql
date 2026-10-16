-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SUPPORT', 'CONTENT_MANAGER', 'FINANCE_MANAGER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "AddressValidationStatus" AS ENUM ('VALID', 'NEEDS_REVIEW', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'RISK_REVIEW', 'VERIFICATION_REQUIRED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO');

-- CreateEnum
CREATE TYPE "OrderVerificationType" AS ENUM ('OTP', 'SMS_LINK', 'MANUAL_CALL', 'ADVANCE_PAYMENT');

-- CreateEnum
CREATE TYPE "OrderVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'REACHED_LOCAL_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED');

-- CreateEnum
CREATE TYPE "RTOReason" AS ENUM ('CUSTOMER_UNAVAILABLE', 'WRONG_ADDRESS', 'PHONE_UNREACHABLE', 'CUSTOMER_REFUSED', 'CUSTOMER_CANCELLED', 'COURIER_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'QUALITY_CHECK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('WRONG_PRODUCT', 'DAMAGED', 'DEFECTIVE', 'NOT_AS_EXPECTED', 'MISSING_PARTS', 'SIZE_ISSUE', 'CHANGE_OF_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE_DELIVERY');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'COMMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phoneVerifiedAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "googleLinkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReputation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
    "rtoOrders" INTEGER NOT NULL DEFAULT 0,
    "returnedOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliverySuccessRate" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "rtoRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cancelRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "returnRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),

    CONSTRAINT "CustomerReputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "upazila" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "landmark" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" "AddressValidationStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" UUID,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeGroup" (
    "id" UUID NOT NULL,
    "rangeLabel" TEXT NOT NULL,

    CONSTRAINT "AgeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "brandId" UUID,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "material" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "recommendedAge" TEXT NOT NULL,
    "smallPartsWarning" BOOLEAN NOT NULL DEFAULT false,
    "chokingHazard" BOOLEAN NOT NULL DEFAULT false,
    "supervisionRequired" BOOLEAN NOT NULL DEFAULT false,
    "materialSafety" TEXT,
    "safetyInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discountPrice" DECIMAL(10,2),
    "weight" DECIMAL(8,2) NOT NULL,
    "dimensions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAgeGroup" (
    "productId" UUID NOT NULL,
    "ageGroupId" UUID NOT NULL,

    CONSTRAINT "ProductAgeGroup_pkey" PRIMARY KEY ("productId","ageGroupId")
);

-- CreateTable
CREATE TABLE "ProductSkill" (
    "productId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "ProductSkill_pkey" PRIMARY KEY ("productId","skillId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "orderId" UUID,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" TEXT,
    "couponId" UUID,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryCharge" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingAddressSnapshot" JSONB NOT NULL,
    "billingAddressSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "variantTitleSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "RiskLevel" NOT NULL,
    "signals" JSONB NOT NULL,
    "reasons" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVerification" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "type" "OrderVerificationType" NOT NULL,
    "status" "OrderVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalTransactionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "rawReference" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Courier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "apiBaseUrl" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "courierId" UUID NOT NULL,
    "trackingId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "weight" DECIMAL(8,2) NOT NULL,
    "codAmount" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "externalStatus" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RTO" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "reason" "RTOReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RTO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "description" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" UUID NOT NULL,
    "returnId" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "ReturnReason" NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnEvidence" (
    "id" UUID NOT NULL,
    "returnId" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "returnId" UUID,
    "orderId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "transactionId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minimumOrderAmount" DECIMAL(10,2),
    "maximumDiscount" DECIMAL(10,2),
    "usageLimit" INTEGER,
    "perUserLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" UUID NOT NULL,
    "couponId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponProduct" (
    "couponId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("couponId","productId")
);

-- CreateTable
CREATE TABLE "CouponCategory" (
    "couponId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "CouponCategory_pkey" PRIMARY KEY ("couponId","categoryId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewMedia" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "userId" UUID,
    "endpoint" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" UUID NOT NULL,
    "wishlistId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CODConfig" (
    "id" UUID NOT NULL,
    "minimumOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maximumCODAmount" DECIMAL(10,2) NOT NULL,
    "riskThresholdLow" INTEGER NOT NULL DEFAULT 29,
    "riskThresholdMedium" INTEGER NOT NULL DEFAULT 69,
    "advancePaymentPercentage" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "codVerificationRequired" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CODConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReputation_userId_key" ON "CustomerReputation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_orderId_key" ON "RiskAssessment"("orderId");

-- CreateIndex
CREATE INDEX "RiskAssessment_orderId_idx" ON "RiskAssessment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "PaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_externalTransactionId_idx" ON "PaymentTransaction"("externalTransactionId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_externalEventId_provider_idx" ON "PaymentWebhookEvent"("externalEventId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Courier_code_key" ON "Courier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_trackingId_key" ON "Shipment"("trackingId");

-- CreateIndex
CREATE INDEX "Shipment_trackingId_idx" ON "Shipment"("trackingId");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_courierId_idx" ON "Shipment"("courierId");

-- CreateIndex
CREATE INDEX "Return_orderId_idx" ON "Return"("orderId");

-- CreateIndex
CREATE INDEX "Return_customerId_idx" ON "Return"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_userId_orderId_idx" ON "CouponUsage"("couponId", "userId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_orderId_key" ON "CouponUsage"("couponId", "orderId");

-- CreateIndex
CREATE INDEX "Review_productId_customerId_idx" ON "Review"("productId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_customerId_productId_orderId_key" ON "Review"("customerId", "productId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_key_userId_idx" ON "IdempotencyKey"("key", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_wishlistId_productId_idx" ON "WishlistItem"("wishlistId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_key" ON "WishlistItem"("wishlistId", "productId");

-- CreateIndex
CREATE INDEX "Notification_userId_type_status_idx" ON "Notification"("userId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_slug_key" ON "Promotion"("slug");

-- CreateIndex
CREATE INDEX "Promotion_slug_isActive_startDate_endDate_idx" ON "Promotion"("slug", "isActive", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReputation" ADD CONSTRAINT "CustomerReputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAgeGroup" ADD CONSTRAINT "ProductAgeGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAgeGroup" ADD CONSTRAINT "ProductAgeGroup_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkill" ADD CONSTRAINT "ProductSkill_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkill" ADD CONSTRAINT "ProductSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Inventory"("variantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVerification" ADD CONSTRAINT "OrderVerification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "Courier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RTO" ADD CONSTRAINT "RTO_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RTO" ADD CONSTRAINT "RTO_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnEvidence" ADD CONSTRAINT "ReturnEvidence_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Inventory CHECK Constraint
ALTER TABLE "Inventory"
ADD CONSTRAINT "check_inventory_quantity"
CHECK (quantity >= 0 AND "reservedQuantity" >= 0 AND "reservedQuantity" <= quantity);

-- User Constraint
ALTER TABLE "User"
ADD CONSTRAINT "check_user_identifier"
CHECK (phone IS NOT NULL OR email IS NOT NULL OR "googleId" IS NOT NULL);

-- OrderItem Return Check
ALTER TABLE "OrderItem"
ADD CONSTRAINT "check_return_quantity"
CHECK ("returnedQuantity" >= 0);

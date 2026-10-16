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

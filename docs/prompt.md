# KiddyBD Backend — Master Prompt Guide

> **Source of Truth (প্রতিটা prompt এ follow করতে হবে):**
> - `database.md` — Schema, entities, enums, constraints
> - `architecture.md` — Module boundaries, patterns, rules
> - `api-spec.md` — Endpoints, request/response contracts
> - `implementation-plan.md` — Phase sequence, execution rules

> **Implementation Sequence (প্রতিটা module এর জন্য):**
> `Database Models → Repositories → Domain/Service Logic → Validation (Zod) → Controller → Routes → Middleware → Tests → Documentation`

> **Agent Rules:** Controller তে কোনো business logic নেই। Transaction ছাড়া critical operation নয়। Client data কখনো trust করা যাবে না। Provider সবসময় interface এর পেছনে থাকবে।

---

## PHASE 0 — Pre-Coding Validation

```
তুমি একজন Senior Backend Engineer। KiddyBD backend project শুরু করার আগে নিচের source-of-truth ফাইলগুলো read করো এবং validate করো:
- database.md
- architecture.md
- api-spec.md
- implementation-plan.md

Validation checklist:
1. database.md এর সব entity তে PK, FK, constraints আছে কিনা confirm করো।
2. architecture.md এর module dependency rules clearly defined আছে কিনা দেখো।
3. api-spec.md এর সব endpoints এ auth requirement, validation rules, error codes আছে কিনা দেখো।
4. কোনো inconsistency পেলে আমাকে report করো, নিজে fix করো না।
5. সব ঠিক থাকলে "Phase 0 PASSED — Ready to code" বলো।
```

---

## PHASE 1 — Project Bootstrap

```
তুমি একজন Senior Backend Engineer। architecture.md পড়ো (Section 1, 70, 71, 82)।

KiddyBD backend project initialize করো:

1. Node.js + TypeScript + Express project setup:
   - package.json (Node 20+, CommonJS)
   - tsconfig.json (strict: true, target: ES2022, module: commonjs)
   - src/ folder structure:
     src/
     ├── modules/
     ├── middlewares/
     ├── common/
     │   ├── errors/
     │   ├── types/
     │   └── utils/
     ├── config/
     ├── database/
     └── app.ts, server.ts

2. Dependencies:
   Production: express, zod, helmet, cors, express-rate-limit, jsonwebtoken, bcryptjs, uuid, ioredis, bullmq, @prisma/client
   Dev: typescript, ts-node-dev, @types/express, @types/node, @types/cors, @types/bcryptjs, @types/jsonwebtoken, @types/uuid, eslint, prettier, jest, ts-jest, supertest, @types/jest, @types/supertest

3. ESLint + Prettier setup (strict config)।

4. Jest setup (unit + integration separation)।

5. Health endpoints:
   GET /health       → { status: "ok", timestamp, uptime }
   GET /health/live  → { status: "ok" }
   GET /health/ready → { status: "ok", db: "connected", redis: "connected" }

6. app.ts তে Helmet, CORS (allowlist), express.json({ limit: "10kb" }) setup।

7. Tests: Health endpoint unit test।

Completion: npm run dev চালাও, GET /health → 200 OK।
```

---

## PHASE 2 — Configuration, Error Handling & Logging

```
তুমি একজন Senior Backend Engineer। architecture.md পড়ো (Section 60, 71, 72)।

Phase 1 এর উপর নির্ভর করে:

1. src/config/env.ts:
   Zod schema দিয়ে সব required env vars validate করো। Missing হলে startup এই fail (fail-fast pattern)।
   Required: NODE_ENV, PORT, DATABASE_URL, REDIS_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
   CORS_ORIGINS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

2. src/common/errors/ তে Custom Error classes:
   - AppError (base): message, statusCode, errorCode, details[]
   - ValidationError (400), UnauthorizedError (401), ForbiddenError (403)
   - NotFoundError (404), ConflictError (409), InternalError (500)

3. src/middlewares/error.middleware.ts:
   - Express global error handler
   - AppError → api-spec.md Section 1.2 standard error format
   - Production তে stack trace কখনো expose করবে না
   - Sensitive data (phone, email, password) log এ নেই

4. Logger (Winston বা Pino):
   - JSON format (production), pretty (development)
   - Request ID tracking

5. src/middlewares/requestLogger.middleware.ts:
   HTTP method, route, status code, response time, userId log করো।

6. Tests: Custom Error classes unit test, error middleware sanitization test।

Completion: Unhandled promise rejection → structured log এ catch হলে Phase 2 complete।
```

---

## PHASE 3 — Database & Prisma Setup

```
তুমি একজন Senior Backend Engineer। database.md সম্পূর্ণ পড়ো।

Phase 2 এর উপর নির্ভর করে:

1. npm install prisma @prisma/client && npx prisma init

2. prisma/schema.prisma তে database.md Section 1 থেকে সব enum define করো:
   Role, UserStatus, AddressValidationStatus, ProductStatus, MediaType, OrderStatus,
   OrderVerificationType, OrderVerificationStatus, RiskLevel, PaymentStatus,
   ShipmentStatus, RTOReason, ReturnStatus, ReturnReason, RefundStatus, ReviewStatus, CouponType

3. database.md Section 2 থেকে সব entity এর Prisma model define করো।
   Critical points:
   - User: phone nullable, email nullable, googleId nullable
   - Inventory: variantId as PK (not id)
   - Payment: orderId তে @unique নেই (retry support)
   - InventoryReservation: variantId FK (not inventoryId)
   - JSONB fields → Json type in Prisma

4. database.md Section 3 থেকে সব @index decorators।

5. Inventory CHECK constraint → migration এ raw SQL দিয়ে add করো।

6. src/database/prisma.service.ts: PrismaClient singleton + graceful shutdown।

7. Tests: DB connection integration test।

Completion: npx prisma migrate dev --name init successful, prisma studio তে সব tables।
```

---

## PHASE 4 — Authentication & Authorization

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 58, 64, 65, 66, 68)
- database.md পড়ো (User, RefreshToken entities)
- api-spec.md পড়ো (Section 3.1 Auth Module সম্পূর্ণ)

Phase 3 এর উপর নির্ভর করে src/modules/auth/ তে:

Folder structure:
src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── auth.routes.ts
├── auth.validation.ts
├── auth.types.ts
├── strategies/
│   ├── phone-otp.strategy.ts
│   ├── email-otp.strategy.ts
│   └── google-oauth.strategy.ts
└── __tests__/

Services:

1. OTPService (Redis):
   - generateOTP(): 6-digit random
   - storeOTP(key, otp, ttl): Redis SET
   - verifyOTP(key, otp): GET + compare + attempt counter (max 5)
   - Resend cooldown: 60s TTL key
   - Redis keys: kiddybd:otp:phone:{phone}, kiddybd:otp:email:{email}

2. TokenService:
   - generateAccessToken({ userId, role }): JWT 15m
   - generateRefreshToken(userId): JWT 7d
   - verifyAccessToken/verifyRefreshToken

3. AuthService:

   Phone OTP:
   - sendPhoneOTP(phone): validate BD number (01XXXXXXXXX), OTP → Redis, send via SmsProvider interface
   - verifyPhoneOTP(phone, otp): verify → upsert User by phone → issue tokens → store RefreshToken

   Email OTP:
   - sendEmailOTP(email): OTP → Redis, send via EmailProvider interface
   - verifyEmailOTP(email, otp): verify → upsert User by email → issue tokens
     Account linking: same email + existing googleId → return that user's tokens

   Google OAuth:
   - getGoogleAuthUrl(): state (anti-CSRF) → Redis, build Google OAuth URL
   - handleGoogleCallback(code, state):
     → validate state
     → exchange code → get profile (googleId + email)
     → find by googleId → found: login
     → not found → find by email → found: link googleId (update User)
     → not found: create new User
     → issue tokens

   Admin:
   - adminLogin(email, password): find by email, bcrypt verify, role != CUSTOMER, issue tokens

   Session:
   - refreshToken(oldToken): DB validate → issue new pair → revoke old
   - logout(token): set revokedAt

4. UserRepository:
   findByPhone, findByEmail, findByGoogleId, upsertByPhone, upsertByEmail,
   createWithGoogle, linkGoogleToUser, findById

5. Middleware:
   - auth.middleware.ts: authenticate() — verify JWT, attach req.user
   - rbac.middleware.ts: authorize(roles[]) — check req.user.role

6. Routes (api-spec.md Section 3.1):
   POST /api/v1/auth/phone/send-otp
   POST /api/v1/auth/phone/verify-otp
   POST /api/v1/auth/email/send-otp
   POST /api/v1/auth/email/verify-otp
   GET  /api/v1/auth/google
   GET  /api/v1/auth/google/callback
   POST /api/v1/auth/admin/login
   POST /api/v1/auth/refresh-token
   POST /api/v1/auth/logout

7. Rate Limiting:
   - Phone send-otp: 3 req / 5 min / phone
   - Email send-otp: 3 req / 10 min / email
   - Admin login: 5 req / min / IP

8. Provider interfaces (src/common/providers/):
   - SmsProvider: sendOTP(phone, otp)
   - EmailProvider: sendOTP(email, otp)
   - Mock implementations for dev

9. Zod schemas: sendPhoneOTPSchema, verifyPhoneOTPSchema, sendEmailOTPSchema,
   verifyEmailOTPSchema, adminLoginSchema

10. Response: accessToken in body, refreshToken in HttpOnly Secure SameSite=Strict cookie.

11. Tests:
    - Unit: OTPService (mock Redis), TokenService
    - Integration: verifyPhoneOTP full flow
    - E2E: send-otp → verify-otp → access protected route

Completion: Auth flow works, protected routes reject unauthorized requests.
```

---

## PHASE 5 — Users, Addresses & Customer Reputation

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (User, Address, CustomerReputation entities)
- architecture.md পড়ো (Section 48)

Phase 4 এর উপর নির্ভর করে src/modules/users/ তে:

1. UserService:
   - getProfile(userId)
   - updateProfile(userId, dto): name only (phone/email/role client থেকে update নিষেধ)
   - getAddresses, addAddress, updateAddress, deleteAddress

2. Zod: updateProfileSchema, createAddressSchema

3. Routes:
   GET    /api/v1/users/profile
   PATCH  /api/v1/users/profile
   GET    /api/v1/users/addresses
   POST   /api/v1/users/addresses
   PATCH  /api/v1/users/addresses/:id
   DELETE /api/v1/users/addresses/:id

4. Tests: Profile update, address CRUD integration test।

Completion: Profile fetch + address management works।
```

---

## PHASE 6 — Product Catalog

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Category, Brand, AgeGroup, Skill, Product, ProductVariant, ProductMedia entities)
- architecture.md পড়ো (Section 45, 46, 47, 62)

Phase 5 এর উপর নির্ভর করে src/modules/catalog/ তে:

1. ProductService:
   - listProducts(filters, pagination): filter by category/brand/ageGroup/skill/status/search (PostgreSQL full-text)
   - getProductBySlug(slug): variants, media, ageGroups, skills
   - createProduct, updateProduct, archiveProduct (Admin)
   - addVariant, updateVariant (Admin)
   - Media upload: presigned S3 URL via StorageProvider interface

2. Redis caching:
   - kiddybd:cache:product:{slug} — TTL 10min
   - kiddybd:cache:category:all — TTL 30min
   - Cache invalidate on update

3. Routes:
   GET    /api/v1/products              (public, cached)
   GET    /api/v1/products/:slug        (public, cached)
   POST   /api/v1/admin/products        (CONTENT_MANAGER)
   PATCH  /api/v1/admin/products/:id
   DELETE /api/v1/admin/products/:id
   POST   /api/v1/admin/products/:id/variants
   PATCH  /api/v1/admin/products/:id/variants/:variantId
   GET    /api/v1/categories, /api/v1/brands, /api/v1/age-groups, /api/v1/skills

4. Tests: Product list with filters, cache hit/miss, admin role protection।

Completion: GET /products → paginated cached list।
```

---

## PHASE 7 — Inventory Management

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Inventory, InventoryReservation entities)
- architecture.md পড়ো (Section 15, 56)

Phase 6 এর উপর নির্ভর করে src/modules/inventory/ তে:

1. InventoryService:
   - getStock(variantId): quantity, reservedQuantity, available
   - adjustStock(variantId, qty, reason): Admin, DB Transaction
     → Cannot reduce below reservedQuantity → VALIDATION_ERROR
     → Log to AuditLog
   - reserveStock(tx, variantId, orderId, qty): runs inside order transaction
     → SELECT FOR UPDATE on Inventory row
     → Check available >= qty (INVENTORY_LOCKED if not)
     → INSERT InventoryReservation (ACTIVE, expiresAt: now+30min)
     → UPDATE Inventory.reservedQuantity += qty
   - releaseReservation(reservationId): ACTIVE → RELEASED, decrement
   - commitReservation(reservationId): ACTIVE → COMMITTED

2. Redis distributed lock: kiddybd:lock:inventory:{variantId} — 5s TTL (additional safety, NOT authoritative)

3. Routes:
   GET   /api/v1/admin/inventory/:variantId (INVENTORY_MANAGER)
   PATCH /api/v1/admin/inventory/:variantId

4. Background job: expire ACTIVE reservations past expiresAt → every 5 min (BullMQ)

5. Tests:
   - Concurrency test: 10 concurrent requests for last 1 unit → only 1 succeeds (NO overselling)
   - Reserve + release cycle
   - Expire reservation

Completion: Race condition test passes, no overselling possible.
```

---

## PHASE 8 — Cart & Checkout Pre-validation

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Cart, CartItem entities)
- architecture.md পড়ো (Section 41, 42, 43)

Phase 7 এর উপর নির্ভর করে src/modules/cart/ + src/modules/checkout/ তে:

1. CartService:
   - getCart(userId): items with current DB prices
   - addItem(userId, variantId, qty): validate product ACTIVE, variant isActive
   - updateItem, removeItem, clearCart

2. CheckoutService.calculateCheckout(userId, addressId, couponCode?):
   → Fetch CURRENT DB prices (never use cart stored prices)
   → Check each variant isActive + product ACTIVE
   → Check available stock
   → Validate coupon server-side
   → Calculate: subtotal, discount, deliveryCharge, total
   → Return summary (client confirms, then calls POST /orders)
   CRITICAL: Client এর কোনো price/total/discount কখনো trust করা যাবে না।

3. Routes:
   GET    /api/v1/cart
   POST   /api/v1/cart/items
   PATCH  /api/v1/cart/items/:id
   DELETE /api/v1/cart/items/:id
   POST   /api/v1/checkout/calculate

4. Tests:
   - Price manipulation: client sends wrong price → server recalculates correct
   - Out-of-stock detection at checkout
   - Coupon validation edge cases

Completion: Checkout always reflects DB prices.
```

---

## PHASE 9 — Order Creation (Critical)

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Order, OrderItem, OrderStatusHistory + Section 4 Transaction Boundaries)
- architecture.md পড়ো (Section 16, 17, 18, 19, 20)
- api-spec.md পড়ো (Section 3.2, Critical Flow E)

Phase 8 এর উপর নির্ভর করে src/modules/orders/ তে:

OrderService.createOrder(userId, dto, idempotencyKey):
  Step 1: Check IdempotencyKey → exists? Return stored response.
  Step 2: Validate cartId belongs to userId
  Step 3: Fetch current DB prices for all cart items
  Step 4: Validate address belongs to userId
  Step 5: Validate coupon server-side
  Step 6: Check stock: available = quantity - reservedQuantity
  Step 7: Risk Assessment (Phase 10 placeholder: default LOW)
  Step 8: COD validation (HIGH risk + COD → RISK_REJECTED)
  Step 9: BEGIN TRANSACTION
    - INSERT Order (PENDING, fulfillmentStatus: UNFULFILLED)
    - INSERT OrderItems (price snapshots: productNameSnapshot, variantTitleSnapshot, skuSnapshot, unitPrice)
    - reserveStock(tx, ...) for each item
    - INSERT CouponUsage (if coupon)
    - INSERT IdempotencyKey (store response)
    - INSERT OrderStatusHistory (null → PENDING)
  Step 10: COMMIT
  Step 11: Emit OrderCreatedEvent (BullMQ)

OrderStateMachine (src/modules/orders/domain/):
  - canTransition(from, to): architecture.md Section 18 matrix
  - Invalid → INVALID_ORDER_STATE error

cancelOrder: validate → canTransition → TX: update + release reservations + history

Routes:
  POST /api/v1/orders            (CUSTOMER, Idempotency-Key header required)
  GET  /api/v1/orders
  GET  /api/v1/orders/:id
  POST /api/v1/orders/:id/cancel

Zod: createOrderSchema: { cartId: uuid, addressId: uuid, couponCode?: string, paymentMethod: "COD"|"ONLINE" }

Tests:
  - Idempotency: same key twice → same response, no duplicate order
  - Price recalculation enforced
  - Inventory reserved within transaction
  - Invalid state transition → error
  - Concurrent last-stock order (race condition)

Completion: Order creates + inventory reserved, duplicate key returns same order.
```

---

## PHASE 10 — Risk Engine & Smart COD

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (RiskAssessment, CODConfig, CustomerReputation entities)
- architecture.md পড়ো (Section 21, 22, 23, 24, 25)

Phase 9 এর উপর নির্ভর করে src/modules/risk/ তে:

1. RiskEngine (domain/risk-engine.ts) — pure function, no DB/Express:
   Signals (all from DB):
   - rtoRate, cancelRate from CustomerReputation
   - accountAge (days)
   - orderValue
   - addressHistory (previous orders same address)

   Scoring:
   - HIGH rto rate (>30%) → +30 pts
   - New account (<7 days) + high order value → +20 pts
   - Multiple failed orders → +15 pts
   - Good history (many completed, low rto) → -20 pts
   
   RULE: Single signal alone CANNOT classify customer as fraudulent (architecture.md Section 23)
   Output: { score, level: LOW|MEDIUM|HIGH, signals, reasons, action }

2. RiskService:
   - assessOrder(userId, amount): run RiskEngine, INSERT RiskAssessment
   - isCODAllowed(riskLevel): fetch CODConfig from DB (cached Redis kiddybd:cache:cod-config, TTL 5min)

3. CODConfig singleton: admin updates via API → cache invalidate

4. CustomerReputationService: recalculate after each delivery/cancellation/RTO

5. Update Phase 9: integrate real risk assessment

6. Routes:
   GET   /api/v1/admin/risk/:orderId  (SUPER_ADMIN)
   GET   /api/v1/admin/cod-config     (SUPER_ADMIN)
   PATCH /api/v1/admin/cod-config     (SUPER_ADMIN)

7. Tests:
   - HIGH risk + COD → 403 RISK_REJECTED
   - New account ALONE → NOT auto HIGH (Rule 23)
   - Each signal independently scored correctly

Completion: High risk COD → blocked, single signal = not fraudulent.
```

---

## PHASE 11 — Order Verification (OTP)

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (OrderVerification entity)
- architecture.md পড়ো (Section 26)

Phase 10 এর উপর নির্ভর করে src/modules/verification/ তে:

1. MEDIUM risk order → status: VERIFICATION_REQUIRED, send OTP via SMS

2. VerificationService:
   - createVerification(orderId, type): INSERT OrderVerification, send OTP
   - verifyOrder(orderId, userId, otp): verify OTP, check attempts (<5), check expiresAt
     → Success: Order → CONFIRMED, INSERT OrderStatusHistory

3. Routes:
   POST /api/v1/orders/:id/verify        (CUSTOMER)
   POST /api/v1/orders/:id/verify/resend (rate limited: 3 max)

4. Tests: OTP expiry, max attempts (brute force), successful verification → CONFIRMED.

Completion: MEDIUM risk requires OTP before confirming.
```

---

## PHASE 12 — Payment Integration

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Payment, PaymentTransaction, PaymentWebhookEvent entities)
- architecture.md পড়ো (Section 27, 28, 29, 30)
- api-spec.md পড়ো (Section 3.3)

Phase 11 এর উপর নির্ভর করে src/modules/payments/ তে:

1. PaymentProvider interface:
   createPayment, verifyPayment, refundPayment, handleWebhook

2. SSLCommerz adapter (বা mock for dev)

3. PaymentService:
   - initiatePayment(orderId, userId): INSERT Payment, call provider, INSERT PaymentTransaction, return URL
   - handleWebhook(provider, payload, signature):
     → CRITICAL: Verify HMAC signature FIRST
     → Check PaymentWebhookEvent.externalEventId (duplicate → ignore)
     → INSERT PaymentWebhookEvent
     → BEGIN TRANSACTION:
       → UPDATE PaymentTransaction
       → UPDATE Payment
       → If SUCCESS: UPDATE Order (CONFIRMED, paymentStatus: COMPLETED)
       → If SUCCESS: UPDATE InventoryReservation (COMMITTED)
       → INSERT OrderStatusHistory
     → COMMIT
     → Emit PaymentSuccessEvent / PaymentFailedEvent

4. Routes:
   POST /api/v1/payments/initiate          (CUSTOMER)
   POST /api/v1/webhooks/payment/:provider (no auth, signature verified)

5. Tests:
   - Invalid signature → 401
   - Duplicate externalEventId → ignored (idempotency)
   - Success webhook → order CONFIRMED + inventory COMMITTED (transaction)
   - Failure webhook → order NOT confirmed

Completion: Payment webhook → order confirmed, inventory committed.
```

---

## PHASE 13 — Courier Integration & Shipment

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Courier, Shipment, ShipmentEvent entities)
- architecture.md পড়ো (Section 31, 32, 33, 34, 35)

Phase 12 এর উপর নির্ভর করে src/modules/courier/ তে:

1. CourierProvider interface:
   createShipment, cancelShipment, trackShipment, getRates

2. Steadfast বা Pathao adapter + mock adapter

3. ShipmentService:
   - createShipment(orderId): call provider, INSERT Shipment, UPDATE Order → PROCESSING
   - handleCourierWebhook(provider, payload, signature):
     → Verify signature
     → Map external status → ShipmentStatus enum
     → BEGIN TRANSACTION:
       → INSERT ShipmentEvent
       → UPDATE Shipment
       → UPDATE Order + OrderStatusHistory
     → COMMIT
     → Emit ShipmentEvent (notify customer via BullMQ)

4. Routes:
   POST /api/v1/admin/shipments/:orderId/create  (ORDER_MANAGER)
   GET  /api/v1/shipments/:id                    (CUSTOMER, own only)
   POST /api/v1/webhooks/courier/:provider

5. Tests: Duplicate event idempotency, status mapping, order progression।

Completion: Courier webhook updates shipment + order status correctly.
```

---

## PHASE 14 — RTO (Return to Origin)

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (RTO entity, RTOReason enum)
- architecture.md পড়ো (Section 36)

Phase 13 এর উপর নির্ভর করে src/modules/rto/ তে:

1. RTOService.recordRTO(shipmentId, orderId, reason, notes):
   → BEGIN TRANSACTION:
     → INSERT RTO
     → UPDATE Shipment (RETURNED)
     → UPDATE Order (RTO)
     → INSERT OrderStatusHistory
   → COMMIT
   → UPDATE CustomerReputation (rtoOrders++, recalculate rtoRate)
   → Emit OrderRTOEvent

2. Triggered by courier webhook on repeated delivery failure.

3. Routes:
   GET /api/v1/admin/rto          (ORDER_MANAGER)
   GET /api/v1/admin/rto/:orderId

4. Tests: RTO record → order RTO, CustomerReputation updated.

Completion: RTO webhook → order RTO status, reputation updated.
```

---

## PHASE 15 — Returns & Refunds

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Return, ReturnItem, ReturnEvidence, Refund entities)
- architecture.md পড়ো (Section 37, 38, 39, 40)
- api-spec.md পড়ো (Section 3.6)

Phase 14 এর উপর নির্ভর করে src/modules/returns/ + src/modules/refunds/ তে:

1. ReturnService:
   - createReturn(userId, dto):
     → Order must be DELIVERED
     → returnedQuantity + requested <= original (OrderItem check)
     → BEGIN TX: INSERT Return (REQUESTED), ReturnItems, ReturnEvidence
     → Emit ReturnRequestedEvent
   
   - approveReturn(returnId, adminId):
     → BEGIN TX:
       → UPDATE Return (APPROVED, approvedAt)
       → UPDATE OrderItem.returnedQuantity for each ReturnItem
       → INSERT Refund (PENDING, calculated amount)
       → INSERT OrderStatusHistory
     → COMMIT
     → Trigger refund via BullMQ

   - rejectReturn(returnId, adminId, reason): UPDATE Return (REJECTED)

2. RefundService:
   - processRefund(refundId): call PaymentProvider.refundPayment()
     → Must be idempotent (check existing transactionId before calling gateway)
     → UPDATE Refund (COMPLETED, transactionId, processedAt)
     → Emit RefundCompletedEvent

3. Routes (api-spec.md Section 3.6):
   POST /api/v1/returns
   GET  /api/v1/returns
   GET  /api/v1/returns/:id
   POST /api/v1/admin/returns/:id/approve  (ORDER_MANAGER, Idempotency-Key required)
   POST /api/v1/admin/returns/:id/reject

4. Tests:
   - Partial return (1 of 3 items)
   - Return qty > original → error
   - Refund idempotency
   - Approve → Refund created

Completion: Return approved → Refund initiated.
```

---

## PHASE 16 — Product Reviews

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Review, ReviewMedia entities)
- architecture.md পড়ো (Section 49)

Phase 15 এর উপর নির্ভর করে src/modules/reviews/ তে:

1. ReviewService:
   - createReview(userId, dto):
     → Order belongs to userId ✓
     → Order contains productId ✓
     → Order status = DELIVERED ✓ (verifiedPurchase = true)
     → @@unique([customerId, productId, orderId]) — one review per product per order
     → INSERT Review (PENDING), ReviewMedia[]

   - approveReview, rejectReview (CONTENT_MANAGER)

2. Routes:
   POST  /api/v1/reviews
   GET   /api/v1/products/:id/reviews     (public, APPROVED only)
   GET   /api/v1/admin/reviews            (CONTENT_MANAGER)
   PATCH /api/v1/admin/reviews/:id/approve
   PATCH /api/v1/admin/reviews/:id/reject

3. Tests: Non-purchaser → forbidden, duplicate → conflict, undelivered order → error.

Completion: Only verified purchasers can review, admin moderation works.
```

---

## PHASE 17 — Coupons & Promotions

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Coupon, CouponUsage, CouponProduct, CouponCategory, Promotion entities)
- architecture.md পড়ো (Section 44)

Phase 16 এর উপর নির্ভর করে src/modules/coupons/ তে:

1. CouponService.validateCoupon(code, userId, cartItems, orderTotal):
   → isActive, within startDate/endDate
   → orderTotal >= minimumOrderAmount
   → usageLimit: total CouponUsage count
   → perUserLimit: user's CouponUsage count
   → CouponProduct/CouponCategory restrictions
   → Calculate discount (PERCENTAGE/FIXED/FREE_DELIVERY)
   → Return { valid, discount, finalTotal }

2. applyCoupon(tx, ...): INSERT CouponUsage within order transaction

3. PromotionService: listActive (cached), create/update (Admin)

4. Routes:
   POST  /api/v1/coupons/validate
   GET   /api/v1/promotions              (public, cached)
   POST  /api/v1/admin/coupons           (SUPER_ADMIN)
   PATCH /api/v1/admin/coupons/:id
   POST  /api/v1/admin/promotions
   PATCH /api/v1/admin/promotions/:id

5. Tests:
   - Expired coupon → invalid
   - usageLimit exceeded → invalid
   - perUserLimit exceeded → invalid
   - Category restriction mismatch → invalid
   - Concurrent use (10 users, limit=5): exactly 5 succeed (transaction safety)

Completion: Concurrent coupon use respects limits.
```

---

## PHASE 18 — Wishlist

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Wishlist, WishlistItem entities)
- api-spec.md পড়ো (Section 3.5)

Phase 17 এর উপর নির্ভর করে src/modules/wishlist/ তে:

1. WishlistService:
   - getWishlist(userId): with product details
   - addToWishlist(userId, productId): upsert Wishlist, INSERT WishlistItem (@@unique enforced)
   - removeFromWishlist(userId, productId)

2. Routes:
   GET    /api/v1/wishlist
   POST   /api/v1/wishlist/:productId
   DELETE /api/v1/wishlist/:productId

3. Tests: Duplicate add → 409 CONFLICT, remove non-existent → 404.

Completion: Wishlist CRUD with duplicate protection.
```

---

## PHASE 19 — Notifications

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (Notification entity)
- architecture.md পড়ো (Section 51, 52, 53)

Phase 18 এর উপর নির্ভর করে src/modules/notifications/ তে:

1. BullMQ consumers — NotificationWorker:
   OrderCreated → SMS, OrderConfirmed → SMS+Email, OrderShipped → SMS,
   OutForDelivery → SMS, Delivered → SMS+Email+ReviewRequest,
   ReturnApproved → SMS+Email, RefundCompleted → SMS+Email, PaymentFailed → SMS

2. NotificationService.send(userId, channel, type, title, body):
   → INSERT Notification (PENDING)
   → Call SmsProvider/EmailProvider
   → UPDATE Notification (SENT/FAILED, sentAt)

3. Queues: smsQueue, emailQueue, notificationQueue
   - Retry: 3x exponential backoff
   - Dead letter queue for permanent failures

4. Routes:
   GET   /api/v1/notifications
   PATCH /api/v1/notifications/:id/read

5. Tests: OrderCreated → SMS queued, failed notification → 3 retries → dead letter.

Completion: Order created → customer SMS received.
```

---

## PHASE 20 — Idempotency Middleware

```
তুমি একজন Senior Backend Engineer।
- database.md পড়ো (IdempotencyKey entity)
- architecture.md পড়ো (Section 20)
- api-spec.md পড়ো (Section 1.4, 4.6)

Phase 19 এর উপর নির্ভর করে:

1. IdempotencyMiddleware (src/middlewares/idempotency.middleware.ts):
   - Read Idempotency-Key header
   - Check DB: key + userId
   - Exists + responseStatus → return stored responseBody immediately
   - Exists + no response (in-flight) → 409 CONFLICT
   - Not exists → proceed, store result after completion
   - Same key + different requestHash → 422 UNPROCESSABLE_ENTITY

2. Apply to: POST /orders, POST /refunds, POST /payments/initiate

3. Tests:
   - Same key + same payload → same response
   - Same key + different payload → 422
   - Concurrent same-key → only one proceeds

Completion: Duplicate order request returns identical previous response.
```

---

## PHASE 21 — Admin Dashboard APIs

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 66, 69, 78)

Phase 20 এর উপর নির্ভর করে src/modules/admin/ তে:

1. Order Management (ORDER_MANAGER):
   GET    /api/v1/admin/orders
   GET    /api/v1/admin/orders/:id
   PATCH  /api/v1/admin/orders/:id/status  (state machine validated)
   POST   /api/v1/admin/orders/:id/assign-courier

2. Customer Management:
   GET    /api/v1/admin/customers            (CUSTOMER_SUPPORT)
   GET    /api/v1/admin/customers/:id        (profile + order/risk/RTO history)
   PATCH  /api/v1/admin/customers/:id/status (SUPER_ADMIN — suspend/block)

3. Finance (FINANCE_MANAGER):
   GET    /api/v1/admin/payments
   GET    /api/v1/admin/refunds

4. AuditLog middleware:
   Every admin mutation → INSERT AuditLog (userId, action, entity, entityId, oldValue, newValue, ip, userAgent)

5. Tests:
   - CUSTOMER_SUPPORT cannot access FINANCE_MANAGER routes
   - Admin action → AuditLog created

Completion: RBAC enforced, all admin actions logged.
```

---

## PHASE 22 — Analytics & Settlement

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 74, 75)

Phase 21 এর উপর নির্ভর করে src/modules/analytics/ তে:

1. Routes:
   GET /api/v1/admin/analytics/orders      → total, completed, cancelled, RTO rate, AOV
   GET /api/v1/admin/analytics/customers   → new, repeat, delivery success rate
   GET /api/v1/admin/analytics/products    → sales, returns, RTO per product
   GET /api/v1/admin/analytics/couriers    → delivery rate, RTO rate, avg delivery time
   GET /api/v1/admin/analytics/settlement  → expected vs actual COD settlement

2. All queries: PostgreSQL directly (no separate analytics DB for MVP)
3. Heavy queries: analyticsQueue (BullMQ), cache results Redis TTL 1h

Completion: Analytics endpoints return correct data.
```

---

## PHASE 23 — Swagger / OpenAPI Documentation

```
তুমি একজন Senior Backend Engineer। api-spec.md পড়ো (Section 4.7)।

Phase 22 এর উপর নির্ভর করে:

1. Install: @asteasolutions/zod-to-openapi, swagger-ui-express

2. সব Zod schemas থেকে OpenAPI schema generate করো।

3. প্রতিটা route annotate করো: summary, auth, request body, response, error codes।

4. GET /api/docs     → Swagger UI (dev + staging only, blocked production)
   GET /api/docs/json → OpenAPI JSON

Completion: /api/docs তে সব endpoints documented + testable.
```

---

## PHASE 24 — Security Hardening

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 67, 68, 88)

Phase 23 এর উপর নির্ভর করে:

1. Helmet: CSP, HSTS, noSniff, XSS filter — সব configure
2. CORS: allowlist (CORS_ORIGINS env var)
3. Rate limiting: global + per-endpoint (api-spec.md rates)
4. Input sanitization: no HTML in user-controlled string fields
5. Prisma: verify no raw() calls with user input (SQL injection)
6. JWT: 15m access token, secrets in env only
7. Webhooks: ALL payment + courier webhooks verify HMAC signature
8. PII: phone, email কখনো request logs এ নয়
9. Payment data: never stored (gateway only)

Security tests:
- SQL injection → rejected
- XSS payload → sanitized
- Expired JWT → 401
- Role bypass → 403
- Webhook invalid signature → 401

Completion: All security tests pass.
```

---

## PHASE 25 — Background Jobs & Scheduled Tasks

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 53, 79)

Phase 24 এর উপর নির্ভর করে:

1. BullMQ queues (src/queues/):
   emailQueue, smsQueue, notificationQueue, orderQueue, paymentQueue, courierQueue, analyticsQueue

2. Workers (src/workers/): separate process from API

3. Scheduled jobs (BullMQ cron):
   - Every 5 min: expire inventory reservations (ACTIVE + past expiresAt → EXPIRED + release)
   - Every 30 min: cancel unpaid ONLINE orders (PENDING > 30 min)
   - Every 1 hour: sync shipment status from courier APIs
   - Every 1 hour: payment reconciliation (poll gateway for stuck payments)
   - Every day: analytics aggregation

4. Job safety: all jobs MUST be idempotent. Failed → retry 3x backoff → dead letter → alert log.

5. Tests: Inventory expiry job, unpaid order cancellation job.

Completion: Scheduled jobs run without errors.
```

---

## PHASE 26 — Docker, CI/CD & Production Readiness

```
তুমি একজন Senior Backend Engineer।
- architecture.md পড়ো (Section 82, 83, 84, 85)

Phase 25 এর উপর নির্ভর করে:

1. Dockerfile (multi-stage):
   Stage 1 (build): npm ci + tsc
   Stage 2 (production): dist/ + node_modules/production + non-root user (node:20-alpine)

2. docker-compose.yml (development):
   services: api, worker, postgres (v16), redis (v7)

3. .env.example: সব required vars list (no real values), .gitignore তে .env

4. CI/CD (.github/workflows/ci.yml):
   Install → Lint → TypeCheck → Unit Tests → Integration Tests → Build → Docker Build

5. Production migration: npx prisma migrate deploy (not dev)

6. Production checklist:
   ✅ All architecture.md rules applied
   ✅ Prisma migrations match database.md
   ✅ api-spec.md fully implemented
   ✅ All E2E tests passing
   ✅ Docker builds cleanly
   ✅ Health checks working
   ✅ Secrets in env only (never committed)
   ✅ Swagger accessible in staging

7. Final E2E:
   Register (Phone OTP) → Browse → Cart → Checkout → Order → Payment Webhook → Shipment → Delivery → Review

Completion: Docker builds, CI passes, full E2E passes → PROJECT COMPLETE ✅
```

---

## Quick Reference

### Phase Dependency Graph:
```
P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10
→ P11 → P12 → P13 → P14 → P15
                              ↓ (P16–P22 parallel)
→ P23 → P24 → P25 → P26 ✅
```

### প্রতিটা Prompt এ মনে রাখো:
- Source of truth read করো আগে
- Implementation Sequence follow করো
- Controller thin (no business logic)
- Transaction ছাড়া critical operation নয়
- Client data = never trusted
- External provider = always behind interface

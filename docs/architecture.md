# KiddyBD Backend — Production Architecture Specification

**Document Version:** 1.1  
**Status:** Approved Architecture Baseline  
**Product:** KiddyBD  
**Domain:** Kids Toys, Educational Toys & Brain Development Ecommerce  
**Target Market:** Bangladesh  
**Architecture Style:** Modular Monolith  
**API Style:** REST  
**Backend:** Node.js + Express.js + TypeScript  

---

# 1. Architecture Overview

KiddyBD is a Bangladesh-focused ecommerce platform specializing in:

- Kids Toys
- Educational Toys
- Brain Development Products
- Learning Kits
- Creativity Products
- STEM Products
- Age-based Learning Products

The backend must support both standard ecommerce functionality and Bangladesh-specific commerce challenges such as:

- Fake COD orders
- High RTO rates
- Customer cancellation
- Wrong or incomplete addresses
- Courier failures
- COD verification
- Payment reconciliation
- Return fraud
- Inventory race conditions
- Customer trust
- Product expectation mismatch

The backend will initially use a **Modular Monolith Architecture**.

Microservices must **not** be introduced during the initial development stages unless there is a documented technical requirement.

---

# 2. Core Architectural Principles

The backend must follow these principles:

### 2.1 Never Trust the Client

The server must independently validate and calculate:

- Product price
- Discount
- Coupon
- Inventory
- Delivery charge
- Order total
- Payment status
- COD eligibility
- Risk score
- User permissions
- Order status transitions

Client-provided values must never be treated as authoritative.

---

### 2.2 Modular Monolith First

The application should be organized into independent business modules while remaining inside one deployable backend application.

This provides:

- Simpler development
- Easier debugging
- Lower infrastructure complexity
- Strong module boundaries
- Easier future migration to microservices

A module may later be extracted into a separate service if actual scale requires it.

---

### 2.3 Business Logic Must Not Live in Controllers

Controllers should remain thin.

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service / Use Case
  ↓
Domain Logic
  ↓
Repository / Infrastructure
```

Controllers should handle HTTP concerns only.

Business rules must live inside services/domain logic.

---

### 2.4 No Circular Module Dependencies

Modules must have a clear dependency direction.

For example:

```text
Checkout → Orders
```

is acceptable.

But:

```text
Checkout → Orders → Checkout
```

must be avoided.

Shared business logic should be moved into appropriate services/domain utilities instead of creating circular dependencies.

---

### 2.5 Critical Operations Must Be Transactional

The following operations require strong consistency:

- Order creation
- Inventory reservation
- Payment state updates
- Refund processing
- Return completion
- Shipment creation where applicable

PostgreSQL transactions should be used wherever multiple related records must change atomically.

---

# 3. Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | HTTP framework |
| TypeScript | Type safety |
| PostgreSQL | Primary relational database |
| Prisma | ORM |
| Redis | Cache, OTP, rate limiting, locks |
| BullMQ | Background jobs |
| JWT | Authentication |
| Zod | Request/environment validation |
| Swagger/OpenAPI | API documentation |
| Jest | Testing |
| Supertest | HTTP integration testing |
| Docker | Containerization |

Optional future technologies:

- OpenSearch / Elasticsearch
- S3-compatible object storage
- Monitoring platform
- Error tracking platform
- AI/ML services

---

# 4. High-Level System Architecture

```text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │ Next.js / Web App   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express REST API  │
                         │      /api/v1        │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌───────────────────┐           ┌───────────────────┐
          │ Application Layer │           │  Middleware Layer │
          │ Services / UseCase│           │ Auth / Validation │
          └─────────┬─────────┘           │ Rate Limit / etc. │
                    │                     └───────────────────┘
                    ▼
          ┌─────────────────────┐
          │    Domain Logic     │
          │ Pricing / Risk /    │
          │ Orders / Inventory  │
          └──────────┬──────────┘
                     │
          ┌──────────┼───────────┐
          │          │           │
          ▼          ▼           ▼
      PostgreSQL   Redis       BullMQ
          │          │           │
          │          │           ▼
          │          │       Background Workers
          │          │
          ▼          ▼
       Persistent   Cache /
         Data      Temporary Data
                     │
                     ▼
          ┌──────────────────────┐
          │ External Integrations│
          ├──────────────────────┤
          │ Payment Providers    │
          │ Courier Providers    │
          │ SMS                  │
          │ Email                │
          │ Object Storage       │
          └──────────────────────┘
```

---

# 5. Application Layer Architecture

The backend should follow a layered architecture.

```text
HTTP Layer
    ↓
Application Layer
    ↓
Domain Layer
    ↓
Infrastructure Layer
```

## 5.1 HTTP Layer

Responsible for:

- Routes
- Controllers
- Request parsing
- Authentication middleware
- Validation
- HTTP response formatting

---

## 5.2 Application Layer

Responsible for:

- Use cases
- Service orchestration
- Business workflow coordination
- Transaction boundaries

Examples:

```text
CreateOrderService
VerifyOrderService
CreatePaymentService
ProcessReturnService
CalculateRiskService
ReserveInventoryService
```

---

## 5.3 Domain Layer

Responsible for core business rules.

Examples:

```text
OrderStateMachine
PricingRules
CouponRules
CODRules
RiskRules
InventoryRules
ReturnRules
RefundRules
```

Domain logic should remain independent from Express where possible.

---

## 5.4 Infrastructure Layer

Responsible for external technical implementations:

```text
Prisma
Redis
BullMQ
Payment APIs
Courier APIs
SMS providers
Email providers
Storage providers
```

---

# 6. Request Lifecycle

Every API request should follow a predictable lifecycle.

```text
Incoming Request
       ↓
Request ID
       ↓
Security Headers
       ↓
CORS
       ↓
Rate Limiting
       ↓
Authentication
       ↓
Authorization
       ↓
Request Validation
       ↓
Route
       ↓
Controller
       ↓
Service / Use Case
       ↓
Domain Logic
       ↓
Database / Redis / External Service
       ↓
Response Formatter
       ↓
Logging
       ↓
Response
```

---

# 7. Project Structure

```text
src/
│
├── modules/
│   │
│   ├── auth/
│   ├── users/
│   ├── customers/
│   ├── addresses/
│   ├── products/
│   ├── categories/
│   ├── brands/
│   ├── age-groups/
│   ├── skills/
│   ├── inventory/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── payments/
│   ├── risk/
│   ├── verification/
│   ├── couriers/
│   ├── shipments/
│   ├── returns/
│   ├── refunds/
│   ├── reviews/
│   ├── wishlist/
│   ├── coupons/
│   ├── promotions/
│   ├── notifications/
│   ├── recommendations/
│   ├── analytics/
│   ├── content/
│   └── admin/
│
├── integrations/
│   ├── payment/
│   │   ├── payment-provider.interface.ts
│   │   ├── providers/
│   │   └── payment.factory.ts
│   │
│   ├── courier/
│   │   ├── courier-provider.interface.ts
│   │   ├── providers/
│   │   └── courier.factory.ts
│   │
│   ├── sms/
│   ├── email/
│   └── storage/
│
├── database/
│   ├── prisma/
│   └── prisma.service.ts
│
├── queues/
│   ├── email.queue.ts
│   ├── sms.queue.ts
│   ├── notification.queue.ts
│   ├── order.queue.ts
│   ├── payment.queue.ts
│   ├── courier.queue.ts
│   └── analytics.queue.ts
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   ├── validation.middleware.ts
│   ├── rate-limit.middleware.ts
│   ├── request-id.middleware.ts
│   └── error.middleware.ts
│
├── common/
│   ├── errors/
│   ├── constants/
│   ├── types/
│   ├── utils/
│   ├── decorators/
│   └── helpers/
│
├── config/
│   ├── env.ts
│   ├── app.ts
│   ├── database.ts
│   ├── redis.ts
│   ├── jwt.ts
│   ├── payment.ts
│   ├── courier.ts
│   └── storage.ts
│
├── events/
│   ├── event-bus.ts
│   ├── order.events.ts
│   ├── payment.events.ts
│   ├── shipment.events.ts
│   └── customer.events.ts
│
├── app.ts
└── server.ts
```

---

# 8. Module Dependency Architecture

The modules should follow these dependency rules.

```text
Auth
 ├── Users
 └── Redis

Users
 └── Customers

Customers
 └── Addresses

Products
 ├── Categories
 ├── Brands
 ├── AgeGroups
 └── Skills

Inventory
 └── Products

Cart
 ├── Products
 └── Inventory

Checkout
 ├── Cart
 ├── Products
 ├── Inventory
 ├── Customers
 ├── Coupons
 ├── Risk
 └── Orders

Orders
 ├── Customers
 ├── Inventory
 ├── Risk
 ├── Verification
 └── Payments

Payments
 └── Payment Integrations

Couriers
 └── Courier Integrations

Shipments
 ├── Orders
 └── Couriers

Returns
 ├── Orders
 └── Shipments

Refunds
 ├── Returns
 └── Payments

Reviews
 ├── Products
 └── Orders

Recommendations
 ├── Products
 ├── AgeGroups
 └── Skills

Analytics
 ├── Orders
 ├── Customers
 ├── Products
 ├── Shipments
 ├── Returns
 └── Payments
```

### Dependency rule

Lower-level modules must not import controllers from other modules.

Modules should communicate through:

- Services
- Interfaces
- Domain events
- Application-level use cases

---

# 9. Database Architecture

Primary database:

**PostgreSQL**

ORM:

**Prisma**

Database responsibilities:

- Persistent business data
- Orders
- Customers
- Products
- Payments
- Shipments
- Returns
- Audit logs
- Analytics source data

Redis must not be treated as the source of truth for critical business data.

---

# 10. Database Entity Map

Core entities:

```text
User
CustomerReputation
Address

Category
Brand
AgeGroup
Skill
Product
ProductMedia
ProductAgeGroup
ProductSkill

Inventory
InventoryReservation

Cart
CartItem

Order
OrderItem
OrderStatusHistory

RiskAssessment
OrderVerification

Payment
PaymentTransaction
PaymentWebhookEvent

Courier
Shipment
ShipmentEvent

RTO

Return
ReturnItem
ReturnEvidence

Refund

Review
ReviewMedia

Wishlist
WishlistItem

Coupon
CouponUsage
CouponProduct
CouponCategory
Promotion

Notification
AuditLog
IdempotencyKey

CODConfig

RefreshToken
```

---

# 11. Historical Data Snapshot Rules

Historical records must remain stable.

For example, `OrderItem` should store:

```text
productId
productNameSnapshot
skuSnapshot
unitPrice
quantity
discount
subtotal
```

If the product name or price changes later, the historical order must not change.

Similarly, an order must store:

```text
shippingAddressSnapshot
billingAddressSnapshot
```

The customer's current address must never mutate an existing order.

---

# 12. Database Constraints

Use:

- Foreign keys
- Unique constraints
- Check constraints
- Not-null constraints
- Proper indexes
- Transactions
- Referential integrity

Important unique fields:

```text
User.phone
User.email
Product.slug
Product.sku
Order.orderNumber
Shipment.trackingId
```

---

# 13. Database Indexing Strategy

At minimum:

```text
User.phone
User.email

Product.slug
Product.categoryId
Product.status

ProductVariant.sku
ProductVariant.productId

Order.orderNumber
Order.customerId
Order.status
Order.createdAt

OrderItem.orderId
OrderItem.productId
OrderItem.variantId

Shipment.trackingId
Shipment.orderId
Shipment.status

Payment.orderId

PaymentTransaction.paymentId
PaymentTransaction.externalTransactionId

PaymentWebhookEvent.externalEventId
PaymentWebhookEvent.provider

RiskAssessment.orderId

Return.orderId
Return.customerId

Review.productId
Review.customerId

Notification.userId
Notification.status

IdempotencyKey.key
IdempotencyKey.userId
```

Composite indexes should be introduced based on real query patterns.

---

# 14. Transaction & Concurrency Strategy

Critical operations must use PostgreSQL transactions.

Example order creation:

```text
BEGIN TRANSACTION

Validate stock
Create Order
Create OrderItems
Reserve Inventory
Create RiskAssessment
Create Verification if required

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

Inventory must use proper database-level concurrency protection.

Redis locks can be used as an additional protection mechanism but must not replace database consistency.

---

# 15. Inventory Reservation Architecture

Inventory should support reservations.

```text
Available Stock
      ↓
Order Created
      ↓
Reserve Stock
      ↓
Payment / Verification
      ↓
Order Confirmed
```

If order expires/cancels:

```text
Reserved Stock
      ↓
Release Reservation
      ↓
Available Stock
```

Entity:

```text
InventoryReservation

id
variantId
orderId
quantity
status
expiresAt
createdAt
releasedAt
```

Statuses:

```text
ACTIVE
RELEASED
COMMITTED
EXPIRED
```

The system must prevent:

- Overselling
- Negative stock
- Double reservation
- Duplicate release

---

# 16. Order Architecture

Order is one of the most important domain modules.

Order contains:

```text
Order
OrderItem
OrderStatusHistory
```

Order status history should record every transition.

```text
OrderStatusHistory

id
orderId
fromStatus
toStatus
reason
changedBy
createdAt
```

This provides full order lifecycle auditing.

---

# 17. Order State Machine

Primary lifecycle:

```text
PENDING
   ↓
RISK_REVIEW
   ↓
VERIFICATION_REQUIRED
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Alternative terminal states:

```text
CANCELLED
RTO
```

Return should have its own lifecycle and should not be mixed with the main order state machine unnecessarily.

---

# 18. Order Transition Matrix

| Current State | Allowed Next States |
|---|---|
| PENDING | RISK_REVIEW, CANCELLED |
| RISK_REVIEW | CONFIRMED, VERIFICATION_REQUIRED, CANCELLED |
| VERIFICATION_REQUIRED | CONFIRMED, CANCELLED |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | SHIPPED, CANCELLED |
| SHIPPED | OUT_FOR_DELIVERY, RTO |
| OUT_FOR_DELIVERY | DELIVERED, RTO |
| DELIVERED | RETURN_REQUESTED where applicable |
| CANCELLED | Terminal |
| RTO | Terminal |

Invalid transitions must be rejected by the backend.

---

# 19. Order Creation Flow

```text
Customer
   ↓
Checkout
   ↓
Server Validation
   ├── Product
   ├── Price
   ├── Stock
   ├── Address
   ├── Coupon
   └── Delivery
   ↓
Risk Assessment
   ↓
Payment / COD Decision
   ↓
Create Order
   ↓
Reserve Inventory
   ↓
Verification if Required
   ↓
Confirm Order
   ↓
Courier
   ↓
Shipment
```

---

# 20. Idempotency Architecture

Idempotency is mandatory for critical mutation APIs.

Important endpoints:

```text
POST /orders
POST /payments
POST /refunds
```

Client sends:

```http
Idempotency-Key: unique-request-key
```

Flow:

```text
Request
   ↓
Read Idempotency-Key
   ↓
Check Existing Request
   ├── Exists → Return Previous Result
   │
   └── Does Not Exist
          ↓
       Process
          ↓
       Store Result
```

Idempotency records should contain:

```text
id
key
userId
endpoint
requestHash
responseStatus
responseBody
createdAt
expiresAt
```

A reused key with a different request payload should be rejected.

---

# 21. Risk Engine Architecture

The risk engine evaluates multiple signals.

Possible signals:

```text
Phone history
Order history
RTO history
Cancellation history
Address history
Order value
Order frequency
Account age
Device signals
IP signals
Duplicate account signals
```

Output:

```text
riskScore
riskLevel
riskReasons
recommendedAction
```

---

# 22. Risk Levels

Initial configurable thresholds:

```text
0–29    LOW
30–69   MEDIUM
70–100  HIGH
```

### LOW

```text
Normal COD
```

### MEDIUM

```text
OTP Verification
SMS Confirmation
Phone Verification
```

### HIGH

```text
Advance Payment
Manual Verification
COD Restriction
```

Thresholds must be configurable.

---

# 23. Risk Engine Safety Rule

No single signal should automatically classify a customer as fraudulent.

Risk should be based on multiple signals and historical behavior.

Example:

```text
High order value
+
New account
+
High historical RTO
```

may produce a high-risk score.

But:

```text
New account alone
```

must not automatically classify the customer as fraudulent.

---

# 24. Risk Assessment History

Every risk evaluation should be stored.

```text
RiskAssessment

id
orderId
score
level
signals
reasons
action
createdAt
```

This is required for:

- Debugging
- Auditing
- Analytics
- Future ML models
- Business rule improvement

---

# 25. Smart COD Architecture

COD eligibility should be determined by configurable business rules.

Configuration:

```text
minimumOrderAmount
maximumCODAmount
riskThreshold
advancePercentage
verificationRequired
```

Example:

```text
Risk < 30
→ Normal COD

Risk 30–69
→ Verification Required

Risk ≥ 70
→ Advance Payment / Manual Review
```

These values must be configurable through admin settings.

---

# 26. Order Verification Architecture

Verification methods:

```text
OTP
SMS_LINK
MANUAL_CALL
ADVANCE_PAYMENT
```

Entity:

```text
OrderVerification

id
orderId
type
status
attempts
expiresAt
verifiedAt
createdAt
```

Security requirements:

- Expiration
- Attempt limits
- Resend cooldown
- Rate limiting
- Brute-force protection

---

# 27. Payment Architecture

Payment logic must use a provider abstraction.

```text
PaymentProvider
```

Interface responsibilities:

```text
createPayment()
verifyPayment()
refundPayment()
handleWebhook()
```

Possible providers:

```text
bKash
Nagad
Card Gateway
Other providers
```

The business logic must not directly depend on one provider implementation.

---

# 28. Payment Data Model

Payment should be separated from individual transaction attempts.

```text
Payment
   │
   └── PaymentTransaction
```

Example:

```text
Payment Attempt #1
→ FAILED

Payment Attempt #2
→ SUCCESS
```

Payment transaction should include:

```text
id
paymentId
provider
externalTransactionId
amount
status
rawReference
createdAt
updatedAt
```

---

# 29. Payment Webhook Architecture

Webhook processing:

```text
Gateway Webhook
      ↓
Validate Signature
      ↓
Check Event ID
      ↓
Check Idempotency
      ↓
Verify Transaction
      ↓
Update PaymentTransaction
      ↓
Update Payment
      ↓
Update Order
      ↓
Emit Payment Event
```

Frontend payment success pages are never authoritative.

The backend must verify payment server-side.

---

# 30. Payment Webhook Events

Store webhook events:

```text
PaymentWebhookEvent

id
provider
externalEventId
eventType
payload
signature
processed
processedAt
createdAt
```

Duplicate webhook events must be safely ignored.

---

# 31. Courier Architecture

Use a provider abstraction:

```text
CourierProvider
```

Methods:

```text
createShipment()
cancelShipment()
trackShipment()
getDeliveryStatus()
getRates()
getSettlement()
```

The order system should not depend directly on a specific courier provider.

---

# 32. Courier Adapter Pattern

```text
CourierService
      │
      ▼
CourierProvider Interface
      │
 ┌────┴────┐
 ▼         ▼
Provider A Provider B
```

Adding a new courier should require implementing the interface rather than rewriting order logic.

---

# 33. Shipment Architecture

Shipment fields:

```text
id
orderId
courierId
trackingId
status
weight
codAmount
shippingCost
shippedAt
deliveredAt
returnedAt
createdAt
updatedAt
```

---

# 34. Shipment Event History

Shipment status history should be stored.

```text
ShipmentEvent

id
shipmentId
status
externalStatus
location
description
occurredAt
createdAt
```

Example:

```text
Order Confirmed
      ↓
Picked Up
      ↓
In Transit
      ↓
Reached Local Hub
      ↓
Out For Delivery
      ↓
Delivered
```

This data should also support delivery analytics.

---

# 35. Courier Webhook Architecture

Endpoint:

```text
POST /api/v1/webhooks/courier/:provider
```

Flow:

```text
Courier Webhook
      ↓
Verify Signature
      ↓
Validate Payload
      ↓
Check Duplicate Event
      ↓
Map External Status
      ↓
Update Shipment
      ↓
Update Order
      ↓
Create ShipmentEvent
      ↓
Emit Shipment Event
      ↓
Notify Customer
```

---

# 36. RTO Architecture

RTO must be tracked independently.

Entity:

```text
RTO

id
orderId
shipmentId
reason
notes
createdAt
```

Reasons:

```text
CUSTOMER_UNAVAILABLE
WRONG_ADDRESS
PHONE_UNREACHABLE
CUSTOMER_REFUSED
CUSTOMER_CANCELLED
COURIER_ISSUE
OTHER
```

RTO analytics should support:

- Customer
- Product
- Courier
- District
- Address
- Order value
- Time period

---

# 37. Return Architecture

Return has its own state machine.

Statuses:

```text
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
PICKUP_SCHEDULED
RECEIVED
QUALITY_CHECK
COMPLETED
CANCELLED
```

Entity:

```text
Return

id
orderId
customerId
reason
description
status
requestedAt
approvedAt
receivedAt
createdAt
updatedAt
```

---

# 38. Return Items

Returns should support partial returns.

Therefore:

```text
Return
   └── ReturnItem
```

`ReturnItem`:

```text
id
returnId
orderItemId
quantity
reason
```

This allows a customer to return one item from a multi-item order.

---

# 39. Return Evidence

Some return reasons may require evidence.

Supported evidence:

```text
IMAGE
VIDEO
```

Entity:

```text
ReturnEvidence

id
returnId
type
url
createdAt
```

Evidence requirements may depend on:

- Return reason
- Product category
- Product policy

---

# 40. Refund Architecture

Refunds should be linked to returns and payments.

```text
Return
   ↓
Refund
   ↓
Payment Provider
```

Refund statuses:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Refund processing must be idempotent.

---

# 41. Cart Architecture

Entities:

```text
Cart
CartItem
```

Cart operations:

```text
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
```

Cart data must not be treated as final checkout data.

Checkout must revalidate:

- Product status
- Price
- Stock
- Coupon
- Delivery
- Payment method

---

# 42. Checkout Architecture

Checkout acts as an orchestration layer.

```text
Cart
 ↓
Product Validation
 ↓
Inventory Validation
 ↓
Price Calculation
 ↓
Coupon Validation
 ↓
Delivery Calculation
 ↓
COD Validation
 ↓
Risk Assessment
 ↓
Payment Decision
 ↓
Order Creation
```

Checkout should not own persistent order state.

The Order module remains the source of truth for orders.

---

# 43. Pricing Architecture

Pricing must be calculated server-side.

Possible calculation:

```text
Subtotal
 - Product Discounts
 - Coupon Discount
 + Delivery Charge
 = Total
```

Backend must recalculate totals on every order creation.

Never accept:

```text
frontendTotal
frontendDiscount
frontendPrice
```

as authoritative.

---

# 44. Coupon Architecture

Coupon types:

```text
PERCENTAGE
FIXED
FREE_DELIVERY
```

Possible restrictions:

```text
minimumOrderAmount
maximumDiscount
productRestriction
categoryRestriction
usageLimit
perUserLimit
startDate
endDate
```

Coupon validation must happen server-side.

Coupon usage must be transaction-safe to prevent exceeding usage limits.

---

# 45. Product Architecture

Product supports:

```text
Product
ProductMedia
ProductAgeGroup
ProductSkill
```

**Product** entity fields:

```text
name / slug / description / shortDescription
categoryId / brandId / status / material / origin
createdAt / updatedAt
```

Safety fields: `recommendedAge`, `smallPartsWarning`, `chokingHazard`, `supervisionRequired`, `materialSafety`, `safetyInstructions`

Note: `sku`, `price`, `discountPrice`, `weight`, and `dimensions` belong to **ProductVariant**, not Product.

**ProductVariant** entity fields (per SKU/variant):

```text
sku / title / price / discountPrice
weight / dimensions / isActive
createdAt / updatedAt
```

---

# 46. Product Safety Architecture

Product safety information:

```text
recommendedAge
smallPartsWarning
chokingHazard
supervisionRequired
materialSafety
safetyInstructions
```

Safety information must be manageable by admins.

---

# 47. Age & Skill Architecture

Age groups:

```text
0–1
1–2
2–3
3–5
5–7
7–10
10+
```

Skills:

```text
Memory
Creativity
Problem Solving
Fine Motor Skills
Concentration
Language
Math
Logical Thinking
STEM
```

Relationships:

```text
Product ↔ AgeGroup
Product ↔ Skill
```

Both are many-to-many relationships.

---

# 48. Customer Reputation Architecture

Customer reputation is calculated from historical behavior.

Metrics:

```text
totalOrders
completedOrders
cancelledOrders
rtoOrders
returnedOrders
totalSpent
deliverySuccessRate
rtoRate
cancelRate
returnRate
lastOrderAt
```

This information can be consumed by the risk engine.

Reputation should be recalculated or updated consistently after relevant order lifecycle events.

---

# 49. Review Architecture

Only verified purchasers should be able to submit product reviews.

Requirements:

```text
Order must belong to customer
Order must contain product
Order must be delivered
Product must be associated with order
```

Review fields:

```text
rating
title
comment
verifiedPurchase
status
```

Admin moderation should be supported.

---

# 50. Wishlist Architecture

Endpoints:

```text
GET    /api/v1/wishlist
POST   /api/v1/wishlist/:productId
DELETE /api/v1/wishlist/:productId
```

A customer should not be able to create duplicate wishlist entries.

---

# 51. Notification Architecture

Supported channels:

```text
SMS
Email
Push Notification
```

Important events:

```text
OTP
Order Created
Order Confirmed
Order Shipped
Out For Delivery
Delivered
Return Approved
Refund Completed
Payment Failed
```

Notifications should normally be asynchronous.

---

# 52. Internal Event Architecture

Business events should decouple modules.

Examples:

```text
OrderCreated
OrderConfirmed
OrderCancelled
OrderDelivered
OrderRTO
PaymentSuccessful
PaymentFailed
ShipmentCreated
ShipmentDelivered
ReturnApproved
RefundCompleted
```

Example:

```text
OrderCreated
     │
     ├── Notification
     ├── Analytics
     ├── Customer Reputation
     └── Admin Notification
```

These secondary operations should not unnecessarily block the main API request.

---

# 53. BullMQ Architecture

BullMQ will handle background jobs.

Queues:

```text
emailQueue
smsQueue
notificationQueue
orderQueue
paymentQueue
courierQueue
analyticsQueue
```

Example:

```text
Order Created
     ↓
Event
     ↓
Queue
     ├── SMS Job
     ├── Email Job
     ├── Analytics Job
     └── Notification Job
```

Jobs should support:

- Retry
- Backoff
- Failure handling
- Dead-letter handling where appropriate
- Idempotent processing

---

# 54. Redis Architecture

Redis is used for:

- OTP
- Rate limiting
- Caching
- Temporary data
- Distributed locks
- BullMQ infrastructure
- Short-lived verification state

Redis must not be the authoritative source for:

- Orders
- Payments
- Inventory
- Refunds
- Customers

---

# 55. Redis Key Convention

Use namespaced keys.

```text
kiddybd:otp:{phone}

kiddybd:ratelimit:{ip}:{endpoint}

kiddybd:cache:product:{slug}

kiddybd:cache:product:{id}

kiddybd:cache:category:{id}

kiddybd:lock:inventory:{variantId}

kiddybd:verification:{orderId}

kiddybd:idempotency:{userId}:{key}
```

All keys should have appropriate TTLs where applicable.

---

# 56. Redis Inventory Lock

Redis locks may be used to reduce concurrent inventory conflicts.

Example:

```text
kiddybd:lock:inventory:{variantId}
```

However:

> Redis locking is an additional concurrency mechanism, not the primary source of inventory consistency.

PostgreSQL transactions and row-level locking must remain authoritative.

---

# 57. API Architecture

Base path:

```text
/api/v1
```

All APIs must use consistent REST conventions.

Example:

```text
GET    /products
GET    /products/:slug

GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id

POST   /orders
GET    /orders
GET    /orders/:id
POST   /orders/:id/verify
POST   /orders/:id/cancel
```

---

# 58. Authentication API

Customer endpoints (passwordless):

```text
POST /api/v1/auth/phone/send-otp
POST /api/v1/auth/phone/verify-otp

POST /api/v1/auth/email/send-otp
POST /api/v1/auth/email/verify-otp

GET  /api/v1/auth/google
GET  /api/v1/auth/google/callback
```

Admin endpoint:

```text
POST /api/v1/auth/admin/login
```

Session management:

```text
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
```

---

# 59. API Response Standard

Success:

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Unable to create order",
  "error": {
    "code": "ORDER_CREATION_FAILED",
    "details": []
  }
}
```

The response format must remain consistent across modules.

---

# 60. Error Architecture

Use centralized Express error middleware.

Expected structure:

```text
Application Error
      ↓
Error Middleware
      ↓
Map Error Type
      ↓
HTTP Status
      ↓
Standard Error Response
      ↓
Structured Log
```

Example codes:

```text
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
RESOURCE_NOT_FOUND
VALIDATION_ERROR
INSUFFICIENT_STOCK
ORDER_CREATION_FAILED
INVALID_ORDER_STATE
PAYMENT_FAILED
PAYMENT_VERIFICATION_FAILED
OTP_EXPIRED
OTP_TOO_MANY_ATTEMPTS
RISK_REVIEW_REQUIRED
COUPON_INVALID
RATE_LIMIT_EXCEEDED
```

Internal errors must not expose stack traces or sensitive information in production.

---

# 61. Pagination

Default:

```text
?page=1&limit=20
```

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Cursor pagination can be introduced later for high-volume endpoints.

---

# 62. Search Architecture

MVP search:

**PostgreSQL**

Search fields:

```text
Product Name
SKU
Category
Brand
Skill
Age Group
```

Use PostgreSQL full-text and/or trigram search.

Future:

```text
OpenSearch / Elasticsearch
```

should be introduced only when justified by scale or search requirements.

---

# 63. File Storage Architecture

Large files must not unnecessarily pass through Express.

Recommended:

```text
Frontend
    ↓
Backend requests signed upload URL
    ↓
Object Storage
    ↓
Backend stores file metadata
```

Use S3-compatible storage where appropriate.

Supported files:

```text
Product Images
Product Videos
Return Evidence
Review Images
```

Backend must validate:

- MIME type
- Extension
- File size
- Upload permissions

---

# 64. Authentication Architecture

Customer authentication is **passwordless** via three providers:

```text
┌───────────────┬───────────────┬───────────────┐
│  Phone OTP    │   Email OTP   │  Google OAuth │
├───────────────┼───────────────┼───────────────┤
│ send-otp     │ send-otp     │ /auth/google │
│ (SMS)        │ (Email)      │    ↓          │
│     ↓        │     ↓        │ Google OAuth │
│ verify-otp   │ verify-otp   │ Callback     │
│ (OTP check)  │ (OTP check)  │ (No OTP)     │
│     ↓        │     ↓        │     ↓        │
└───────────────┴───────────────┴───────────────┘
            ↓ All paths converge ↓
       upsert User + issue JWT Tokens
```

Account Linking Strategy (Google Callback):

```text
Google returns googleId + email
      ↓
Find User by googleId
      ├── Found → Login (existing Google user)
      └── Not found
             ↓
         Find User by email
              ├── Found → Link googleId to existing account
              └── Not found → Create new User
```

Admin:

```text
Email
+
Password (bcrypt)
→ Role must be non-CUSTOMER
→ Access + Refresh Token
```

---

# 65. JWT Architecture

Use:

```text
Short-lived Access Token
Long-lived Refresh Token
```

Refresh tokens should support:

- Rotation
- Revocation
- Expiration
- Session/device tracking where appropriate

Prefer secure cookies for refresh tokens:

```text
HttpOnly
Secure
SameSite
```

---

# 66. RBAC Architecture

Roles:

```text
SUPER_ADMIN
ADMIN
ORDER_MANAGER
INVENTORY_MANAGER
CUSTOMER_SUPPORT
CONTENT_MANAGER
FINANCE_MANAGER
```

Authorization should be handled through middleware/guards.

Example:

```text
authenticate()
      ↓
authorize("ORDER_MANAGER")
      ↓
Controller
```

Users must never be able to assign themselves privileged roles.

---

# 67. Security Architecture

Mandatory protections:

- Input validation
- Authentication
- Authorization
- Rate limiting
- Helmet
- CORS allowlist
- Secure cookies
- SQL injection protection
- XSS protection
- Request size limits
- File validation
- Webhook signature validation
- Payment verification
- Audit logging
- Secret management

Sensitive data must not be logged.

---

# 68. Rate Limiting

Stricter limits should apply to:

```text
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/login
POST /orders
POST /payments
POST /reviews
```

Rate limiting should consider:

- IP
- Phone number
- User ID
- Endpoint

where appropriate.

---

# 69. Audit Logging

Admin and security-sensitive actions must be auditable.

Entity:

```text
AuditLog

id
userId
action
entity
entityId
oldValue
newValue
ip
userAgent
createdAt
```

Examples:

```text
Admin changed product price
Admin changed order status
Admin issued refund
Admin changed COD threshold
Admin suspended customer
```

---

# 70. Configuration Architecture

Configuration must be centralized.

```text
config/
├── env.ts
├── app.ts
├── database.ts
├── redis.ts
├── jwt.ts
├── payment.ts
├── courier.ts
└── storage.ts
```

Environment variables must be validated at application startup.

If required configuration is missing, the application should fail fast rather than running in an invalid state.

---

# 71. Environment Variables

Example:

```text
NODE_ENV
PORT
API_URL

DATABASE_URL
REDIS_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

CORS_ORIGINS

PAYMENT_PROVIDER_KEY
PAYMENT_PROVIDER_SECRET

COURIER_API_KEY
COURIER_API_SECRET

SMS_API_KEY
SMS_API_SECRET

EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASSWORD

STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
STORAGE_BUCKET
STORAGE_REGION
```

Secrets must never be committed to Git.

---

# 72. Observability

Use structured logging.

Track:

```text
Request ID
HTTP method
Route
Status code
Response time
User ID where available
Error code
Database errors
Queue failures
Payment failures
Courier failures
Webhook failures
Authentication failures
```

Production logs should use JSON/structured format.

---

# 73. Health Checks

Required endpoints:

```text
GET /health
GET /health/live
GET /health/ready
```

Readiness should verify required infrastructure such as:

```text
PostgreSQL
Redis
Queue system
```

Liveness should indicate whether the application process itself is running.

---

# 74. Analytics Architecture

Analytics should be derived from reliable business events/data.

### Order Analytics

```text
Total Orders
Completed Orders
Cancelled Orders
RTO Rate
Average Order Value
```

### Customer Analytics

```text
New Customers
Repeat Customers
Delivery Success
RTO Rate
Cancellation Rate
```

### Product Analytics

```text
Sales
Returns
RTO
Conversion
Stock Performance
```

### Courier Analytics

```text
Delivery Success Rate
RTO Rate
Average Delivery Time
Courier Failure Rate
```

---

# 75. Settlement Reconciliation

The backend should support expected vs actual settlement tracking.

Example:

```text
Expected COD Settlement
       ↓
Courier Settlement
       ↓
Compare
       ↓
Difference
       ↓
Finance Review
```

Payment and courier settlement differences must be traceable and auditable.

---

# 76. Recommendation Architecture

Initial recommendation engine should be rule-based.

Inputs:

```text
Child Age
Skill Goal
Budget
Interest
Category
Previous Purchases
```

Output:

```text
Recommended Products
Reason
```

Future versions may introduce AI/ML.

---

# 77. "Help Me Choose" Architecture

Endpoint:

```text
POST /api/v1/recommendations/help-me-choose
```

Input:

```text
childAge
interests
skillGoal
budget
preferredCategory
```

Output:

```text
recommendedProducts
reason
```

The initial implementation should be deterministic/rule-based.

---

# 78. Admin Architecture

Admin backend should provide:

### Product Management

```text
Create Product
Update Product
Archive Product
Manage Media
Manage Price
Manage Stock
```

### Order Management

```text
View Orders
Filter Orders
Verify Orders
Cancel Orders
Update Orders
Assign Courier
Track Shipment
```

### Customer Management

```text
View Customer
Order History
RTO History
Return History
Risk History
```

### Finance

```text
Payments
Refunds
Settlements
Reconciliation
```

### Risk

```text
Risk Scores
Risk Reasons
High-risk Orders
COD Configuration
```

---

# 79. Background Scheduled Jobs

The system should support scheduled jobs for:

```text
OTP expiration
Inventory reservation expiration
Unpaid order cancellation
Notification retry
Stale shipment detection
Payment reconciliation
Courier synchronization
Settlement reconciliation
Analytics processing
```

Scheduled jobs must be safe to retry.

---

# 80. API Documentation

Swagger/OpenAPI should be available at:

```text
/api/docs
```

Every endpoint should document:

- Authentication
- Authorization
- Request body
- Query parameters
- Path parameters
- Response
- Validation rules
- Error codes
- Example requests
- Example responses

---

# 81. Testing Architecture

## Unit Tests

Test:

```text
Risk Engine
Pricing
Coupon Rules
COD Rules
Inventory Rules
Order State Machine
Return Rules
Refund Rules
```

## Integration Tests

Test:

```text
PostgreSQL
Prisma
Redis
Authentication
Payment integration
Courier integration
Queues
```

## E2E Tests

Critical flow:

```text
Registration
 ↓
Login
 ↓
Browse
 ↓
Cart
 ↓
Checkout
 ↓
Order
 ↓
Risk
 ↓
Verification
 ↓
Payment/COD
 ↓
Shipment
 ↓
Delivery
 ↓
Review
```

Critical failure scenarios:

```text
Fake Order
RTO
Return
Refund
Payment Failure
Duplicate Order
Duplicate Webhook
Inventory Race Condition
Expired OTP
Invalid Order Transition
```

---

# 82. Docker Architecture

Development:

```text
Docker Compose
 ├── API
 ├── PostgreSQL
 ├── Redis
 └── Worker
```

Production:

```text
Load Balancer
      ↓
Express API Instances
      ↓
PostgreSQL
Redis
BullMQ Workers
Object Storage
External APIs
```

API and workers should be deployable independently.

---

# 83. CI/CD Architecture

Pipeline:

```text
Git Push
   ↓
Install Dependencies
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Docker Build
   ↓
Database Migration Check
   ↓
Deploy
```

Production deployment must handle Prisma migrations safely.

---

# 84. Deployment Principles

Production environment must provide:

- HTTPS
- Secure secrets
- Database backups
- Redis persistence where required
- Health checks
- Monitoring
- Error tracking
- Log aggregation
- Horizontal API scaling where needed
- Worker scaling where needed

---

# 85. Failure Handling

External integrations can fail.

Examples:

```text
Payment API unavailable
Courier API unavailable
SMS provider unavailable
Email provider unavailable
Redis temporarily unavailable
Queue worker failure
```

The backend should:

- Fail gracefully
- Retry safe operations
- Use timeouts
- Avoid infinite retries
- Record failures
- Provide meaningful error states
- Never duplicate financial operations

---

# 86. External Provider Abstraction

External providers must be hidden behind interfaces.

Example:

```text
PaymentProvider
CourierProvider
SmsProvider
EmailProvider
StorageProvider
```

Business logic should depend on the interface rather than provider-specific SDKs.

This makes provider replacement easier.

---

# 87. API Versioning Strategy

Current version:

```text
/api/v1
```

Breaking API changes should introduce:

```text
/api/v2
```

Do not silently break existing API contracts.

---

# 88. Data Privacy

The backend must minimize unnecessary storage of personal data.

Sensitive information must:

- Be protected
- Not be logged unnecessarily
- Not be exposed through APIs
- Be accessible only to authorized users

Payment card information must never be stored directly.

---

# 89. Performance Principles

Initial optimization priorities:

1. Correctness
2. Database consistency
3. Security
4. Maintainability
5. Observability
6. Performance optimization

Use caching only where it provides measurable benefit.

Do not prematurely optimize.

---

# 90. Scalability Strategy

Initial architecture:

```text
Modular Monolith
```

As traffic increases:

```text
Load Balancer
      ↓
Multiple API Instances
      ↓
Shared PostgreSQL
Shared Redis
      ↓
Multiple BullMQ Workers
```

Only extract microservices when justified.

Potential future extraction candidates:

```text
Notification Service
Payment Service
Recommendation Service
Analytics Service
Search Service
```

---

# 91. Non-Functional Requirements

The backend should target:

### Reliability

Critical operations must be transaction-safe.

### Security

Authentication, authorization and sensitive endpoint protection are mandatory.

### Maintainability

Modules must remain independently understandable.

### Observability

Important operations must be traceable.

### Scalability

The architecture should support horizontal API and worker scaling.

### Testability

Core business logic must be testable independently from Express.

### Recoverability

Database backups and failure recovery procedures must be considered before production deployment.

---

# 92. MVP Scope

MVP backend must include:

```text
Authentication
Users
Customers
Addresses

Products
Categories
Brands
Age Groups
Skills

Inventory

Cart
Checkout

Orders
COD
Basic Online Payment

Order Verification
Basic Risk Engine

Courier
Shipment Tracking
RTO

Basic Returns
Refunds

Notifications

Admin
Audit Logs

Swagger
Logging
Error Handling
Security
Testing
```

---

# 93. Development Phases

## Phase 1 — Foundation

```text
Express
TypeScript
Environment Configuration
PostgreSQL
Prisma
Redis

Authentication
Users
Customers
Addresses

Products
Categories
Brands
Age Groups
Skills

Inventory
```

---

## Phase 2 — Commerce

```text
Cart
Checkout
Pricing
Coupons
Orders
COD
Basic Payment
```

---

## Phase 3 — Bangladesh Commerce Intelligence

```text
Risk Engine
Order Verification
Smart COD
Courier Integration
Shipment Tracking
RTO
Customer Reputation
```

---

## Phase 4 — Post Purchase

```text
Returns
Return Evidence
Refunds
Reviews
Notifications
```

---

## Phase 5 — Business Intelligence

```text
Analytics
Courier Analytics
RTO Analytics
Return Analytics
Settlement Reconciliation
Recommendations
Product Health
```

---

## Phase 6 — AI

```text
RTO Prediction
Return Prediction
Fraud Detection
AI Product Recommendations
AI Customer Support
AI Business Insights
```

---

# 94. AI/ML Features Are Not MVP Dependencies

The backend must not depend on AI/ML services for basic ecommerce functionality.

The following must work without AI:

```text
Orders
Payments
COD
Inventory
Courier
Returns
Refunds
Risk Rules
Recommendations
```

AI can enhance these systems later.

---

# 95. Architecture Decision Records

Major architectural decisions should be documented.

Examples:

```text
ADR-001: Modular Monolith instead of Microservices
ADR-002: Express.js instead of NestJS
ADR-003: PostgreSQL as primary database
ADR-004: Prisma as ORM
ADR-005: Redis for caching and ephemeral data
ADR-006: BullMQ for asynchronous jobs
ADR-007: Provider abstraction for payments
ADR-008: Provider abstraction for couriers
ADR-009: Server-side payment verification
ADR-010: Idempotency for financial operations
```

---

# 96. AI Coding Agent Rules

AI coding agents such as Claude, Cursor, or ChatGPT must follow this architecture.

### Rule 1

Do not redesign the architecture without identifying a concrete requirement.

### Rule 2

Do not introduce microservices unless explicitly approved.

### Rule 3

Do not bypass service/domain layers.

### Rule 4

Do not place business logic directly inside controllers.

### Rule 5

Do not trust client-provided prices, totals, stock, payment status, roles, risk scores, or order status.

### Rule 6

Do not create circular module dependencies.

### Rule 7

Do not modify unrelated modules while implementing a feature.

### Rule 8

Do not remove existing security mechanisms to make an implementation easier.

### Rule 9

Use database transactions for critical multi-record operations.

### Rule 10

All external provider integrations must use the appropriate abstraction/interface.

### Rule 11

All new APIs must follow `/api/v1`.

### Rule 12

All new APIs must use the standard response/error format.

### Rule 13

All sensitive endpoints must have appropriate validation and rate limiting.

### Rule 14

Every important business rule must have automated tests.

### Rule 15

Before implementing a new module, inspect existing architecture and dependencies.

---

# 97. AI Agent Implementation Workflow

The AI coding agent must NOT build the entire backend in one step.

Recommended workflow:

```text
PRD
 ↓
Architecture
 ↓
ERD
 ↓
Prisma Schema
 ↓
API Specification
 ↓
Phase 1
 ↓
Testing
 ↓
Phase 2
 ↓
Testing
 ↓
Phase 3
 ↓
Testing
...
```

Before writing implementation code, the agent should analyze:

```text
1. Architecture
2. Module dependencies
3. Database relationships
4. API contracts
5. Security requirements
6. Transaction boundaries
7. External integrations
8. Testing requirements
```

---

# 98. Recommended AI Architecture Review Prompt

Use the following prompt before implementation:

```text
Analyze the KiddyBD Backend Architecture Specification.

Do not write implementation code yet.

Verify:

1. Module dependency graph
2. Circular dependency risks
3. Database entity relationships
4. Transaction boundaries
5. Inventory concurrency strategy
6. Order state machine
7. Payment architecture
8. Courier architecture
9. Idempotency strategy
10. Redis strategy
11. BullMQ architecture
12. Authentication and authorization
13. Security architecture
14. Error handling
15. API consistency
16. Testing strategy
17. Scalability risks

Identify missing requirements, contradictions, security vulnerabilities, data consistency problems, and unnecessary complexity.

Do not redesign the architecture without explaining the reason.

Return a structured architecture review.

Do not write implementation code.
```

---

# 99. Recommended AI Implementation Prompt

After architecture approval:

```text
Implement Phase 1 of the approved KiddyBD Backend Architecture.

Technology:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma
- Redis
- Zod

Rules:

1. Follow architecture.md exactly.
2. Implement Phase 1 only.
3. Do not implement future phases.
4. Do not introduce microservices.
5. Do not create circular dependencies.
6. Keep controllers thin.
7. Keep business logic inside services/domain logic.
8. Use Prisma for database access.
9. Validate all environment variables.
10. Implement centralized error handling.
11. Implement structured logging.
12. Implement security middleware.
13. Write tests for implemented functionality.
14. Do not modify unrelated files.
15. Inspect the existing repository before making changes.

Before coding:

- Inspect repository structure.
- Identify existing conventions.
- Explain the implementation plan.
- Identify files that will be created or modified.

Then implement the approved plan.
```

---

# 100. Final Architecture Principle

KiddyBD backend should be built around the following principle:

```text
                    TRUST NOTHING
                         │
                         ▼
              SERVER VALIDATES EVERYTHING
                         │
                         ▼
             BUSINESS RULES ARE CENTRALIZED
                         │
                         ▼
             CRITICAL OPERATIONS ARE ATOMIC
                         │
                         ▼
             EXTERNAL SERVICES ARE ABSTRACTED
                         │
                         ▼
                EVENTS ARE ASYNCHRONOUS
                         │
                         ▼
                 EVERYTHING IMPORTANT
                    IS TRACEABLE
```

The core ecommerce flow is:

```text
Customer
   ↓
Product Discovery
   ↓
Cart
   ↓
Checkout
   ↓
Server Validation
   ↓
Risk Assessment
   ↓
COD / Payment Decision
   ↓
Order Creation
   ↓
Inventory Reservation
   ↓
Verification
   ↓
Order Confirmation
   ↓
Courier
   ↓
Shipment
   ↓
Delivery
   ├── Review
   └── Return → Refund

If Delivery Fails
   ↓
RTO
   ↓
Customer / Product / Courier Analytics
```

The architecture should prioritize:

**Correctness → Security → Data Consistency → Maintainability → Observability → Scalability → Advanced Intelligence**

KiddyBD should start as a well-structured modular monolith and evolve based on actual business and technical requirements rather than introducing complexity prematurely.

# 83. Architecture Refinements & Fixes

Based on architectural review, the following critical adjustments are mandated:

## 83.1 Missing Modules
- **Settings/Configuration Module**: Manages dynamic COD rules, risk thresholds, and business toggles.
- **Media/File Management Module**: Manages signed URLs, file metadata, and constraints.
- **Tax Module**: Calculates and tracks VAT/Tax during pricing and checkout.
- **Content/Blog Module**: Manages SEO content, tags, and articles for parent education.

## 83.2 Dependency Rules
- **Orders to Risk**: Risk module must read from Orders (via repository/DB) to avoid circular dependencies (Checkout -> Orders, Orders -> Checkout validation). Orders module calls RiskService, but Risk doesn't call OrderService directly for historical checks.
- **Refunds**: Orders module must directly trigger Refunds (via Event Bus or Service) for pre-shipping cancellations.

## 83.3 Database Refinements
- **Address Snapshots**: shippingAddressSnapshot and illingAddressSnapshot inside the Order table must be typed as JSONB.
- **Precision**: Price and Total fields must use Decimal (PostgreSQL NUMERIC) instead of floats.
- **Return Quantities**: OrderItem must include a eturnedQuantity field to correctly track partial and repeated returns and prevent double returns.

## 83.4 Security & Protections
- **CSRF Protection**: The Refresh Token endpoint must enforce CSRF protection since tokens are stored in HttpOnly cookies.
- **Signed URL Safety**: Upload generation must strictly limit ileType and maxSize to prevent abuse, and uploads must be tied to the specific user/order context.
- **OTP Abuse**: Redis rate limiting for OTPs must key on BOTH IP and PhoneNumber.

## 83.5 Scalability & Infrastructure
- **Database Connection Pooling**: A connection pooler (e.g., PgBouncer or Prisma Accelerate) is strictly required for production to prevent connection exhaustion.
- **Redis Separation**: Caching/Sessions and BullMQ/Locks must be placed on separate logical Redis databases (or separate instances) to prevent bottlenecking.
- **Inventory Expiry**: A BullMQ delayed job or Redis Keyspace notification is required to reliably trigger the release of expired InventoryReservation records.

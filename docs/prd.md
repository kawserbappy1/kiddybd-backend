KiddyBD — Backend Product Requirements & Technical Specification
Product Name: KiddyBD
Product Type: Kids Toys, Educational Toys & Brain Development Ecommerce
Target Market: Bangladesh
Architecture: Decoupled Frontend + Backend
Backend: Node.js + Express.js + TypeScript (MVC pattern) 
Database: PostgreSQL
ORM: Prisma
Cache: Redis
Queue: BullMQ
API Style: REST API
API Version: /api/v1
1. Product Vision
KiddyBD is a Bangladesh-focused ecommerce platform specializing in:
- Kids Toys
- Educational Toys
- Brain Development Products
- Learning Kits
- Creativity Products
- STEM Products
- Age-based Learning Products
The backend should not behave like a basic CRUD ecommerce API.
It should be designed around two major goals:
Customer Goal
Help parents find:
The Right Product → For the Right Age → For the Right Skill → From a Trusted Source

Business Goal
Reduce:
- Fake orders
- COD abuse
- Return-to-Origin (RTO)
- Wrong addresses
- Customer cancellations
- Return fraud
- Inventory mismatch
- Courier issues
- Payment reconciliation problems
2. Core Business Proposition
KiddyBD should be more than a traditional toy store.
Core positioning
More Than a Toy Store — Smart Toys. Better Learning. Safer Shopping.

The platform should combine:
- Age-based product discovery
- Skill-based product discovery
- Educational product information
- Smart COD
- Order verification
- Customer risk scoring
- Customer reputation
- RTO analytics
- Return analytics
- Courier intelligence
- Parent recommendations
3. Backend Architecture
The backend will use a Modular Monolith Architecture.
Do NOT start with microservices.
Recommended stack
Technology	Purpose
Node.js	Runtime
Express.js	HTTP framework
TypeScript	Type safety
PostgreSQL	Primary database
Prisma	ORM
Redis	Cache, OTP, rate limiting, locks
BullMQ	Background jobs
JWT	Authentication
Zod / class-validator	Request validation
Swagger / OpenAPI	API documentation
Jest	Unit & integration testing
Docker	Containerization


High-level architecture
Frontend
   │
   ▼
Express.js REST API
   │
   ├── Authentication
   ├── Users
   ├── Products
   ├── Cart
   ├── Checkout
   ├── Orders
   ├── Risk Engine
   ├── Payments
   ├── Courier
   ├── Returns
   ├── Refunds
   ├── Reviews
   └── Admin
   │
   ▼
Service Layer
   │
   ├── PostgreSQL
   ├── Redis
   └── BullMQ
   │
   ▼
External Services
   ├── Payment Gateway
   ├── Courier Providers
   ├── SMS
   ├── Email
   └── Object Storage

4. Backend Folder Architecture
Use a feature/module-based architecture, not one giant controllers/services folder.
src/
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.validation.ts
│   │   └── auth.types.ts
│   │
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
│   ├── courier/
│   ├── sms/
│   ├── email/
│   └── storage/
│
├── database/
│   └── prisma/
│
├── queues/
│   ├── email.queue.ts
│   ├── sms.queue.ts
│   ├── order.queue.ts
│   ├── payment.queue.ts
│   ├── courier.queue.ts
│   └── analytics.queue.ts
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── rate-limit.middleware.ts
│   ├── validation.middleware.ts
│   └── request-id.middleware.ts
│
├── common/
│   ├── errors/
│   ├── constants/
│   ├── utils/
│   ├── types/
│   └── helpers/
│
├── config/
│   └── env.ts
│
├── app.ts
└── server.ts

5. Authentication & Authorization
Customer Authentication
Primary authentication method:
Phone Number + OTP
Optional:
- Email
- Google login in future
Authentication flow
Enter Phone
     ↓
Request OTP
     ↓
OTP sent
     ↓
Verify OTP
     ↓
Create/Login User
     ↓
Issue Access + Refresh Token

Admin Authentication
Admin should use:
- Email
- Password
- Optional MFA/2FA
Roles
SUPER_ADMIN
ADMIN
ORDER_MANAGER
INVENTORY_MANAGER
CUSTOMER_SUPPORT
CONTENT_MANAGER
FINANCE_MANAGER

Implement RBAC middleware.
Example:
authenticate()
      ↓
authorize("ORDER_MANAGER")
      ↓
Controller

6. Token Security
Use:
- Short-lived access token
- Long-lived refresh token
- Refresh token rotation
- Token revocation
Prefer:
HttpOnly
Secure
SameSite

cookies for refresh tokens where appropriate.
Never expose sensitive tokens unnecessarily to JavaScript.
7. User Module
User fields:
id
phone
email
name
status
role
phoneVerifiedAt
emailVerifiedAt
createdAt
updatedAt

Status:
ACTIVE
SUSPENDED
BLOCKED
DELETED

8. Customer Reputation System
The backend should maintain customer behavior statistics.
Example:
totalOrders
completedOrders
cancelledOrders
rtoOrders
returnedOrders
totalSpent
lastOrderAt
deliverySuccessRate
rtoRate
cancelRate
returnRate

These statistics can later be used by the risk engine.
Important:
Customer reputation should never be based on a single event.

9. Address Management
Customer address:
id
userId
name
phone
division
district
upazila
area
addressLine
landmark
postalCode
latitude
longitude
isDefault
validationStatus
createdAt
updatedAt

Validation status:
VALID
NEEDS_REVIEW
INCOMPLETE

Important rule
When an order is created, the backend must create an address snapshot.
Historical orders must not change if the customer edits their address later.
10. Product Module
Product fields:
id
name
slug
sku
description
shortDescription
brandId
categoryId
price
discountPrice
status
weight
dimensions
material
origin
createdAt
updatedAt

Status:
DRAFT
ACTIVE
OUT_OF_STOCK
ARCHIVED

11. Product Intelligence
Every product should support:
Age Groups
0–1
1–2
2–3
3–5
5–7
7–10
10+

Skills
Examples:
Memory
Creativity
Problem Solving
Fine Motor Skills
Concentration
Language
Math
Logical Thinking
STEM

Product ↔ Age Group should be many-to-many.
Product ↔ Skill should also be many-to-many.
12. Product Safety
Product should support:
recommendedAge
smallPartsWarning
chokingHazard
supervisionRequired
materialSafety
safetyInstructions

The backend should allow these fields to be displayed prominently on the frontend.
13. Product Media
ProductMedia

id
productId
type
url
altText
sortOrder
isPrimary
createdAt

Types:
IMAGE
VIDEO

For large image/video files, prefer direct/signed uploads to object storage rather than uploading large files through Express.
14. Inventory System
Inventory fields:
productId
variantId
quantity
reservedQuantity
availableQuantity
lowStockThreshold

Formula:
availableQuantity =
quantity - reservedQuantity

Inventory operations must use database transactions and appropriate locking.
The backend must prevent:
Two customers purchasing the last item at the same time.

15. Cart Module
Entities:
Cart
CartItem

Cart operations:
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id

Never trust cart totals sent from the frontend.
16. Checkout Module
Checkout must revalidate everything on the server.
Before creating an order:
Validate Customer
      ↓
Validate Products
      ↓
Validate Product Status
      ↓
Validate Stock
      ↓
Calculate Current Price
      ↓
Validate Coupon
      ↓
Calculate Delivery Charge
      ↓
Validate Payment Method
      ↓
Evaluate COD Rules
      ↓
Calculate Risk
      ↓
Create Order

The backend must never trust:
- frontend price
- frontend discount
- frontend stock
- frontend total
- frontend risk level
17. Order Module
Order fields:
id
orderNumber
customerId
status
paymentStatus
fulfillmentStatus

subtotal
discount
deliveryCharge
total
codAmount

shippingAddressSnapshot
billingAddressSnapshot

createdAt
updatedAt

18. Order State Machine
Primary order lifecycle:
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

Alternative states:
CANCELLED
RTO

The backend must explicitly define valid state transitions.
For example:
DELIVERED → PROCESSING

must be rejected.
19. Order Creation Flow
Customer
   ↓
POST /orders
   ↓
Validate Cart
   ↓
Validate Stock
   ↓
Calculate Price
   ↓
Validate Address
   ↓
Calculate Delivery
   ↓
Risk Assessment
   ↓
Payment/COD Decision
   ↓
Create Order
   ↓
Reserve Inventory
   ↓
Verification if required
   ↓
Confirm Order

20. Idempotency
Order and payment creation must support:
Idempotency-Key

This prevents duplicate orders caused by:
- Double-clicking
- Network retry
- Browser retry
- Mobile connection issues
- Frontend request duplication
Example:
POST /api/v1/orders
Idempotency-Key: abc123

The same key must not create multiple orders.
21. Fake Order & Risk Engine
KiddyBD should include a dedicated risk engine.
Module:
modules/risk/

Risk signals can include:
Phone history
Order history
RTO history
Cancellation history
Address history
Order value
Order frequency
Device signals
IP signals
Account age
Duplicate-account signals

Output:
riskScore
riskLevel
riskReasons
recommendedAction

Example:
{
  "riskScore": 82,
  "riskLevel": "HIGH",
  "riskReasons": [
    "High historical RTO rate",
    "New customer",
    "High-value COD order"
  ],
  "recommendedAction": "ADVANCE_PAYMENT"
}

Critical rule
Never mark a customer as fraudulent based on a single signal.
22. Risk Levels
Initial configurable levels:
0–29    LOW
30–69   MEDIUM
70–100  HIGH

Possible actions:
LOW
Normal COD

MEDIUM
OTP verification
SMS confirmation
Phone confirmation

HIGH
Advance payment
Manual verification
COD restriction

These thresholds must be configurable from admin settings.
Do not hardcode them throughout the application.
23. Risk Assessment History
Store every risk decision.
RiskAssessment

id
orderId
score
level
signals
reasons
action
createdAt

This is required for:
- Auditing
- Debugging
- Analytics
- Future ML models
- Business decision making
24. Order Verification
Verification methods:
OTP
SMS_LINK
MANUAL_CALL
ADVANCE_PAYMENT

Entity:
OrderVerification

id
orderId
type
status
attempts
expiresAt
verifiedAt
createdAt

Protection:
- OTP expiry
- Attempt limits
- Rate limiting
- Brute-force protection
- Resend cooldown
25. Smart COD
COD rules should be configurable.
Example:
minimumOrderAmount
maximumCODAmount
riskThreshold
advancePercentage
verificationRequired

Example business rule:
Risk < 30
→ Normal COD

Risk 30–70
→ OTP Verification

Risk > 70
→ 20% Advance Payment

These values must be configurable.
26. Payment Module
Create a payment-provider abstraction.
PaymentProvider

Possible providers:
bKash
Nagad
Card Gateway
Other providers

The system should not tightly couple business logic to one payment provider.
Example abstraction:
createPayment()
verifyPayment()
refundPayment()
handleWebhook()

27. Payment Flow
Create Order
      ↓
Create Payment
      ↓
Payment Gateway
      ↓
Customer Pays
      ↓
Gateway Webhook
      ↓
Verify Transaction
      ↓
Update Payment
      ↓
Confirm Order

Critical rule
The frontend payment success page is not authoritative.
The backend must verify payment using:
- Gateway webhook
- Server-side verification API
28. Payment Webhooks
Webhook processing must be:
- Idempotent
- Authenticated
- Signature verified
- Transaction verified
A duplicate webhook must not create duplicate payment records or change the order incorrectly.
29. Courier Integration
Create a common courier abstraction.
CourierProvider

Methods:
createShipment()
cancelShipment()
trackShipment()
getDeliveryStatus()
getRates()
getSettlement()

This allows multiple courier companies without rewriting order logic.
30. Shipment
Shipment fields:
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

31. Courier Webhooks
Endpoint:
POST /api/v1/webhooks/courier/:provider

Flow:
Courier Webhook
      ↓
Verify Signature
      ↓
Check Idempotency
      ↓
Map External Status
      ↓
Update Shipment
      ↓
Update Order
      ↓
Create Event
      ↓
Notify Customer

32. RTO Management
Create:
RTO

Fields:
id
orderId
shipmentId
reason
notes
createdAt

Reasons:
CUSTOMER_UNAVAILABLE
WRONG_ADDRESS
PHONE_UNREACHABLE
CUSTOMER_REFUSED
CUSTOMER_CANCELLED
COURIER_ISSUE
OTHER

RTO data should support analytics by:
- Customer
- Product
- Address
- Courier
- District
- Order value
- Time period
33. Return Management
Return entity:
id
orderId
customerId
reason
description
status
requestedAt
approvedAt
receivedAt

Statuses:
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
PICKUP_SCHEDULED
RECEIVED
QUALITY_CHECK
COMPLETED
CANCELLED

34. Return Evidence
Customers may be required to submit:
Images
Videos

Entity:
ReturnEvidence

id
returnId
type
url
createdAt

Types:
IMAGE
VIDEO

Evidence requirements can vary by return reason/category.
35. Refund Management
Refund entity:
id
returnId
orderId
amount
method
status
transactionId
processedAt

Statuses:
PENDING
PROCESSING
COMPLETED
FAILED

Refund state transitions must be controlled by the backend.
36. Customer Reviews
Only customers who purchased and received the product should be allowed to review it.
Review fields:
id
productId
customerId
orderId
rating
title
comment
verifiedPurchase
status
createdAt
updatedAt

Optional media:
ReviewImage

Admin moderation should be supported.
37. Wishlist
Endpoints:
GET    /api/v1/wishlist
POST   /api/v1/wishlist/:productId
DELETE /api/v1/wishlist/:productId

38. Coupons & Promotions
Coupon types:
PERCENTAGE
FIXED
FREE_DELIVERY

Rules can include:
minimumOrderAmount
maximumDiscount
productRestriction
categoryRestriction
usageLimit
perUserLimit
startDate
endDate

Coupon validation must happen server-side.
39. Notification System
Supported channels:
SMS
Email
Push Notification

Important events:
OTP
Order Created
Order Confirmed
Order Shipped
Out For Delivery
Delivered
Return Approved
Refund Completed

Notifications should generally be processed asynchronously.
40. Background Jobs
Use BullMQ.
Queues:
emailQueue
smsQueue
notificationQueue
orderQueue
paymentQueue
courierQueue
analyticsQueue

Background jobs should handle:
- Notifications
- OTP cleanup
- Abandoned cart processing
- Reservation expiry
- Payment reconciliation
- Courier synchronization
- Analytics processing
- Settlement reconciliation
41. Redis
Redis should be used for:
OTP
Rate limiting
Caching
Temporary checkout data
Distributed locks
Queue infrastructure
Token metadata where necessary

Example cache keys:
product:{slug}
product:{id}
category:{id}

Cache invalidation must happen whenever relevant product/category data changes.
42. Search
MVP search should use PostgreSQL.
Search fields:
Product Name
SKU
Category
Brand
Skill
Age Group

Use PostgreSQL full-text search and/or trigram search initially.
Later:
Elasticsearch / OpenSearch

can be introduced when search scale requires it.
43. API Structure
Base URL:
/api/v1

Example endpoints:
Auth
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh-token
POST /auth/logout

Products
GET /products
GET /products/:slug

Cart
GET /cart
POST /cart/items
PATCH /cart/items/:id
DELETE /cart/items/:id

Orders
POST /orders
GET /orders
GET /orders/:id
POST /orders/:id/verify
POST /orders/:id/cancel

Returns
POST /returns
GET /returns
GET /returns/:id

44. API Response Standard
All APIs should use a consistent structure.
Success
{
  "success": true,
  "message": "Order created successfully",
  "data": {},
  "meta": {}
}

Error
{
  "success": false,
  "message": "Unable to create order",
  "error": {
    "code": "ORDER_CREATION_FAILED",
    "details": []
  }
}

Use consistent machine-readable error codes.
Examples:
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
RESOURCE_NOT_FOUND
INSUFFICIENT_STOCK
ORDER_CREATION_FAILED
PAYMENT_FAILED
PAYMENT_VERIFICATION_FAILED
INVALID_ORDER_STATE
OTP_EXPIRED
OTP_TOO_MANY_ATTEMPTS
RISK_REVIEW_REQUIRED

45. Pagination
Default:
?page=1&limit=20

Response:
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

Cursor pagination can be introduced later for high-volume APIs.
46. Security Requirements
The backend must implement:
- Request validation
- Rate limiting
- Helmet/security headers
- CORS allowlist
- Authentication
- RBAC
- SQL injection protection
- XSS protection
- CSRF protection where applicable
- Audit logging
- Secure cookies
- Secret management
- Webhook signature verification
- Payment verification
- File type validation
- File size validation
Never store raw card information.
Use payment gateway tokenization.
47. Rate Limiting
Sensitive endpoints must have stricter limits.
Examples:
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/login
POST /orders
POST /payments
POST /reviews

Different endpoints may use different rate-limit policies.
48. Audit Logs
Admin actions should be auditable.
Entity:
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

Example:
Admin changed product price

should record:
Old Price: 1200
New Price: 999
Admin: user_id
IP: ...
Timestamp: ...

49. Observability
The backend should have structured logging.
Track:
Request latency
HTTP errors
Database performance
Queue failures
Payment failures
Courier failures
Webhook failures
Authentication failures

Health endpoints:
GET /health
GET /health/live
GET /health/ready

Health checks should cover:
Express API
PostgreSQL
Redis
Queue system

50. Database Requirements
Use PostgreSQL.
Requirements:
- Foreign keys
- Unique constraints
- Check constraints
- Transactions
- Proper indexes
- Soft deletion where appropriate
- Consistent ID strategy
Recommended:
UUID

or another consistent generated ID strategy.
51. Important Database Indexes
At minimum:
User.phone
User.email

Product.slug
Product.sku
Product.categoryId

Order.orderNumber
Order.customerId
Order.status
Order.createdAt

Shipment.trackingId

RiskAssessment.orderId

Return.orderId

Payment.orderId

Composite indexes should be added based on actual query patterns.
52. Transactional Consistency
Critical operations must use database transactions.
Especially:
Order creation
Inventory reservation
Payment updates
Shipment creation
Refund processing
Return completion

Example:
Create Order
+
Create Order Items
+
Reserve Inventory
+
Create Risk Assessment

should be handled atomically where appropriate.
53. Inventory Reservation
When an order is created:
Available Stock
      ↓
Reserve Stock

When order is cancelled/expired:
Reserved Stock
      ↓
Release Stock

The system must prevent:
Overselling
Race Conditions
Negative Inventory

54. Scheduled Jobs
The system should support scheduled/background jobs for:
OTP expiration
Abandoned reservation release
Unpaid order cancellation
Pending notification retry
Stale shipment detection
Settlement reconciliation
Analytics updates

55. Payment & Courier Reconciliation
KiddyBD should maintain expected vs actual settlement records.
Example:
Expected COD Settlement
        ↓
Courier Settlement
        ↓
Compare
        ↓
Difference Detected
        ↓
Finance/Admin Investigation

This is especially important for Bangladesh COD operations.
56. Admin Backend
Admin APIs should support:
Product Management
Create Product
Update Product
Archive Product
Manage Media
Manage Price
Manage Stock

Order Management
View Orders
Filter Orders
Update Order
Verify Orders
Cancel Orders
Assign Courier
Track Shipment

Customer Management
View Customer
View Order History
View RTO History
View Return History
View Risk History

Risk Management
View Risk Score
View Risk Reasons
Configure Thresholds
Review High-Risk Orders

Finance
Payment Records
Refunds
Courier Settlements
Reconciliation

57. Analytics
Backend analytics should provide:
Order Analytics
Total Orders
Completed Orders
Cancelled Orders
RTO Rate
Average Order Value

Customer Analytics
New Customers
Repeat Customers
Customer Retention
RTO Rate
Cancellation Rate

Product Analytics
Sales
Returns
RTO
Conversion
Stock Performance

Courier Analytics
Delivery Success Rate
RTO Rate
Average Delivery Time
Courier Failure Rate

58. Parent Recommendation Engine
Future recommendation system should support:
Child Age
Skill Goal
Budget
Interest
Product Type
Previous Purchases

Example:
Age: 5
Goal: Improve concentration
Budget: ৳1,000

Backend can return:
Recommended Products

A future AI recommendation engine can replace/extend this logic.
59. "Help Me Choose" Feature
Backend endpoint:
POST /api/v1/recommendations/help-me-choose

Input:
childAge
interests
skillGoal
budget
preferredCategory

Output:
recommendedProducts
reason
confidence

Initially rule-based.
AI can be introduced later.
60. Content / Blog Module
KiddyBD can include educational content for parents.
Examples:
Best Toys for 3-Year-Olds
How Educational Toys Help Children Learn
How to Choose Safe Toys
Screen-Free Activities for Kids

Backend should support:
Posts
Categories
Tags
Authors
SEO metadata
Slug
Featured image
PublishedAt
Status

61. File Upload Architecture
Do not use Express as the primary storage layer for large files.
Recommended:
Frontend
   ↓
Request Upload URL
   ↓
Backend
   ↓
Signed Upload URL
   ↓
Object Storage

Possible storage:
S3-compatible storage
Cloudflare R2
AWS S3

62. API Documentation
Use OpenAPI/Swagger.
Recommended endpoint:
/api/docs

Every endpoint should document:
- Authentication
- Request body
- Query parameters
- Response
- Error codes
- Validation rules
- Example payloads
63. Testing Strategy
Unit Tests
Test:
Risk Engine
Pricing
Coupon Logic
COD Rules
Inventory
Order State Transitions
Return Rules
Refund Rules

Integration Tests
Test:
Database
Authentication
Payment
Courier
Redis
Queue

E2E Tests
Critical flow:
Register
 ↓
Login
 ↓
Browse Products
 ↓
Add to Cart
 ↓
Checkout
 ↓
Create Order
 ↓
Risk Assessment
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

Also test:
Fake Order
RTO
Return
Refund
Payment Failure
Inventory Race Condition
Duplicate Order
Duplicate Webhook

64. Environment Variables
Example:
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

Secrets must never be committed to Git.
65. Docker & Deployment
The backend should be Docker-ready.
Development:
Docker
 ├── Express API
 ├── PostgreSQL
 └── Redis

Production:
Load Balancer
      ↓
Express API Instances
      ↓
PostgreSQL
Redis
BullMQ Workers
Object Storage
External APIs

The API server and workers can be deployed independently when needed.
66. CI/CD
Recommended pipeline:
Git Push
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
Docker Image
   ↓
Deploy

Production deployment should include database migration handling.
67. Backend Development Phases
Phase 1 — Foundation
Implement:
Express setup
TypeScript
Environment configuration
Database
Prisma
Authentication
Users
Customers
Addresses
Products
Categories
Age Groups
Skills
Inventory

Phase 2 — Commerce
Implement:
Cart
Checkout
Orders
Order Items
Pricing
Coupons
COD
Basic Payment

Phase 3 — Bangladesh Commerce Intelligence
Implement:
Risk Engine
Order Verification
Smart COD
Courier Integration
Shipment Tracking
RTO Management

Phase 4 — Post Purchase
Implement:
Returns
Return Evidence
Refunds
Reviews
Notifications

Phase 5 — Business Intelligence
Implement:
Customer Reputation
RTO Analytics
Return Analytics
Courier Analytics
Product Health
Recommendations
Settlement Reconciliation

Phase 6 — AI
Future:
RTO Prediction
Return Prediction
AI Product Recommendation
AI Customer Support
AI Business Insights
Fraud Detection Model

68. MVP Backend
The MVP must include:
Authentication
User
Customer
Address

Product
Category
Age Group
Skill

Inventory

Cart
Checkout

Order
COD
Basic Online Payment

Order Verification
Basic Risk Score

Courier
Shipment Tracking
RTO

Basic Return
Refund

Notification

Admin
Audit Log

Swagger
Logging
Error Handling
Security
Testing

Do not make advanced AI/ML features mandatory for MVP.
69. Core Backend Principle
The most important backend rule is:
NEVER TRUST THE CLIENT.

The backend must independently:
Calculate Price
Validate Stock
Validate Coupon
Calculate Delivery Charge
Validate Order Total
Verify Payment
Evaluate COD Eligibility
Calculate Risk
Validate Permissions
Validate Order State

Never accept from the frontend:
finalPrice
discount
riskScore
userRole
paymentStatus
orderStatus

as authoritative values.
70. Core Order Engine
The complete KiddyBD order lifecycle should look like:
Customer
   │
   ▼
Checkout
   │
   ▼
Server Validation
   │
   ├── Product
   ├── Price
   ├── Stock
   ├── Address
   └── Delivery
   │
   ▼
Risk Engine
   │
   ├── LOW
   │     ↓
   │   Normal COD
   │
   ├── MEDIUM
   │     ↓
   │   OTP Verification
   │
   └── HIGH
         ↓
   Advance Payment /
   Manual Verification
   │
   ▼
Order Confirmation
   │
   ▼
Inventory Reservation
   │
   ▼
Courier
   │
   ▼
Shipment
   │
   ├── Delivered
   │      ↓
   │    Review / Return
   │
   └── RTO
          ↓
      RTO Analytics

71. Important Engineering Rules for AI Coding Agents
When using Claude, ChatGPT, Cursor, or another coding agent, do not ask the AI to build the entire backend in one step.
First give it this PRD and ask it to analyze the architecture.
Use this instruction:
Analyze this KiddyBD Backend PRD.

Do NOT write implementation code yet.

First produce:

1. Backend architecture
2. Module dependency graph
3. Database ERD
4. Prisma schema proposal
5. REST API specification
6. Authentication architecture
7. Order state machine
8. Risk engine architecture
9. Payment provider abstraction
10. Courier provider abstraction
11. Redis key strategy
12. BullMQ queue architecture
13. Error handling architecture
14. Security architecture
15. Testing strategy
16. Development phases

Identify any architectural conflicts, missing requirements, scalability concerns, security issues, and data consistency risks.

Do not skip any requirement from the PRD.

Then review the architecture before asking the AI to write code.
72. Implementation Instruction
After approving the architecture, use:
Implement Phase 1 only.

Follow the approved architecture and PRD exactly.

Use:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma
- Redis
- Clean modular architecture

Do not implement future phases.

Do not introduce microservices.

Do not create unnecessary abstractions.

Use production-quality error handling, validation, logging, security and testing.

Every implementation decision must be consistent with the approved architecture.

Before modifying existing files, inspect the repository structure and existing code.

Do not overwrite working functionality without explaining why.

73. Final Technology Decision
For your current experience and KiddyBD's requirements, I would use:
Frontend
   ↓
REST API
   ↓
Node.js
   ↓
Express.js
   ↓
TypeScript
   ↓
Prisma
   ↓
PostgreSQL

        +
        
Redis
        +
        
BullMQ
        +
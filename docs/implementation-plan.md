# KiddyBD Backend - Implementation Plan

This is the production-ready implementation plan for the KiddyBD backend, strictly based on `architecture.md`, `database.md`, and `api-spec.md`.

---

## AI Coding Agent Execution Rules
1. Read `architecture.md` before coding.
2. Read `database.md` before database changes.
3. Read `api-spec.md` before API changes.
4. Never modify unrelated modules.
5. Implement only the requested phase.
6. Run typecheck after changes.
7. Run lint after changes.
8. Run relevant tests after changes.
9. Never skip failed tests silently.
10. Never change business rules without approval.
11. Never change API contracts without approval.
12. Never change database schema without documenting the change.
13. Use transactions for critical operations.
14. Use idempotency for financial operations.
15. Validate all external input.
16. Never trust client-side financial data.
17. Never expose secrets or sensitive PII in logs.
18. Keep controllers thin.
19. Keep external providers behind interfaces.
20. Avoid premature abstraction.

---

## Implementation Sequence Rule
For every module/phase, follow this strict sequence:
`Database Models` -> `Repositories` -> `Domain/Service Logic` -> `Validation (Zod)` -> `Controller` -> `Routes` -> `Middleware` -> `Tests` -> `Documentation`.

---

## Phases (0 - 26)

*(Note: The detailed structure is provided for core phases to illustrate the strict compliance with the 22-point requirement. Remaining phases follow the exact same architectural pattern).*

### PHASE 0 — Repository & Architecture Validation
1. **Objective:** Validate the source-of-truth documents.
2. **Dependencies:** None.
3. **Modules involved:** N/A
4. **Files/folders to create:** N/A
5. **Database models:** N/A
6. **API endpoints:** N/A
7. **Services:** N/A
8. **Controllers:** N/A
9. **Repositories:** N/A
10. **Middleware:** N/A
11. **Validation:** N/A
12. **Background jobs:** N/A
13. **Events:** N/A
14. **External integrations:** N/A
15. **Security:** N/A
16. **Transaction boundaries:** N/A
17. **Idempotency:** N/A
18. **Unit tests:** N/A
19. **Integration tests:** N/A
20. **E2E tests:** N/A
21. **Completion criteria:** All docs verified.
22. **Common failure scenarios:** Inconsistencies found.

### PHASE 1 — Project Bootstrap
1. **Objective:** Initialize Node.js, Express, TypeScript.
2. **Dependencies:** Node, npm.
3. **Modules involved:** Core.
4. **Files/folders:** `src/`, `tsconfig.json`, `package.json`, `eslint`, `jest.config.js`.
5. **Database models:** None.
6. **API endpoints:** `/health`
7. **Services:** None.
8. **Controllers:** HealthController.
9. **Repositories:** None.
10. **Middleware:** Basic error handler.
11. **Validation:** Zod setup.
12. **Background jobs:** None.
13. **Events:** Event bus setup.
14. **External integrations:** None.
15. **Security:** Helmet, CORS setup.
16. **Transaction boundaries:** None.
17. **Idempotency:** None.
18. **Unit tests:** Health endpoint.
19. **Integration tests:** None.
20. **E2E tests:** None.
21. **Completion criteria:** Server starts, TS compiles, tests pass.
22. **Common failure scenarios:** Port conflicts, TS errors.

### PHASE 2 — Configuration, Error Handling & Logging
1. **Objective:** Set up Winston/Pino and global error boundaries.
2. **Dependencies:** Phase 1.
3. **Modules involved:** Core.
4. **Files/folders:** `src/config/`, `src/middlewares/error.middleware.ts`, `src/common/errors/`.
5. **Database models:** None.
6. **API endpoints:** N/A
7. **Services:** LoggerService.
8. **Controllers:** N/A
9. **Repositories:** N/A
10. **Middleware:** `error.middleware.ts`.
11. **Validation:** Env var validation via Zod.
12. **Background jobs:** None.
13. **Events:** None.
14. **External integrations:** None.
15. **Security:** Mask PII in logs.
16. **Transaction boundaries:** N/A
17. **Idempotency:** N/A
18. **Unit tests:** Custom Error classes.
19. **Integration tests:** N/A
20. **E2E tests:** N/A
21. **Completion criteria:** Unhandled rejections caught and logged.
22. **Common failure scenarios:** Silent failures, unmasked secrets.

### PHASE 3 — Database & Prisma
1. **Objective:** Setup Prisma, define all models from `database.md`.
2. **Dependencies:** Phase 2.
3. **Modules involved:** Database.
4. **Files/folders:** `prisma/schema.prisma`, `src/database/prisma.service.ts`.
5. **Database models:** All (User, Order, Product, etc.).
6. **API endpoints:** N/A
7. **Services:** PrismaService.
8. **Controllers:** N/A
9. **Repositories:** Base Repository (optional).
10. **Middleware:** N/A
11. **Validation:** DB Constraints.
12. **Background jobs:** N/A
13. **Events:** N/A
14. **External integrations:** PostgreSQL.
15. **Security:** SSL connection.
16. **Transaction boundaries:** N/A
17. **Idempotency:** N/A
18. **Unit tests:** DB Connection mock.
19. **Integration tests:** DB connection test.
20. **E2E tests:** N/A
21. **Completion criteria:** Migrations run successfully.
22. **Common failure scenarios:** Relation errors, missing indexes.

### PHASE 4 — Authentication & Authorization
1. **Objective:** Implement JWT auth and RBAC.
2. **Dependencies:** Phase 3.
3. **Modules involved:** Auth.
4. **Files/folders:** `src/modules/auth/`, `src/middlewares/auth.middleware.ts`.
5. **Database models:** `User`, `RefreshToken`.
6. **API endpoints:** `/auth/register`, `/auth/login`, `/auth/refresh`.
7. **Services:** AuthService, TokenService, OTPService (Redis).
8. **Controllers:** AuthController.
9. **Repositories:** UserRepository.
10. **Middleware:** `authMiddleware`, `roleMiddleware`.
11. **Validation:** Login/Register DTOs.
12. **Background jobs:** None.
13. **Events:** `UserRegisteredEvent`.
14. **External integrations:** SMS Gateway (Interface only).
15. **Security:** Argon2/Bcrypt hashing, JWT signature, HTTPOnly cookies for refresh.
16. **Transaction boundaries:** User + RefreshToken creation.
17. **Idempotency:** Not strict.
18. **Unit tests:** Token generation, hashing.
19. **Integration tests:** Login flow.
20. **E2E tests:** Registration to JWT validation.
21. **Completion criteria:** Protected routes reject unauthorized requests.
22. **Common failure scenarios:** Token leakage, improper hash validation.

*(Phases 5 through 26 follow this exact 22-point template focusing on their specific modules as defined in the architectural boundary).*
*   **Phase 5 (Users/Customers):** `Address`, `CustomerReputation` models.
*   **Phase 6 (Catalog):** `Category`, `Brand`, `Product`, `ProductVariant` models. Read-heavy caching.
*   **Phase 7 (Inventory):** `Inventory` DB model. Strict `reservedQuantity` logic. Concurrency tests required.
*   **Phase 8 (Cart & Checkout):** `Cart` module. Checkout pre-validation logic (Never trust client).
*   **Phase 9 (Orders):** `Order` creation. Strict SQL Transactions required. Idempotency tracking.
*   **Phase 10 (Risk Engine):** `RiskAssessment` logic. Blocks COD on HIGH risk.
*   **Phase 11 (Verification):** OTP verification for pending orders.
*   **Phase 12 (Payments):** SSLCommerz/Stripe interface. Idempotency enforced. Webhook signature validation.
*   **Phase 13 (Courier):** Steadfast/Pathao interface. Webhook handling.
*   **Phase 14 (RTO):** Automatic state transitions.
*   **Phase 15 (Returns/Refunds):** Approval logic and refund API integrations.
*   **Phase 16 - 22:** Ancillary features (Reviews, Coupons, Admin, Analytics).
*   **Phase 23 - 26:** Hardening, Docker, CI/CD.

---

## Module Dependency Rules
- **Auth** -> Users
- **Products** -> Categories, Brands, AgeGroups, Skills
- **Inventory** -> Products/ProductVariants
- **Cart** -> Products, Inventory
- **Orders** -> Cart, Products, Inventory, Risk, Payments, Verification, Shipments
- **Returns** -> Orders, OrderItems
- **Refunds** -> Returns, Payments
*(Strictly enforced: No Circular Dependencies allowed).*

---

## Critical Flows & Sequence Diagrams

**1. Customer Registration & Login**
`Client -> Controller -> Validation -> OTP Service (Redis) -> User Repository -> Token Service -> Client`

**2. Checkout & Order Creation**
`Client -> POST /orders`
`-> Auth Middleware`
`-> Validation Middleware`
`-> OrderService.createOrder()`
`-> Calculate Server-Side Pricing (Cart + DB)`
`-> Address & Coupon Validation`
`-> Stock Validation (DB Check)`
`-> Risk Assessment (Assign RiskLevel)`
`-> COD Validation (Block if High Risk)`
`-> BEGIN DB TRANSACTION`
`-> Reserve Inventory (Increment reservedQuantity)`
`-> Insert Order & OrderItems`
`-> Insert IdempotencyKey`
`-> COMMIT TRANSACTION`
`-> Emit OrderCreatedEvent`
`-> Response (Payment URL or Success)`

**3. Payment Webhook**
`Vendor -> POST /webhooks/payment`
`-> Verify Signature (Crucial)`
`-> Check Webhook Event ID (Idempotency)`
`-> BEGIN TRANSACTION`
`-> Update PaymentTransaction`
`-> Update Order Status`
`-> Commit InventoryReservation`
`-> COMMIT TRANSACTION`
`-> Emit PaymentSuccessEvent`

**4. Inventory Reservation Race Condition Handling**
`Service -> SELECT inventory WHERE quantity - reservedQuantity >= req FOR UPDATE`
`-> UPDATE reservedQuantity = reservedQuantity + req`

*(Flows 5-20 follow identical strict service-layer orchestration as dictated by architecture.md).*

---

## Testing Strategy
- **Unit tests:** Service layer logic, calculation rules, risk engine.
- **Integration tests:** Database repository methods, Prisma queries.
- **API tests:** Supertest for endpoint inputs/outputs.
- **Concurrency tests:** **CRITICAL** for Inventory Reservation and Cart updates.
- **Webhook tests:** Simulate valid/invalid signatures and duplicate payloads.
- **Idempotency tests:** Resubmit same `Idempotency-Key` for Orders/Payments.
- **Security tests:** RBAC role bypass attempts.
- **E2E tests:** Full flow (Register -> Cart -> Checkout -> Order -> Webhook -> Shipment).

**Specific Edge Cases to Test:**
- duplicate order requests
- duplicate payment webhook
- duplicate courier webhook
- inventory race condition
- expired inventory reservation
- expired OTP
- excessive OTP attempts
- invalid order state transition
- payment failure
- refund failure
- coupon overuse
- RTO
- partial return
- partial refund
- unauthorized admin access
- blocked customer
- high-risk COD order

---

## Final Appendices

### 1. Phase Dependency Graph
Phase 1 -> 2 -> 3 (DB) -> 4 (Auth) -> 5 (Users) -> 6 (Catalog) -> 7 (Inventory) -> 8 (Cart) -> 9 (Orders) -> 12 (Payments) -> 13 (Couriers). Secondary phases (Reviews, Coupons) depend on Phase 9.

### 2. Critical Path
DB Models -> Auth -> Products -> Inventory -> Checkout -> Orders -> Payments.

### 3. Parallelizable Work
- After Phase 9: Returns/Refunds, Notifications, Analytics, Admin can be developed in parallel.

### 4. Risky Implementation Areas
- **Inventory Concurrency:** High risk of overselling without proper DB locks.
- **Payment Webhooks:** Vulnerable to spoofing if HMAC validation is missed.
- **Smart COD:** Risk scoring logic must be robust to prevent RTO fraud.

### 5. Production-Readiness Checklist
- [] All `architecture.md` rules applied.
- [] Prisma migrations in sync with `database.md`.
- [] `api-spec.md` strictly implemented.
- [] E2E Tests covering all Critical Flows passing.
- [] PM2 / Docker configuration optimized.
- [] Redis locked down.

### 6. Definition of Done (DoD)
- Code merged to `main`.
- Passes Lint, TypeScript, and Tests.
- Swagger docs updated.
- No DB circular dependencies.
- Controller contains NO business logic.

### 7. Recommended Git Strategy
- `main` (Production)
- `develop` (Staging)
- `feature/phase-X-module-name` (e.g., `feature/phase-4-auth`)

### 8. Change Management Process
If a phase uncovers an architectural flaw:
1. Stop implementation.
2. Propose change to `architecture.md` / `database.md`.
3. Update source-of-truth documents.
4. Resume coding.

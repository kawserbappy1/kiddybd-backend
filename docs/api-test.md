# KiddyBD API Postman Test Guide

This guide contains the list of API endpoints for KiddyBD. You can copy the URLs and HTTP methods to test them in Postman.

**Base URL**: `http://localhost:5000/api/v1`

---

## 🔐 Auth (`/auth`)
*Endpoints for authentication, login, and registration.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| POST | `/auth/phone/send-otp` | `{ "phone": "+8801700000000" }` | Send OTP for login/register |
| POST | `/auth/phone/verify-otp` | `{ "phone": "+8801700000000", "otp": "123456" }` | Verify OTP and get token |
| POST | `/auth/email/send-otp` | `{ "email": "test@example.com" }` | Send Email OTP |
| POST | `/auth/email/verify-otp` | `{ "email": "test@example.com", "otp": "123456" }` | Verify Email OTP |
| GET | `/auth/google` | - | Initiate Google Auth |
| POST | `/auth/admin/login` | `{ "email": "admin@kiddybd.com", "password": "password" }` | Admin Login |
| POST | `/auth/refresh-token` | `{ "refreshToken": "..." }` | Get new access token |
| POST | `/auth/logout` | - | Logout |

---

## 👤 Users (`/users`)
*Requires Bearer Token in `Authorization` header.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/users/profile` | - | Get logged in user profile |
| PATCH | `/users/profile` | `{ "name": "John Doe", "email": "..." }` | Update user profile |
| GET | `/users/addresses` | - | List user addresses |
| POST | `/users/addresses` | `{ "street": "...", "city": "Dhaka", ... }` | Add new address |
| PATCH | `/users/addresses/:id` | `{ "isDefault": true }` | Update an address |
| DELETE| `/users/addresses/:id` | - | Delete an address |

---

## 🛒 Catalog (`/`)
*Publicly accessible product APIs.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/products` | Query: `?page=1&limit=10&category=...` | List all products |
| GET | `/products/:slug` | - | Get product details by slug |
| GET | `/categories` | - | Get all categories |
| GET | `/brands` | - | Get all brands |
| GET | `/age-groups` | - | Get age groups |
| GET | `/skills` | - | Get skills/development tags |

*Admin Catalog APIs (Requires Admin Token)*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| POST | `/admin/products` | `{ "name": "...", "description": "...", ... }` | Create new product |
| PATCH | `/admin/products/:id` | `{ "price": 100 }` | Update product |
| DELETE| `/admin/products/:id` | - | Archive product |
| POST | `/admin/products/:id/variants`| `{ "sku": "...", "price": 100 }` | Add product variant |

---

## 🛍️ Cart (`/cart`)
*Requires Bearer Token.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/cart` | - | Get current cart |
| POST | `/cart/items` | `{ "variantId": "...", "quantity": 1 }` | Add item to cart |
| PATCH | `/cart/items/:id` | `{ "quantity": 2 }` | Update cart item quantity |
| DELETE| `/cart/items/:id` | - | Remove item from cart |
| DELETE| `/cart` | - | Clear entire cart |

---

## 📦 Orders (`/orders`)
*Requires Bearer Token.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| POST | `/orders` | `{ "shippingAddressId": "...", "paymentMethod": "..." }` | Place a new order |
| GET | `/orders` | Query: `?page=1&limit=10` | List my orders |
| GET | `/orders/:id` | - | Get order details |
| POST | `/orders/:id/cancel` | `{ "reason": "..." }` | Cancel an order |
| POST | `/orders/:id/verify-payment`| `{ "transactionId": "..." }` | Verify order payment |

---

## ❤️ Wishlist (`/wishlist`)
*Requires Bearer Token.*

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/wishlist` | - | Get user wishlist |
| POST | `/wishlist/:productId` | - | Add product to wishlist |
| DELETE| `/wishlist/:productId` | - | Remove from wishlist |

---

## 💳 Payments (`/payments`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| POST | `/payments/initiate` | `{ "orderId": "..." }` | Initiate payment for order |
| POST | `/webhooks/payment/:provider`| *Payload from provider* | Payment gateway webhook |

---

## 🚚 Courier & Shipments (`/shipments`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/shipments/:id` | - | Track shipment |
| POST | `/admin/shipments/:orderId/create`| `{ "provider": "steadfast" }` | Admin: Create shipment |
| POST | `/webhooks/courier/:provider`| *Payload from provider* | Courier webhook tracking |

---

## 🎟️ Coupons & Promotions (`/`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/promotions` | - | Get active promotions |
| POST | `/coupons/validate` | `{ "code": "SUMMER10", "cartId": "..." }` | Validate a coupon |

---

## ↩️ Returns & RTO (`/`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| POST | `/returns` | `{ "orderId": "...", "reason": "..." }` | Request order return |
| GET | `/returns` | - | Get return requests |
| GET | `/admin/rto/pending` | - | Admin: Get pending RTOs |

---

## ⭐ Reviews (`/`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/products/:id/reviews` | - | Get product reviews |
| POST | `/reviews` | `{ "productId": "...", "rating": 5, "comment": "..."}` | Submit a review |

---

## 📊 Analytics & Risk (Admin)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/admin/analytics/orders` | Query: `?range=7d` | Order analytics |
| GET | `/admin/analytics/customers` | Query: `?range=7d` | Customer analytics |
| GET | `/admin/analytics/products` | Query: `?range=7d` | Product analytics |
| GET | `/admin/risk/customers` | - | Risk evaluation for customers |

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/notifications` | - | Get user notifications |
| PATCH | `/notifications/:id/read` | - | Mark notification as read |

---

## 💚 Health Check (`/health`)

| Method | Endpoint | Body/Params | Description |
|---|---|---|---|
| GET | `/health` | - | System Health Check |
| GET | `/health/live` | - | Liveness Probe |
| GET | `/health/ready` | - | Readiness Probe |

---

### Tips for Postman:
1. First, call **POST `/auth/phone/send-otp`** and **POST `/auth/phone/verify-otp`**.
2. From the response, copy the `accessToken`.
3. In Postman, go to your Collection or Request > **Authorization** tab.
4. Select **Type: Bearer Token** and paste the token there.
5. All endpoints marked as requiring a token will now work!

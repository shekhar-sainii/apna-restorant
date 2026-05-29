# 02 — Low-Level Design (LLD)

> MongoDB Schemas, API Contracts, Socket Events, Business Rules

---

## 1. MongoDB Collections & Schemas

### 1.1 users

```js
{
  _id: ObjectId,
  name: String,                    // required
  email: String,                   // unique, required
  phone: String,                   // unique, required
  password: String,                // bcrypt hashed
  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user"
  },
  isActive: Boolean,               // default: true
  profileImage: String,            // Cloudinary URL
  refreshToken: String,            // hashed refresh token
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ email: 1 }  unique
{ phone: 1 }  unique
{ role: 1 }
```

### 1.2 guestSessions

```js
{
  _id: ObjectId,
  guestSessionId: String,          // UUID v4, unique
  tableNumber: Number,             // null if delivery
  cartSnapshot: Array,             // items at time of order
  ipAddress: String,
  expiresAt: Date,                 // TTL: 24 hours
  createdAt: Date
}

// Indexes
{ guestSessionId: 1 }  unique
{ expiresAt: 1 }  TTL index → auto-delete after 24h
```

### 1.3 categories

```js
{
  _id: ObjectId,
  name: String,                    // "Starters", "Main Course"
  slug: String,                    // "starters", "main-course"
  image: String,                   // Cloudinary URL
  sortOrder: Number,               // display order
  isActive: Boolean,               // default: true
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ slug: 1 }  unique
{ isActive: 1, sortOrder: 1 }
```

### 1.4 menuItems

```js
{
  _id: ObjectId,
  name: String,                    // required
  description: String,
  price: Number,                   // in rupees, required
  image: String,                   // Cloudinary URL
  category: ObjectId,              // ref: categories
  isVeg: Boolean,                  // true = veg, false = non-veg
  isAvailable: Boolean,            // toggle on/off
  preparationTime: Number,         // in minutes
  rating: {
    average: Number,               // 0-5
    count: Number                  // total ratings
  },
  tags: [String],                  // ["spicy", "bestseller"]
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ category: 1, isAvailable: 1 }
{ isAvailable: 1 }
{ name: "text", description: "text" }  // text search
```

### 1.5 coupons

```js
{
  _id: ObjectId,
  code: String,                    // "SAVE10", unique uppercase
  type: {
    type: String,
    enum: ["percentage", "flat"]
  },
  value: Number,                   // 10 = 10% or ₹10
  minOrderAmount: Number,          // min cart value to apply
  maxDiscount: Number,             // max discount cap (for %)
  usageLimit: Number,              // total uses allowed
  usedCount: Number,               // default: 0
  isActive: Boolean,
  expiresAt: Date,
  createdAt: Date
}

// Indexes
{ code: 1 }  unique
{ isActive: 1, expiresAt: 1 }
```

### 1.6 orders

```js
{
  _id: ObjectId,
  orderNumber: String,             // "ORD-2024-0001" auto-generated
  
  // Customer info
  customer: ObjectId,              // ref: users (null if guest)
  guestSessionId: String,         // if guest order
  guestName: String,               // optional, guest can provide
  guestPhone: String,              // for delivery, required
  
  // Order items
  items: [{
    menuItem: ObjectId,            // ref: menuItems
    name: String,                  // snapshot at order time
    price: Number,                 // snapshot at order time
    quantity: Number,
    subtotal: Number               // price * quantity
  }],
  
  // Order type
  orderType: {
    type: String,
    enum: ["dine-in", "delivery", "takeaway"]
  },
  tableNumber: Number,             // for dine-in
  
  // Delivery address
  deliveryAddress: {
    line1: String,
    line2: String,
    landmark: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Pricing
  subtotal: Number,                // sum of items
  gstAmount: Number,              // 5% of subtotal
  gstPercent: Number,             // default: 5
  deliveryCharge: Number,         // 0 for dine-in
  discountAmount: Number,         // from coupon
  couponCode: String,
  totalAmount: Number,            // final payable
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ["cash", "online"]
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  
  // Order status
  status: {
    type: String,
    enum: [
      "pending",          // just placed
      "accepted",         // staff accepted
      "preparing",        // kitchen started
      "ready",            // food ready
      "out_for_delivery", // on the way (delivery only)
      "delivered",        // completed
      "cancelled"
    ],
    default: "pending"
  },
  
  // Status history
  statusHistory: [{
    status: String,
    updatedBy: ObjectId,           // ref: users
    updatedAt: Date,
    note: String                   // optional
  }],
  
  // Staff
  assignedStaff: ObjectId,        // ref: users (staff role)
  
  // Flags
  isGuestOrder: Boolean,
  specialInstructions: String,
  
  estimatedDeliveryTime: Date,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ orderNumber: 1 }  unique
{ customer: 1, createdAt: -1 }
{ guestSessionId: 1 }
{ status: 1, createdAt: -1 }
{ assignedStaff: 1, status: 1 }
{ createdAt: -1 }               // for analytics
```

### 1.7 payments

```js
{
  _id: ObjectId,
  order: ObjectId,                 // ref: orders
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,                  // in paise
  currency: String,               // "INR"
  status: {
    type: String,
    enum: ["created", "authorized", "captured", "failed", "refunded"]
  },
  method: String,                  // "upi", "card", "netbanking"
  webhookPayload: Object,         // raw webhook data
  verifiedAt: Date,
  createdAt: Date
}

// Indexes
{ razorpayOrderId: 1 }  unique
{ order: 1 }
```

### 1.8 addresses

```js
{
  _id: ObjectId,
  user: ObjectId,                  // ref: users
  label: String,                   // "Home", "Work"
  line1: String,
  line2: String,
  landmark: String,
  city: String,
  pincode: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  isDefault: Boolean,
  createdAt: Date
}

// Indexes
{ user: 1 }
```

### 1.9 notifications

```js
{
  _id: ObjectId,
  recipient: ObjectId,             // ref: users
  recipientRole: String,          // "admin", "staff", "user"
  type: {
    type: String,
    enum: [
      "new_order", "order_accepted", "order_preparing",
      "order_ready", "order_out_for_delivery", "order_delivered",
      "order_cancelled", "payment_success", "payment_failed"
    ]
  },
  title: String,
  message: String,
  order: ObjectId,                 // ref: orders
  isRead: Boolean,                 // default: false
  createdAt: Date
}

// Indexes
{ recipient: 1, isRead: 1, createdAt: -1 }
{ recipientRole: 1, isRead: 1 }
```

### 1.10 restaurantSettings

```js
{
  _id: ObjectId,
  restaurantName: String,
  logo: String,                    // Cloudinary URL
  address: String,
  phone: String,
  email: String,
  gstPercent: Number,             // default: 5
  deliveryRadius: Number,         // in km, default: 5
  deliveryCharge: Number,         // flat rate
  freeDeliveryAbove: Number,      // 0 = no free delivery
  isOpen: Boolean,                 // toggle restaurant open/closed
  openTime: String,               // "09:00"
  closeTime: String,              // "23:00"
  upiId: String,                  // for static QR
  tableCount: Number,             // how many tables have QR
  razorpayKeyId: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. API Contract (REST)

### Base URL: `/api/v1`

### 2.1 Auth Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | No | - | Register new user |
| POST | `/auth/login` | No | - | Login → JWT |
| POST | `/auth/refresh` | No | - | Get new access token |
| POST | `/auth/logout` | Yes | Any | Invalidate refresh token |
| GET | `/auth/me` | Yes | Any | Get current user |

**POST /auth/login response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 2.2 Menu Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/menu/categories` | No | - | List all active categories |
| POST | `/menu/categories` | Yes | Admin | Create category |
| PATCH | `/menu/categories/:id` | Yes | Admin | Update category |
| DELETE | `/menu/categories/:id` | Yes | Admin | Delete category |
| GET | `/menu/items` | No | - | List items (filter by category) |
| GET | `/menu/items/:id` | No | - | Single item |
| POST | `/menu/items` | Yes | Admin | Create item (multipart) |
| PATCH | `/menu/items/:id` | Yes | Admin | Update item |
| DELETE | `/menu/items/:id` | Yes | Admin | Delete item |
| PATCH | `/menu/items/:id/toggle` | Yes | Admin | Toggle availability |

**GET /menu/items query params:**
```
?category=starters&isVeg=true&search=paneer&page=1&limit=20
```

### 2.3 Order Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/orders` | No | Any | Create order (guest or user) |
| GET | `/orders` | Yes | Admin | List all orders |
| GET | `/orders/my` | Yes | User | My order history |
| GET | `/orders/staff` | Yes | Staff | Assigned/active orders |
| GET | `/orders/:id` | No* | Any | Order details (*guestSessionId in body/query) |
| PATCH | `/orders/:id/status` | Yes | Staff/Admin | Update order status |
| PATCH | `/orders/:id/cancel` | Yes | Any | Cancel order |
| PATCH | `/orders/:id/assign` | Yes | Admin | Assign staff to order |

**POST /orders body:**
```json
{
  "items": [
    { "menuItemId": "abc123", "quantity": 2 }
  ],
  "orderType": "delivery",
  "deliveryAddress": { "line1": "...", "pincode": "160001" },
  "paymentMethod": "online",
  "couponCode": "SAVE10",
  "guestSessionId": "uuid-here",
  "guestPhone": "9876543210",
  "tableNumber": null,
  "specialInstructions": "Less spicy"
}
```

**PATCH /orders/:id/status body:**
```json
{
  "status": "preparing",
  "note": "Started cooking"
}
```

### 2.4 Payment Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/payments/create-order` | No | Any | Create Razorpay order |
| POST | `/payments/verify` | No | Any | Verify payment signature |
| POST | `/payments/webhook` | No | - | Razorpay webhook (HMAC verified) |
| GET | `/payments/order/:orderId` | Yes | Admin | Payment details for order |

**POST /payments/create-order body:**
```json
{
  "orderId": "mongo_order_id"
}
```

**POST /payments/create-order response:**
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_xxx",
    "amount": 34500,
    "currency": "INR",
    "keyId": "rzp_live_xxx"
  }
}
```

### 2.5 User Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users/profile` | Yes | User | Get profile |
| PATCH | `/users/profile` | Yes | User | Update profile |
| GET | `/users/addresses` | Yes | User | List addresses |
| POST | `/users/addresses` | Yes | User | Add address |
| PATCH | `/users/addresses/:id` | Yes | User | Update address |
| DELETE | `/users/addresses/:id` | Yes | User | Delete address |
| GET | `/users` | Yes | Admin | List all users |
| PATCH | `/users/:id/status` | Yes | Admin | Activate/deactivate |

### 2.6 Coupon Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/coupons/apply` | No | Any | Validate & apply coupon |
| GET | `/coupons` | Yes | Admin | List all coupons |
| POST | `/coupons` | Yes | Admin | Create coupon |
| PATCH | `/coupons/:id` | Yes | Admin | Update coupon |
| DELETE | `/coupons/:id` | Yes | Admin | Delete coupon |

### 2.7 Analytics Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/analytics/dashboard` | Yes | Admin | Summary cards |
| GET | `/analytics/sales` | Yes | Admin | Sales chart data |
| GET | `/analytics/top-items` | Yes | Admin | Top selling items |
| GET | `/analytics/revenue` | Yes | Admin | Revenue breakdown |

### 2.8 Notification Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/notifications` | Yes | Any | My notifications |
| PATCH | `/notifications/:id/read` | Yes | Any | Mark as read |
| PATCH | `/notifications/read-all` | Yes | Any | Mark all as read |

---

## 3. Socket.IO Events

### Connection Auth

```js
// Client connects with token
const socket = io(SERVER_URL, {
  auth: { token: accessToken }    // null for guest
});
```

### Event Definitions

#### Server → Client (Emits)

| Event | Room | Payload | Who Receives |
|-------|------|---------|-------------|
| `new-order` | `admin-room`, `staff-room` | `{ order }` | Admin + Staff |
| `order-status-updated` | `order:{orderId}`, `admin-room` | `{ orderId, status, updatedAt }` | Customer + Admin |
| `payment-success` | `order:{orderId}`, `admin-room` | `{ orderId, paymentId }` | Customer + Admin |
| `payment-failed` | `order:{orderId}` | `{ orderId, reason }` | Customer |
| `order-assigned` | `staff-room` | `{ orderId, staffId }` | All staff |
| `notification` | user socket | `{ notification }` | Individual user |

#### Client → Server (Listens)

| Event | Auth | Payload | Action |
|-------|------|---------|--------|
| `join-order-room` | No | `{ orderId, guestSessionId? }` | Subscribe to order updates |
| `leave-order-room` | No | `{ orderId }` | Unsubscribe |
| `join-admin-room` | Admin | - | Subscribe to admin events |
| `join-staff-room` | Staff | - | Subscribe to staff events |

---

## 4. Standard API Response Format

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## 5. Business Rules

### Pricing Calculation

```
subtotal     = sum(item.price * item.quantity)
gstAmount    = subtotal * (gstPercent / 100)     → rounded to 2 decimal
deliveryChg  = orderType === 'delivery' ? settings.deliveryCharge : 0
             → if subtotal >= settings.freeDeliveryAbove → deliveryChg = 0
discount     = coupon ? calculateCoupon(coupon, subtotal) : 0
totalAmount  = subtotal + gstAmount + deliveryChg - discount
```

### Order Number Generation

```
ORD-{YYYY}{MM}{DD}-{4-digit-counter}
Example: ORD-20240115-0042
Counter resets daily. Use MongoDB atomic increment.
```

### Status Transition Rules

```
pending      → accepted | cancelled
accepted     → preparing | cancelled
preparing    → ready | cancelled
ready        → out_for_delivery (if delivery) | delivered (if dine-in/takeaway)
out_for_delivery → delivered | cancelled
delivered    → [terminal, no more transitions]
cancelled    → [terminal]
```

### Guest Session Rules

- UUID v4 generated on frontend, stored in localStorage
- Sent with every order API call
- Expires after 24h (MongoDB TTL index)
- Cannot view other sessions' orders

---

## Next → `03-project-structure.md`

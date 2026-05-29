# 03 — Project Structure

> Complete folder and file tree. Create this structure before writing any code.

---

## Root Layout

```
restaurant-app/
├── backend/
├── frontend/
├── shared/              ← Types, constants, utils used by both
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   ├── cloudinary.js            ← Cloudinary setup
│   │   ├── razorpay.js              ← Razorpay instance
│   │   └── env.js                   ← Validated env vars
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validator.js
│   │   │
│   │   ├── menu/
│   │   │   ├── category.controller.js
│   │   │   ├── category.service.js
│   │   │   ├── category.repository.js
│   │   │   ├── menuItem.controller.js
│   │   │   ├── menuItem.service.js
│   │   │   ├── menuItem.repository.js
│   │   │   ├── menu.routes.js
│   │   │   └── menu.validator.js
│   │   │
│   │   ├── order/
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.repository.js
│   │   │   ├── order.routes.js
│   │   │   └── order.validator.js
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.service.js
│   │   │   ├── payment.repository.js
│   │   │   ├── payment.routes.js
│   │   │   └── payment.validator.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repository.js
│   │   │   ├── user.routes.js
│   │   │   └── user.validator.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   ├── notification.repository.js
│   │   │   └── notification.routes.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.js
│   │   │   ├── analytics.service.js
│   │   │   └── analytics.routes.js
│   │   │
│   │   └── coupon/
│   │       ├── coupon.controller.js
│   │       ├── coupon.service.js
│   │       ├── coupon.repository.js
│   │       ├── coupon.routes.js
│   │       └── coupon.validator.js
│   │
│   ├── models/
│   │   ├── User.model.js
│   │   ├── GuestSession.model.js
│   │   ├── Category.model.js
│   │   ├── MenuItem.model.js
│   │   ├── Order.model.js
│   │   ├── Payment.model.js
│   │   ├── Address.model.js
│   │   ├── Notification.model.js
│   │   ├── Coupon.model.js
│   │   └── RestaurantSettings.model.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       ← JWT verify + attach req.user
│   │   ├── role.middleware.js       ← requireRole("admin") etc
│   │   ├── errorHandler.middleware.js
│   │   ├── notFound.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   ├── upload.middleware.js     ← Multer + Cloudinary
│   │   └── validate.middleware.js   ← express-validator runner
│   │
│   ├── services/
│   │   ├── socket.service.js        ← Emit events from anywhere
│   │   ├── cloudinary.service.js    ← Upload/delete images
│   │   └── orderNumber.service.js   ← Generate order numbers
│   │
│   ├── sockets/
│   │   ├── index.js                 ← Socket.IO server setup
│   │   ├── auth.socket.js           ← Socket auth middleware
│   │   └── handlers/
│   │       ├── order.handler.js     ← join/leave order rooms
│   │       └── admin.handler.js     ← join admin/staff rooms
│   │
│   ├── utils/
│   │   ├── ApiError.js              ← Custom error class
│   │   ├── ApiResponse.js           ← Standard response wrapper
│   │   ├── asyncHandler.js          ← try-catch wrapper
│   │   ├── logger.js                ← Winston logger
│   │   ├── generateToken.js         ← JWT sign/verify
│   │   ├── hashPassword.js          ← bcrypt helpers
│   │   └── pricing.js               ← Price calculation logic
│   │
│   ├── routes/
│   │   └── index.js                 ← Mount all module routes
│   │
│   └── app.js                       ← Express app setup
│
├── server.js                        ← HTTP server + Socket.IO init
├── package.json
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
└── nodemon.json
```

---

## Frontend Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── store.ts                 ← Redux store
│   │   └── rootReducer.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.ts         ← user, tokens, isAuth
│   │   │   ├── authApi.ts           ← RTK Query endpoints
│   │   │   └── authSelectors.ts
│   │   │
│   │   ├── menu/
│   │   │   ├── menuApi.ts           ← RTK Query endpoints
│   │   │   └── menuSelectors.ts
│   │   │
│   │   ├── cart/
│   │   │   ├── cartSlice.ts         ← cart items, totals
│   │   │   └── cartSelectors.ts
│   │   │
│   │   ├── order/
│   │   │   ├── orderSlice.ts        ← active order, tracking
│   │   │   ├── orderApi.ts
│   │   │   └── orderSelectors.ts
│   │   │
│   │   ├── guest/
│   │   │   └── guestSlice.ts        ← guestSessionId, tableNumber
│   │   │
│   │   ├── notification/
│   │   │   ├── notificationSlice.ts ← unread count, list
│   │   │   └── notificationApi.ts
│   │   │
│   │   └── socket/
│   │       └── socketSlice.ts       ← connection status
│   │
│   ├── services/
│   │   ├── api.ts                   ← Axios baseQuery config
│   │   └── socket.ts                ← Socket.IO client singleton
│   │
│   ├── hooks/
│   │   ├── useSocket.ts             ← Connect/disconnect + listeners
│   │   ├── useAuth.ts               ← Auth state helpers
│   │   ├── useCart.ts               ← Cart operations
│   │   └── useOrderTracking.ts      ← Join order room
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── menu/
│   │   │   ├── CategoryTabs.tsx
│   │   │   ├── MenuItemCard.tsx
│   │   │   ├── MenuItemModal.tsx
│   │   │   └── VegNonVegBadge.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   │
│   │   ├── order/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   ├── OrderTimeline.tsx
│   │   │   └── OrderTracker.tsx
│   │   │
│   │   ├── payment/
│   │   │   ├── PaymentModal.tsx
│   │   │   └── RazorpayButton.tsx
│   │   │
│   │   └── admin/
│   │       ├── StatsCard.tsx
│   │       ├── SalesChart.tsx
│   │       ├── TopItemsTable.tsx
│   │       └── OrdersTable.tsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── MenuPage.tsx
│   │   │   ├── TableMenuPage.tsx    ← /table/:tableId (QR scan)
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   └── OrderTrackingPage.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── MyOrdersPage.tsx
│   │   │   └── AddressesPage.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── MenuManagement.tsx
│   │   │   ├── OrdersManagement.tsx
│   │   │   ├── UsersManagement.tsx
│   │   │   ├── CouponsManagement.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   │
│   │   └── staff/
│   │       ├── StaffDashboard.tsx
│   │       └── ActiveOrdersPage.tsx
│   │
│   ├── layouts/
│   │   ├── PublicLayout.tsx         ← Navbar + Footer
│   │   ├── AdminLayout.tsx          ← Sidebar + Header
│   │   └── StaffLayout.tsx          ← Minimal header
│   │
│   ├── router/
│   │   ├── AppRouter.tsx            ← All routes
│   │   └── privateRoute.tsx
│   │
│   ├── types/
│   │   └── index.ts                 ← Re-export from shared/
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   └── storage.ts               ← localStorage helpers
│   │
│   ├── constants/
│   │   └── index.ts                 ← Re-export from shared/
│   │
│   └── main.tsx                     ← React entry point
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env
├── .env.example
└── Dockerfile
```

---

## Shared Module Structure

```
shared/
├── types/
│   ├── user.types.ts               ← User, Role enums
│   ├── menu.types.ts               ← Category, MenuItem
│   ├── order.types.ts              ← Order, OrderStatus, OrderItem
│   ├── payment.types.ts            ← Payment, PaymentStatus
│   ├── notification.types.ts       ← Notification
│   ├── socket.types.ts             ← Socket event types
│   └── index.ts                    ← Barrel export
│
├── constants/
│   ├── orderStatus.ts              ← ORDER_STATUS enum
│   ├── roles.ts                    ← ROLES enum
│   ├── socketEvents.ts             ← All socket event names
│   └── index.ts
│
└── utils/
    ├── pricing.ts                  ← Shared pricing logic
    └── validators.ts               ← Shared validation helpers
```

---

## Key Files Content Templates

### shared/constants/socketEvents.ts

```ts
export const SOCKET_EVENTS = {
  // Server → Client
  NEW_ORDER: "new-order",
  ORDER_STATUS_UPDATED: "order-status-updated",
  PAYMENT_SUCCESS: "payment-success",
  PAYMENT_FAILED: "payment-failed",
  ORDER_ASSIGNED: "order-assigned",
  NOTIFICATION: "notification",

  // Client → Server
  JOIN_ORDER_ROOM: "join-order-room",
  LEAVE_ORDER_ROOM: "leave-order-room",
  JOIN_ADMIN_ROOM: "join-admin-room",
  JOIN_STAFF_ROOM: "join-staff-room",
} as const;
```

### shared/constants/orderStatus.ts

```ts
export const ORDER_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  accepted: "Order Accepted",
  preparing: "Being Prepared",
  ready: "Ready to Serve",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
```

### shared/constants/roles.ts

```ts
export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  USER: "user",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
```

---

## Setup Commands

```bash
# 1. Initialize root
mkdir restaurant-app && cd restaurant-app
git init

# 2. Backend
mkdir backend && cd backend
npm init -y

# 3. Frontend
cd ..
npm create vite@latest frontend -- --template react-ts

# 4. Shared
mkdir shared
cd shared && npm init -y

# 5. Install backend deps
cd ../backend
npm install express mongoose bcryptjs jsonwebtoken \
  cookie-parser cors helmet morgan express-rate-limit \
  express-validator multer cloudinary \
  razorpay socket.io winston dotenv uuid

npm install -D nodemon

# 6. Install frontend deps  
cd ../frontend
npm install @reduxjs/toolkit react-redux \
  socket.io-client axios react-router-dom \
  react-hot-toast lucide-react

npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

---

## .gitignore (Root)

```
node_modules/
dist/
build/
.env
*.log
.DS_Store
coverage/
```

---

## Next → `04-backend-setup.md`

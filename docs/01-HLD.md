# 01 — High-Level Design (HLD)

> System Architecture, Data Flow Diagrams, Component Overview

---

## 1. System Overview

Single restaurant. ~20–100 active users/day. **Monolithic MERN** — no microservices, no Kubernetes, no Kafka. Clean, maintainable, production-ready.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Guest      │  │ Registered  │  │  Admin   │  │  Staff   │  │
│  │ (QR Scan)  │  │   User      │  │ Dashboard│  │ Dashboard│  │
│  └─────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬─────┘  │
│        └────────────────┴──────────────┴──────────────┘        │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS + WSS
┌──────────────────────────────▼──────────────────────────────────┐
│                     NGINX (Reverse Proxy)                       │
│        Static React Build    │    /api/* → Node.js             │
│                              │    /socket.io → Socket.IO       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Express.js Server (Node.js)                │    │
│  │                                                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │   Auth   │ │  Menu    │ │  Order   │ │ Payment  │  │    │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  │                                                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │Analytics │ │Notif.    │ │  User    │               │    │
│  │  │ Module   │ │ Module   │ │ Module   │               │    │
│  │  └──────────┘ └──────────┘ └──────────┘               │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │              Socket.IO Server                   │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                 │
│  ┌─────────────────────┐     ┌────────────────────────────┐    │
│  │   MongoDB Atlas      │     │      Cloudinary            │    │
│  │   (Free M0)          │     │   (Image Storage)          │    │
│  │   - All collections  │     │   - Menu item images       │    │
│  └─────────────────────┘     └────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│                                                                 │
│  ┌───────────────┐     ┌──────────────────────────────────┐    │
│  │   Razorpay    │     │        (Optional Future)         │    │
│  │ Payment Gway  │     │  SendGrid (Email) / Twilio (SMS) │    │
│  └───────────────┘     └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Responsibilities

### 3.1 Frontend (React + TS)

| Component | Responsibility |
|-----------|---------------|
| Public Pages | Home, Menu browse, Cart, Checkout |
| QR Flow | /table/:tableId → detect table → guest session |
| User Pages | Profile, Orders, Addresses |
| Admin Dashboard | Analytics, Menu CRUD, Order mgmt, Reports |
| Staff Dashboard | Active orders queue, status updates |
| Socket Client | RTK Query + socket.io-client for live updates |

### 3.2 Backend (Express.js)

| Module | Responsibility |
|--------|---------------|
| Auth | JWT issue/verify, RBAC middleware, refresh tokens |
| Menu | Category & item CRUD, image upload via Cloudinary |
| Order | Order creation, status machine, validation |
| Payment | Razorpay order create, webhook verify, QR gen |
| User | Profile, addresses, order history |
| Notification | In-app + socket notifications |
| Analytics | Aggregation pipelines for dashboard |

### 3.3 Socket.IO

| Room | Subscribers |
|------|-------------|
| `admin-room` | Admin browser tab |
| `staff-room` | All logged-in staff |
| `order:{orderId}` | Customer tracking their order |

---

## 4. Request Flow Diagrams

### 4.1 Guest QR Order Flow

```
Customer scans QR code (restaurant.com/table/3)
        │
        ▼
React Router → /table/3
        │
        ▼
Store tableNumber in Redux state + localStorage
        │
        ▼
Generate guestSessionId (UUID) → store in localStorage
        │
        ▼
Browse menu (no API auth needed)
        │
        ▼
Add items to cart (localStorage)
        │
        ▼
Checkout → POST /api/orders (with guestSessionId + tableNumber)
        │
        ├── Cash → Order Created → Socket event → Admin notified
        │
        └── Online → POST /api/payments/create-order
                        │
                        ▼
                   Razorpay Order Created
                        │
                        ▼
                   Frontend Razorpay Modal
                        │
                        ▼
                   Customer Pays
                        │
                        ▼
                   Razorpay Webhook → /api/payments/webhook
                        │
                        ▼
                   Backend verifies signature
                        │
                        ▼
                   Order status → Confirmed
                        │
                        ▼
                   Socket → Admin + Customer notified
```

### 4.2 Order Status Update Flow

```
Staff marks order "Preparing"
        │
        ▼
PATCH /api/orders/:id/status  { status: "preparing" }
        │
        ▼
OrderService.updateStatus()
        │
        ▼
MongoDB order.status = "preparing"
        │
        ▼
NotificationService.create()
        │
        ▼
SocketService.emit("order-status-updated", { orderId, status })
        │
        ├── To room: order:{orderId}  →  Customer tracking page updates
        │
        └── To room: admin-room      →  Admin dashboard updates
```

---

## 5. Deployment Architecture

```
┌──────────────────────────────────────────────┐
│           AWS EC2 t2.micro (Ubuntu)          │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │              Docker                  │    │
│  │                                      │    │
│  │  ┌─────────────┐  ┌──────────────┐  │    │
│  │  │   Frontend  │  │   Backend    │  │    │
│  │  │  Container  │  │  Container   │  │    │
│  │  │ (Nginx +    │  │ (Node.js +   │  │    │
│  │  │  React)     │  │  Express)    │  │    │
│  │  └─────────────┘  └──────────────┘  │    │
│  │                                      │    │
│  │  ┌──────────────────────────────┐   │    │
│  │  │   Nginx (Host Level)         │   │    │
│  │  │   - SSL Termination          │   │    │
│  │  │   - Reverse Proxy            │   │    │
│  │  └──────────────────────────────┘   │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Port 80/443 exposed                        │
└──────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
   MongoDB Atlas         Cloudinary
   (External)            (External)
```

---

## 6. Security Model

| Layer | Mechanism |
|-------|-----------|
| API Auth | JWT Bearer token (Access 15min + Refresh 7d) |
| Role Guard | Express middleware checks req.user.role |
| Guest | guestSessionId UUID, no sensitive data |
| Payments | Razorpay webhook signature HMAC-SHA256 verify |
| Inputs | express-validator on all POST/PATCH routes |
| Headers | Helmet.js (XSS, CSP, HSTS) |
| Rate Limit | express-rate-limit — 100 req/15min per IP |
| CORS | Whitelist frontend domain only |

---

## 7. Scalability Notes (Future)

This system handles 100 users/day comfortably. If traffic grows:

- Add MongoDB indexes (already planned in LLD)
- Move to Atlas M2/M5 paid tier
- Add Upstash Redis for session caching
- Upgrade EC2 to t3.small
- No code architecture change needed — monolith stays

---

## Next → `02-LLD.md`

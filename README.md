# 🍽️ Restaurant Management System — Production Plan

> **Single Restaurant | MERN Stack | Free Tier Deployment**
> Monolithic Clean Architecture | Socket.IO | Razorpay | MongoDB Atlas

---

## 📁 How to Use This Plan

Read files **in order**. Each file = one focused phase. Complete one before moving to next.

| # | File | What You'll Build |
|---|------|-------------------|
| 01 | `docs/01-HLD.md` | High-Level Design — system overview, data flow, deployment |
| 02 | `docs/02-LLD.md` | Low-Level Design — DB schema, API contracts, socket events |
| 03 | `docs/03-project-structure.md` | Exact folder/file tree for both frontend & backend |
| 04 | `docs/04-backend-setup.md` | Backend bootstrap — Express, Mongo, Socket, env |
| 05 | `docs/05-shared-module.md` | Shared types, constants, utils used by both FE & BE |
| 06 | `docs/06-auth-module.md` | JWT auth — Admin, Staff, User, Guest |
| 07 | `docs/07-menu-module.md` | Categories + Menu Items CRUD + QR table system |
| 08 | `docs/08-order-module.md` | Cart → Order lifecycle → status machine |
| 09 | `docs/09-payment-module.md` | Razorpay + Cash + QR generation + webhook |
| 10 | `docs/10-socket-module.md` | Socket.IO events — real-time notifications & tracking |
| 11 | `docs/11-frontend-setup.md` | React + TS + Redux Toolkit + RTK Query bootstrap |
| 12 | `docs/12-frontend-pages.md` | All pages — Public, User, Admin, Staff |
| 13 | `docs/13-deployment.md` | AWS EC2 + Nginx + PM2 + Docker + Mongo Atlas |
| 14 | `docs/14-env-secrets.md` | All .env variables reference |

---

## 🏗️ Architecture Summary

```
                    ┌─────────────────────────────────┐
                    │         NGINX (Reverse Proxy)    │
                    └──────────┬──────────┬────────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼──────────┐
                    │ React Build │  │ Node.js + Expr │
                    │  (Static)   │  │  + Socket.IO   │
                    └─────────────┘  └──────┬─────────┘
                                            │
                                   ┌────────▼────────┐
                                   │  MongoDB Atlas  │
                                   │   (Free M0)     │
                                   └─────────────────┘
```

---

## 🎯 Tech Stack (All Free Tier)

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React 18 + TypeScript + Tailwind | Free |
| State | Redux Toolkit + RTK Query | Free |
| Backend | Node.js + Express.js | Free |
| Database | MongoDB Atlas M0 | Free forever |
| Realtime | Socket.IO | Free |
| Payments | Razorpay | Free (2% per txn) |
| File Storage | Cloudinary Free Tier | Free (25 GB) |
| Hosting | AWS EC2 t2.micro | Free 12 months |
| Domain | Freenom / Namecheap | Free / ~₹800/yr |

---

## 👤 Roles Summary

| Role | Description |
|------|-------------|
| **Admin** | Restaurant owner — full control, analytics, notifications |
| **Staff** | Kitchen + Delivery combined — manage & deliver orders |
| **User** | Registered customer — order, track, history |
| **Guest** | Walk-in / QR scan — order without login, cash/online |

---

## 🔄 Order Flow (Quick Reference)

```
Guest/User → Cart → Checkout → Payment
                                  ├── Cash → Order Confirmed
                                  └── Online → Razorpay → Webhook → Confirmed

Order Status: Pending → Accepted → Preparing → Ready → Out for Delivery → Delivered
                                                                     └── (Cancelled at any point)
```

---

## ⚡ Start Here

1. Read `docs/01-HLD.md` completely first
2. Read `docs/02-LLD.md` for DB schema
3. Set up project using `docs/03-project-structure.md`
4. Implement module by module (04 → 13)
5. Deploy using `docs/13-deployment.md`

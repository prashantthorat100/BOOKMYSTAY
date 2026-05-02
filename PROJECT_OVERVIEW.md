# 🏠 BookMyStay — Complete Project Overview

> **A full-stack property booking web application inspired by Airbnb, built as a college course project.**

---

## 📌 Table of Contents

1. [Project Summary](#1-project-summary)
2. [Tech Stack — At a Glance](#2-tech-stack--at-a-glance)
3. [System Architecture](#3-system-architecture)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Backend — Detailed Breakdown](#5-backend--detailed-breakdown)
6. [Frontend — Detailed Breakdown](#6-frontend--detailed-breakdown)
7. [Database Models (MongoDB Schemas)](#7-database-models-mongodb-schemas)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Key Features](#9-key-features)
10. [Authentication Flow](#10-authentication-flow)
11. [Payment Flow](#11-payment-flow)
12. [Third-Party Integrations](#12-third-party-integrations)
13. [Deployment](#13-deployment)
14. [Environment Variables](#14-environment-variables)

---

## 1. Project Summary

**BookMyStay** is a full-stack web application that mimics core Airbnb functionality. It allows users to:

- Browse and search property listings (hotels, apartments, villas, cabins, houses)
- Register/Login as a **Guest** or **Host**
- Hosts can **list, edit, and manage** their properties
- Guests can **book properties**, **pay online**, **review** stays, and **message** hosts
- Users can **save favourite properties** for later
- Fully integrated **online payment gateway (Razorpay)**
- **Google Sign-In** and email/password authentication with **OTP email verification**
- **Google Maps** integration to display property locations

---

## 2. Tech Stack — At a Glance

| Layer | Technology | Version |
|---|---|---|
| **Frontend Framework** | React.js | 18.2.0 |
| **Frontend Build Tool** | Vite | 5.0.8 |
| **Frontend Routing** | React Router DOM | 6.20.1 |
| **HTTP Client** | Axios | 1.6.2 |
| **Frontend UI Icons** | Lucide React | 1.7.0 |
| **Date Utilities** | date-fns | 3.0.6 |
| **Toast Notifications** | React Hot Toast | 2.6.0 |
| **Styling** | Vanilla CSS (Custom Design System) | — |
| **Backend Runtime** | Node.js (ES Modules) | — |
| **Backend Framework** | Express.js | 4.18.2 |
| **Database** | MongoDB (via Mongoose ODM) | Mongoose 8.3.3 |
| **Authentication** | JWT (jsonwebtoken) | 9.0.2 |
| **Password Hashing** | bcryptjs | 2.4.3 |
| **File Uploads** | Multer | 1.4.5 |
| **Email Service** | Nodemailer (Gmail SMTP / OAuth2) | 6.9.14 |
| **Payment Gateway** | Razorpay SDK | 2.9.6 |
| **Google Auth** | google-auth-library | 10.0.0 |
| **Maps** | Google Maps JavaScript API | — |
| **Template Engine** | EJS (for email templates) | 5.0.2 |
| **Environment Config** | dotenv | 16.3.1 |
| **CORS** | cors | 2.8.5 |
| **Dev Tool (Backend)** | Nodemon | 3.0.2 |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                     React + Vite (Port 3000)                     │
│                                                                   │
│  Pages: Home | PropertyDetail | Login | Signup | Dashboard       │
│          HostDashboard | AddProperty | EditProperty | Inbox      │
│          MyBookings | MyFavourites                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST API (Axios)
                            │ /api/*
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVER                               │
│                Express.js (Node.js) — Port 5000                  │
│                                                                   │
│  Middleware: CORS | JSON Parser | Multer | JWT Auth              │
│                                                                   │
│  Route Modules:                                                   │
│  /api/auth        → authRoutes.js                                │
│  /api/properties  → propertyRoutes.js                            │
│  /api/bookings    → bookingRoutes.js                             │
│  /api/payments    → paymentRoutes.js                             │
│  /api/reviews     → reviewRoutes.js                              │
│  /api/messages    → messageRoutes.js                             │
│  /api/favourites  → favouriteRoutes.js                           │
│  /api/host        → hostRoutes.js                                │
└──────────────┬────────────────────────────────────┬─────────────┘
               │                                    │
               ▼                                    ▼
┌──────────────────────┐              ┌─────────────────────────┐
│       MongoDB        │              │    External Services     │
│  (MongoDB Atlas or   │              │                          │
│   Local Instance)    │              │  • Razorpay (Payments)   │
│                      │              │  • Google OAuth2 (Login) │
│  Collections:        │              │  • Google Maps API       │
│  • users             │              │  • Gmail SMTP (Email)    │
│  • properties        │              └─────────────────────────┘
│  • bookings          │
│  • payments          │
│  • reviews           │
│  • messages          │
│  • favourites        │
│  • emailverification │
│    tokens            │
│  • passwordreset     │
│    tokens            │
└──────────────────────┘
```

---

## 4. Project Folder Structure

```
BOOKMYSTAY_CP/
├── backend/                          ← Node.js + Express Backend
│   ├── server.js                     ← App entry point, routes & middleware setup
│   ├── config/
│   │   └── db.js                     ← MongoDB connection logic
│   ├── middleware/
│   │   └── authMiddleware.js         ← JWT verification & role-based access
│   ├── models/                       ← Mongoose schemas (database models)
│   │   ├── User.js
│   │   ├── Property.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   ├── Review.js
│   │   ├── Message.js
│   │   ├── Favourite.js
│   │   ├── EmailVerificationToken.js
│   │   └── PasswordResetToken.js
│   ├── routes/                       ← REST API route handlers
│   │   ├── authRoutes.js             ← Register, Login, OTP, Google Auth
│   │   ├── propertyRoutes.js         ← CRUD for properties + search/filter
│   │   ├── bookingRoutes.js          ← Booking create/manage
│   │   ├── paymentRoutes.js          ← Razorpay order create & verify
│   │   ├── reviewRoutes.js           ← Property reviews
│   │   ├── messageRoutes.js          ← Guest-Host messaging
│   │   ├── favouriteRoutes.js        ← Save/unsave favourites
│   │   ├── hostRoutes.js             ← Host-specific actions
│   │   └── forgotPasswordRoutes.js   ← Password reset flow
│   ├── controllers/                  ← Dedicated controller files
│   │   ├── authController.js
│   │   ├── forgotPasswordController.js
│   │   └── passwordResetController.js
│   ├── utils/                        ← Email utilities
│   │   ├── emailService.js           ← Nodemailer OTP & transactional emails
│   │   ├── emailUtils.js
│   │   └── gmailService.js           ← Gmail OAuth2 service
│   ├── views/                        ← EJS email templates
│   ├── uploads/                      ← Uploaded property images (static files)
│   └── package.json
│
├── frontend/                         ← React + Vite Frontend
│   ├── index.html                    ← HTML entry point
│   ├── vite.config.js                ← Vite config with dev proxy
│   ├── src/
│   │   ├── main.jsx                  ← React DOM root render
│   │   ├── App.jsx                   ← Route definitions + Axios interceptor
│   │   ├── index.css                 ← Global design system (CSS variables, components)
│   │   ├── utils/
│   │   │   ├── api.js                ← API base URL config
│   │   │   └── googleMaps.js         ← Google Maps lazy loader
│   │   ├── components/               ← Reusable UI components
│   │   │   ├── Navbar.jsx            ← Top navigation with auth state
│   │   │   ├── Footer.jsx            ← Site footer
│   │   │   ├── PropertyCard.jsx      ← Property listing card with heart toggle
│   │   │   ├── SearchBar.jsx         ← Search & filter UI
│   │   │   ├── ImageSlider.jsx       ← Property image carousel
│   │   │   ├── Map.jsx               ← Google Maps embed component
│   │   │   └── ChatBox.jsx           ← In-app messaging chat UI
│   │   └── pages/                    ← Full page components (routes)
│   │       ├── Home.jsx              ← Property listing page with search
│   │       ├── PropertyDetail.jsx    ← Full property info + booking + map
│   │       ├── Login.jsx             ← Login (email + Google)
│   │       ├── Signup.jsx            ← Signup (email + Google) + OTP verify
│   │       ├── Dashboard.jsx         ← Guest user profile & settings
│   │       ├── HostDashboard.jsx     ← Host property management panel
│   │       ├── HostOnboarding.jsx    ← Flow to become a host
│   │       ├── AddProperty.jsx       ← Form to add a new property listing
│   │       ├── EditProperty.jsx      ← Form to edit existing property
│   │       ├── MyBookings.jsx        ← Guest's past & upcoming bookings
│   │       ├── MyFavourites.jsx      ← Saved/hearted properties
│   │       └── Inbox.jsx             ← Messaging inbox
│   └── package.json
│
└── README.md
```

---

## 5. Backend — Detailed Breakdown

### Framework & Server
- **Express.js** serves as the REST API server running on **port 5000**
- Uses **ES Modules** (`"type": "module"`) — modern `import/export` syntax throughout
- **CORS** is configured to allow requests from `localhost:3000`, `localhost:5173`, and the production frontend URL

### Middleware Stack
| Middleware | Purpose |
|---|---|
| `cors` | Cross-origin request handling for frontend |
| `express.json()` | Parse JSON request bodies |
| `express.urlencoded()` | Parse form-encoded bodies |
| `multer` | Handle multipart file uploads (property images) |
| `authMiddleware.js` | JWT token verification on protected routes |
| `isHost` guard | Role-based access (host-only routes) |

### Route Architecture
All routes are prefixed with `/api/`:

| Route Prefix | File | Responsibility |
|---|---|---|
| `/api/auth` | authRoutes.js | Register, Login, OTP Verify, Google OAuth, Password Reset |
| `/api/properties` | propertyRoutes.js | List, Search, CRUD for properties, Image upload |
| `/api/bookings` | bookingRoutes.js | Create/view/cancel bookings |
| `/api/payments` | paymentRoutes.js | Razorpay order creation & payment verification |
| `/api/reviews` | reviewRoutes.js | Post & fetch property reviews |
| `/api/messages` | messageRoutes.js | Send/receive messages between guest and host |
| `/api/favourites` | favouriteRoutes.js | Add/remove/list favourite properties |
| `/api/host` | hostRoutes.js | Host-specific stats and actions |
| `/uploads` | Static files | Serve uploaded property images |

### Security
- **bcryptjs** — passwords are salted & hashed (10 rounds) before storing
- **JWT tokens** — signed with `JWT_SECRET`, valid for **30 days**
- **OTP verification** — 6-digit OTPs are hashed with bcrypt before storing in DB
- **Rate limiting** — OTP requests throttled (1 per 60 seconds)
- **Email enumeration protection** — password reset always returns same message regardless

---

## 6. Frontend — Detailed Breakdown

### Framework & Tools
- **React 18** with functional components and hooks
- **Vite 5** as the build tool (ultra-fast HMR dev server on port 3000)
- **React Router DOM v6** for client-side routing (SPA)

### Routing (App.jsx)
| URL Path | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/property/:id` | PropertyDetail | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/dashboard` | Dashboard | Logged-in user |
| `/my-bookings` | MyBookings | Logged-in guest |
| `/inbox` | Inbox | Logged-in user |
| `/favourites` | MyFavourites | Logged-in user |
| `/host/onboarding` | HostOnboarding | Logged-in user |
| `/host/dashboard` | HostDashboard | Host only |
| `/host/add-property` | AddProperty | Host only |
| `/host/edit-property/:id` | EditProperty | Host only |

### State Management
- **No Redux/Zustand** — state is managed at the component level with `useState`/`useEffect`
- **localStorage** stores the JWT token and user object after login
- **Axios interceptor** in `App.jsx` globally handles `401/403` errors — auto-logout on token expiry

### Styling
- **Pure Vanilla CSS** with a comprehensive **custom design system** in `index.css`
- CSS custom properties (variables) for colors, spacing, shadows, and typography
- Modern design: glassmorphism effects, gradients, hover animations, responsive layouts

### Key Components
| Component | Purpose |
|---|---|
| `Navbar.jsx` | Responsive top bar; shows user avatar/menu when logged in; guest vs host nav |
| `PropertyCard.jsx` | Card with image, price, location, and ❤️ heart/favourite toggle |
| `SearchBar.jsx` | City search + property type filter + guest count |
| `ImageSlider.jsx` | Auto/manual image carousel for property photos |
| `Map.jsx` | Google Maps embed; interactive (click to pin) or read-only marker |
| `ChatBox.jsx` | Real-time-style messaging UI between guest and host |

### Vite Dev Proxy
```js
// vite.config.js — dev proxy so frontend can call /api/* without CORS issues
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:5000', changeOrigin: true }
}
```

---

## 7. Database Models (MongoDB Schemas)

### 👤 User
| Field | Type | Details |
|---|---|---|
| `email` | String | Unique, required, lowercase |
| `password_hash` | String | bcrypt hash (null for Google users) |
| `name` | String | Required |
| `dob` | Date | Date of birth |
| `phone` | String | Optional |
| `role` | String | `'guest'` or `'host'` |
| `avatar` | String | Profile image URL |
| `auth_provider` | String | `'email'` or `'google'` |
| `is_email_verified` | Boolean | Must be true to login |
| `google_id` | String | Google account sub ID |

### 🏠 Property
| Field | Type | Details |
|---|---|---|
| `host_id` | ObjectId | Ref → User |
| `title` | String | Required |
| `description` | String | Property description |
| `property_type` | String | `apartment/house/villa/cabin/hotel` |
| `price_per_night` | Number | Required |
| `bedrooms` | Number | Required |
| `bathrooms` | Number | Required |
| `max_guests` | Number | Required |
| `address` | String | Street address |
| `city` | String | Required |
| `country` | String | Required |
| `latitude` | Number | For Google Maps |
| `longitude` | Number | For Google Maps |
| `amenities` | [String] | e.g. WiFi, AC, Pool |
| `images` | [String] | Uploaded image filenames |
| `discount_percentage` | Number | Discount % (0 if none) |
| `offer_title` | String | Discount offer label |
| `offer_valid_till` | Date | Offer expiry date |
| `price_comparisons` | Array | Platform, price, URL for comparison |

### 📅 Booking
| Field | Type | Details |
|---|---|---|
| `property_id` | ObjectId | Ref → Property |
| `guest_id` | ObjectId | Ref → User |
| `check_in` | Date | Required |
| `check_out` | Date | Required |
| `total_price` | Number | Calculated total |
| `guests_count` | Number | Number of guests |
| `status` | String | `pending/confirmed/cancelled/completed` |

### 💳 Payment
| Field | Type | Details |
|---|---|---|
| `booking_id` | ObjectId | Ref → Booking |
| `razorpay_order_id` | String | Razorpay order reference |
| `razorpay_payment_id` | String | Razorpay payment reference |
| `amount` | Number | Amount in INR |
| `currency` | String | `'INR'` |
| `status` | String | `'captured'` |

### ⭐ Review
| Field | Type | Details |
|---|---|---|
| `property_id` | ObjectId | Ref → Property |
| `user_id` | ObjectId | Ref → User |
| `rating` | Number | 1–5 stars |
| `comment` | String | Review text |

### 💬 Message
| Field | Type | Details |
|---|---|---|
| `property_id` | ObjectId | Property the chat is about |
| `sender_id` | ObjectId | Ref → User |
| `receiver_id` | ObjectId | Ref → User |
| `text` | String | Message content |
| `read` | Boolean | Read/unread status |

### ❤️ Favourite
| Field | Type | Details |
|---|---|---|
| `user_id` | ObjectId | Ref → User |
| `property_id` | ObjectId | Ref → Property |
> Unique index on `(user_id, property_id)` — prevents duplicate favourites

### 🔐 EmailVerificationToken / PasswordResetToken
- Stores hashed OTPs with expiry (10 minutes)
- Marked `used: true` after consumption
- Rate-limited to 1 request per 60 seconds

---

## 8. API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register with email/password — sends OTP |
| POST | `/verify-email-otp` | Verify email OTP to activate account |
| POST | `/resend-verification-otp` | Resend email OTP |
| POST | `/login` | Email/password login |
| POST | `/google-login` | Login with Google ID token |
| POST | `/google-register` | Register with Google — sends OTP |
| POST | `/forgot-password` | Request password reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| GET | `/me` | Get logged-in user's profile (JWT required) |
| POST | `/upgrade-to-host` | Upgrade guest to host role (JWT required) |

### Properties (`/api/properties`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all properties (with search/filter query params) |
| GET | `/:id` | Get a single property by ID |
| POST | `/` | Create property (host only + image upload) |
| PUT | `/:id` | Edit property (host only) |
| DELETE | `/:id` | Delete property (host only) |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/my` | Get logged-in user's bookings |
| POST | `/` | Create a booking |
| PUT | `/:id/cancel` | Cancel a booking |

### Payments (`/api/payments`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/create-order` | Create Razorpay payment order |
| POST | `/verify` | Verify payment signature + create booking |

### Reviews (`/api/reviews`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/property/:id` | Get all reviews for a property |
| POST | `/` | Post a review |

### Messages (`/api/messages`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/conversations` | Get all conversations for current user |
| GET | `/:propertyId/:otherUserId` | Get messages in a conversation |
| POST | `/` | Send a message |
| PUT | `/read/:id` | Mark message as read |

### Favourites (`/api/favourites`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all favourites of logged-in user |
| POST | `/` | Add a property to favourites |
| DELETE | `/:propertyId` | Remove a property from favourites |

---

## 9. Key Features

### For Guests
- 🔍 **Search & Filter** — search by city, property type, guest count
- 🏠 **Property Listings** — image gallery, description, amenities, price
- 📍 **Google Maps** — view property location on an interactive map
- 📅 **Booking** — select dates, specify guests, pay online
- 💳 **Online Payment** — via Razorpay standard checkout (UPI, Cards, Net Banking)
- ❤️ **Favourites** — save/unsave properties with a heart button
- ⭐ **Reviews** — rate and review properties after staying
- 💬 **Messaging** — contact hosts directly through in-app chat
- 📖 **My Bookings** — view all past and upcoming bookings
- 🔐 **Auth** — email+password or Google Sign-In with OTP email verification

### For Hosts
- 🏘️ **Host Onboarding** — upgrade guest account to host
- ➕ **Add Property** — list new properties with images, amenities, location pin on map
- ✏️ **Edit Property** — update listing details, images, and pricing
- 🗑️ **Delete Property** — remove listings
- 📊 **Host Dashboard** — manage all listed properties
- 💬 **Inbox** — respond to guest messages
- 🏷️ **Discount & Offers** — set discount %, offer title, and validity date
- 📊 **Price Comparisons** — show prices from other platforms (e.g. Booking.com)

---

## 10. Authentication Flow

```
EMAIL REGISTRATION:
  User fills form → POST /api/auth/register
      → OTP generated (6-digit) → hashed & stored in DB
      → OTP emailed via Gmail SMTP (Nodemailer)
      → User enters OTP → POST /api/auth/verify-email-otp
      → Account activated → JWT returned → Logged in

GOOGLE REGISTRATION:
  User clicks Google Sign-In → Google returns idToken
      → POST /api/auth/google-register (idToken + name + role)
      → Backend verifies idToken via google-auth-library
      → Account created (auth_provider: 'google')
      → OTP emailed for email verification
      → User verifies OTP → JWT returned → Logged in

EMAIL LOGIN:
  POST /api/auth/login → email + password verified
      → bcrypt.compare() → JWT returned (valid 30 days)

GOOGLE LOGIN:
  Google idToken → POST /api/auth/google-login
      → User found in DB + is_email_verified check → JWT returned

PASSWORD RESET:
  POST /api/auth/forgot-password → OTP emailed
      → POST /api/auth/reset-password → OTP verified → new password saved
```

---

## 11. Payment Flow

```
Guest selects dates → clicks "Reserve & Pay"
    ↓
POST /api/payments/create-order
  (validates dates, calculates price with discount, creates Razorpay order)
    ↓
Razorpay checkout popup opens in browser
  (user chooses payment method: UPI QR, UPI ID, Card, Net Banking, etc.)
    ↓
User pays → Razorpay calls onSuccess callback with:
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    ↓
POST /api/payments/verify
  → HMAC-SHA256 signature verified server-side
  → Booking document created (status: 'confirmed')
  → Payment document saved
    ↓
"Booking Confirmed!" shown to user
```

---

## 12. Third-Party Integrations

| Service | Purpose | Library / API |
|---|---|---|
| **MongoDB Atlas** | Cloud database hosting | Mongoose ODM |
| **Razorpay** | Online payment gateway (UPI, Cards) | razorpay npm SDK |
| **Google OAuth2** | Sign-In with Google | google-auth-library |
| **Gmail (SMTP)** | Sending OTP & transactional emails | Nodemailer |
| **Google Maps API** | Displaying property location on map | Google Maps JS API |
| **Render.com** | Cloud hosting (both frontend & backend) | — |

---

## 13. Deployment

| Component | Platform | URL |
|---|---|---|
| **Frontend** | Render.com (Static Site) | `https://bookmystay-frontend-6zrt.onrender.com` |
| **Backend** | Render.com (Web Service) | Separate Render service |
| **Database** | MongoDB Atlas (Cloud) | Configured via `MONGO_URI` |

- Backend is deployed as a Node.js web service on Render
- Frontend is deployed as a static site on Render, built with `vite build`
- Production `FRONTEND_URL` environment variable set on backend for CORS

---

## 14. Environment Variables

### Backend (`.env`)
```
MONGO_URI=                  # MongoDB Atlas connection string
JWT_SECRET=                 # Secret key for signing JWT tokens
PORT=5000                   # Backend server port

# Razorpay Payment
RAZORPAY_KEY_ID=            # Razorpay API Key ID
RAZORPAY_KEY_SECRET=        # Razorpay API Key Secret

# Google Auth
GOOGLE_CLIENT_ID=           # Google OAuth2 Client ID

# Email (Gmail SMTP)
GMAIL_USER=                 # Gmail address used to send emails
GMAIL_APP_PASSWORD=         # Gmail App Password (not account password)

# Deployment
FRONTEND_URL=               # Allowed origin for CORS in production
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=          # Backend API URL (e.g. http://localhost:5000 or production URL)
VITE_GOOGLE_CLIENT_ID=      # Google OAuth2 Client ID
VITE_GOOGLE_MAPS_API_KEY=   # Google Maps JavaScript API Key
```

---

## 🎯 Summary for Presentation

| Aspect | Details |
|---|---|
| **Type** | Full-Stack Web Application |
| **Inspiration** | Airbnb |
| **Frontend** | React 18 + Vite + React Router + Vanilla CSS |
| **Backend** | Node.js + Express.js (REST API) |
| **Database** | MongoDB (NoSQL) via Mongoose |
| **Auth** | JWT + bcrypt + OTP Email + Google OAuth2 |
| **Payments** | Razorpay standard checkout (UPI / Cards / Net Banking) |
| **Maps** | Google Maps JavaScript API |
| **Email** | Nodemailer with Gmail SMTP |
| **File Upload** | Multer (property images) |
| **Deployment** | Render.com (both frontend + backend) |
| **Total API Routes** | 30+ REST endpoints across 8 route modules |
| **Database Collections** | 9 MongoDB collections |
| **Frontend Pages** | 12 pages + 7 reusable components |

---

*Generated: May 2026 | Project: BookMyStay | Course Project Review Documentation*

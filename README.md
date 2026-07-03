# 🚚 Last-Mile Delivery Tracker

A full-stack logistics management platform that automates delivery pricing, intelligent delivery agent assignment, shipment tracking, and customer notifications.

The application supports three user roles:

- 👤 Customer
- 🚴 Delivery Agent
- 👨‍💼 Admin

The project is built using **React (Vite)**, **Node.js**, **Express**, **PostgreSQL**, **Prisma ORM**, and deployed entirely on **Railway**.

---

# 🌟 Features

## 👤 Customer

- Register & Login
- Place Delivery Orders
- Track Order Status
- View Delivery Timeline
- Reschedule Failed Deliveries
- Receive Email Notifications

---

## 🚴 Delivery Agent

- Login
- View Assigned Orders
- Update Delivery Status
- Mark Deliveries as Failed
- Complete Deliveries

---

## 👨‍💼 Admin

- Dashboard
- Manage Customers
- Manage Delivery Agents
- Create Orders
- Manage Zones
- Configure Rate Cards
- Configure COD Charges
- Automatic Agent Assignment
- Manual Agent Assignment
- View All Orders
- Update Order Status

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

---

## Backend

- Node.js
- Express.js

---

## Database

- PostgreSQL
- Prisma ORM

---

## Authentication

- JWT
- bcrypt

---

## Notifications

- Nodemailer

---

## Deployment

- Railway (Frontend)
- Railway (Backend)
- Railway PostgreSQL

---

# 📁 Project Structure

```text
Last-Mile-Delivery-Tracker/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   ├── prisma.schema
│   └── ...
│
├── public/
├── src/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── .env.example
```

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone https://github.com/mohdamaanup32/Last-Mile-Delivery-Tracker.git

cd Last-Mile-Delivery-Tracker
```

---

## 2. Backend Setup

```bash
cd backend

npm install

npx prisma generate

npx prisma migrate dev

npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

## 3. Frontend Setup

Open another terminal

```bash
npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# ⚙ Environment Variables

## Backend (.env)

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=

EMAIL_USER=

EMAIL_PASS=

FRONTEND_URL=http://localhost:5173
```

---

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 📚 API Documentation

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login User |

---

## Orders

| Method | Endpoint |
|---------|----------|
| POST | /api/orders |
| GET | /api/orders |
| GET | /api/orders/:id |
| PUT | /api/orders/reschedule |

---

## Agent

| Method | Endpoint |
|---------|----------|
| GET | /api/agent/orders |
| PUT | /api/orders/status |

---

## Admin

| Method | Endpoint |
|---------|----------|
| POST | /api/zones |
| POST | /api/areas |
| POST | /api/ratecards |
| POST | /api/agents |
| PUT | /api/orders/assign |
| GET | /api/orders/all |

---

# 🗄 Database Schema

## User

```javascript
{
 id,
 name,
 email,
 password,
 role,
 phone,
 availability,
 createdAt
}
```

---

## Order

```javascript
{
 id,
 customerId,
 pickupAddress,
 dropAddress,
 pickupZone,
 dropZone,
 actualWeight,
 volumetricWeight,
 billableWeight,
 shipmentType,
 paymentType,
 deliveryCharge,
 assignedAgent,
 status,
 createdAt
}
```

---

## Zone

```javascript
{
 id,
 zoneName,
 areas[]
}
```

---

## Rate Card

```javascript
{
 id,
 shipmentType,
 orderType,
 pricePerKg,
 codCharge
}
```

---

# 💰 Rate Calculation Logic

Whenever a customer places an order, the delivery charge is calculated automatically.

## Step 1

Calculate Volumetric Weight

```
Volumetric Weight =
(L × B × H) / 5000
```

Example

```
40 × 30 × 20

= 24000

24000 / 5000

= 4.8 Kg
```

---

## Step 2

Compare

```
Actual Weight = 3 Kg

Volumetric Weight = 4.8 Kg

Billable Weight = 4.8 Kg
```

The larger value becomes the Billable Weight.

---

## Step 3

Detect Pickup Zone

Example

```
Lucknow

↓

Zone A
```

---

## Step 4

Detect Drop Zone

```
Kanpur

↓

Zone B
```

---

## Step 5

Determine Shipment Type

```
Zone A → Zone A

= Intra Zone

Zone A → Zone B

= Inter Zone
```

---

## Step 6

Fetch Applicable Rate Card

Based on

- B2B / B2C
- Intra / Inter Zone

---

## Step 7

Calculate Delivery Charge

```
Billable Weight
×

Rate Per Kg
+

COD Charge (if applicable)
```

---

# 🤖 Automatic Agent Assignment

The assignment engine follows these steps:

1. Detect pickup zone.
2. Find available delivery agents.
3. Filter agents serving that zone.
4. Assign the least busy or nearest available agent.
5. Allow admin to override the assignment manually if required.

---

# 📦 Order Lifecycle

```
Order Created

↓

Agent Assigned

↓

Picked Up

↓

In Transit

↓

Out For Delivery

↓

Delivered

OR

Failed
```

---

# 🔄 Failed Delivery Workflow

```
Delivery Failed

↓

Customer Receives Email

↓

Customer Reschedules

↓

Agent Reassigned

↓

Delivery Attempt Again
```

---

# 🚀 Live Deployment

### Frontend

https://pacific-sparkle-production-903d.up.railway.app

---

### Backend API

https://bountiful-rejoicing-production-0c9b.up.railway.app

---

# 🔑 Demo Credentials

### Admin

```
Email:
admin@lastmile.com

Password:
Password123!
```

---

### Delivery Agent

```
Email:
agent1@lastmile.com

Password:
Password123!
```

---

### Customer

```
Email:
customer@lastmile.com

Password:
Password123!
```

---

# 🔮 Future Enhancements

- Live GPS Tracking
- Google Maps Integration
- SMS Notifications
- Push Notifications
- Payment Gateway
- Analytics Dashboard
- AI Route Optimization

---

# 📄 License

This project was developed as part of the **Unthinkable Solutions Full Stack Developer Assignment** for educational and assessment purposes.

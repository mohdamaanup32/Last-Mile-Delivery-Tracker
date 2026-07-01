# 🚚 Last-Mile Delivery Tracker

A MERN-based logistics management platform that automates delivery pricing, intelligent delivery agent assignment, live order tracking, and customer notifications. The system supports three user roles: **Customer**, **Delivery Agent**, and **Admin**.

---

# Features

## Customer

* Register & Login
* Place Delivery Orders
* Live Order Tracking
* View Delivery Timeline
* Reschedule Failed Deliveries
* Email & SMS Notifications

## Delivery Agent

* Login
* View Assigned Orders
* Update Delivery Status
* Mark Delivery as Failed
* Complete Deliveries

## Admin

* Manage Customers & Agents
* Create Orders on Customer's Behalf
* Manage Zones & Areas
* Configure Rate Cards
* Configure COD Charges
* Manual & Automatic Agent Assignment
* View & Filter All Orders
* Override Order Status

---

# Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* JWT
* bcrypt

### Notifications

* Nodemailer
* Twilio (SMS)

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

# Project Structure

```text
last-mile-delivery-tracker/

client/
server/

server/
controllers/
routes/
models/
middleware/
config/
services/
utils/

client/
src/
components/
pages/
context/
services/
```

---

# Installation Guide

## Clone Repository

```bash
git clone https://github.com/yourusername/last-mile-delivery-tracker.git

cd last-mile-delivery-tracker
```

---

## Backend Setup

```bash
cd server

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd client

npm install

npm start
```

---

# Environment Variables (.env.example)

```env
PORT=5000

MONGODB_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

EMAIL_USER=your_email@gmail.com

EMAIL_PASS=your_email_password

TWILIO_ACCOUNT_SID=xxxxxxxxxxxx

TWILIO_AUTH_TOKEN=xxxxxxxxxxxx

TWILIO_PHONE=+91xxxxxxxxxx

CLIENT_URL=http://localhost:3000
```

---

# API Documentation

## Authentication

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register User |
| POST   | /api/auth/login    | Login User    |

---

## Customer

| Method | Endpoint               |
| ------ | ---------------------- |
| POST   | /api/orders            |
| GET    | /api/orders            |
| GET    | /api/orders/:id        |
| PUT    | /api/orders/reschedule |

---

## Delivery Agent

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | /api/agent/orders  |
| PUT    | /api/orders/status |

---

## Admin

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/zones         |
| POST   | /api/areas         |
| POST   | /api/ratecards     |
| POST   | /api/agents        |
| PUT    | /api/orders/assign |
| GET    | /api/orders/all    |

---

# Database Schema

## User

```javascript
{
 name,
 email,
 password,
 role,
 phone,
 address,
 currentLocation,
 availability
}
```

---

## Order

```javascript
{
 customer,
 pickupAddress,
 dropAddress,
 pickupZone,
 dropZone,
 length,
 breadth,
 height,
 actualWeight,
 volumetricWeight,
 billableWeight,
 orderType,
 paymentType,
 deliveryCharge,
 assignedAgent,
 status,
 rescheduleDate
}
```

---

## Zone

```javascript
{
 zoneName,
 areas[]
}
```

---

## Rate Card

```javascript
{
 orderType,
 shipmentType,
 pricePerKg,
 codCharge
}
```

---

## Tracking History

```javascript
{
 orderId,
 status,
 timestamp,
 updatedBy
}
```

---

# Rate Calculation Logic

The delivery charge is calculated automatically whenever a customer creates an order.

### Step 1

Calculate Volumetric Weight

```
Volumetric Weight =
(L × B × H)/5000
```

Example

```
40 × 30 × 20

=24000

24000/5000

=4.8 Kg
```

---

### Step 2

Compare

```
Actual Weight = 3 Kg

Volumetric Weight = 4.8 Kg

Billable Weight = 4.8 Kg
```

Higher value is selected.

---

### Step 3

Detect Pickup Zone

Example

```
Lucknow

↓

Zone A
```

---

### Step 4

Detect Drop Zone

```
Kanpur

↓

Zone B
```

---

### Step 5

Determine Shipment Type

```
Zone A → Zone A

= Intra Zone

Zone A → Zone B

= Inter Zone
```

---

### Step 6

Fetch Correct Rate Card

According to

* B2B / B2C
* Intra / Inter Zone

---

### Step 7

Calculate Delivery Charge

```
Billable Weight

×

Rate Per Kg

+

COD Charge (if applicable)
```

---

# Auto Assignment Logic

1. Find available delivery agents.
2. Filter agents serving the pickup zone.
3. If GPS coordinates are available, assign the nearest agent.
4. Otherwise, assign the least busy available agent.
5. Admin can manually override the assignment.

---

# Order Lifecycle

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

# Failed Delivery Flow

```
Delivery Failed

↓

Email & SMS Sent

↓

Customer Reschedules

↓

Agent Reassigned

↓

Delivery Attempt Again
```

---

# Future Enhancements

* Google Maps Integration
* Live GPS Tracking
* Payment Gateway
* Analytics Dashboard
* AI-Based Route Optimization
* Push Notifications

---

# Deployment

Frontend

```
https://your-vercel-link.vercel.app
```

Backend

```
https://your-render-link.onrender.com
```

---

# License

This project is developed for educational and assessment purposes.

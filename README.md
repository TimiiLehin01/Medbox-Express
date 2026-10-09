# 🏥 MedBox Express

MedBox Express is a role-based healthcare logistics web application that connects **Consumers, Pharmacies, and Riders** in one seamless platform.

It enables users to register under different roles, interact with location-based services, and ensures trust through an **admin approval system**.

---

## Features

### Multi-Role Registration

Users can register as:

- **Consumer** – Order medications and healthcare products
- **Pharmacy** – List and manage available drugs
- **Rider** – Handle delivery logistics

---

### Admin Approval System

- All new users are marked as **pending**
- An **admin dashboard** allows approval or rejection
- Only approved users can fully access the platform

---

### Location & Map Integration

- Users provide **coordinates during registration**
- Enables **location-based matching**
- Supports delivery routing between pharmacies and consumers

---

### Delivery Workflow

- Consumers place orders
- Pharmacies prepare orders
- Riders handle delivery using mapped locations

---

## Demo Access

To explore the app without going through the approval process, use the demo accounts on the website

## Tech Stack

- **Frontend:** Next.js
- **Styling:** Tailwind (if used)
- **State Management:** Supabase
- **Maps:** Google Maps

---

## Installation

Clone the repository:

```bash
git clone https://github.com/TimiiLehin01/medbox-express.git
cd medbox-express
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

---

## How It Works

1. User registers as Consumer, Pharmacy, or Rider
2. Account status is set to **Pending**
3. Admin reviews and approves users
4. Approved users gain full access to platform features
5. Orders and deliveries are handled through role interactions

---

## Purpose

This project demonstrates:

- Role-based access control
- Real-world workflow design
- Location-aware applications
- Admin moderation systems

---

## Future Improvements

- Real-time order tracking
- Payment integration
- Notifications system
- Backend/database integration for scalability

---

## Author

**Timilehin**
Frontend Developer passionate about building real-world applications.

---

## ⭐️ Show Your Support

If you like this project, feel free to **star the repo** and share feedback!

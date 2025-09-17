# School Payments And Dashboard Application

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]() [![License: MIT](https://img.shields.io/badge/license-MIT-blue)]()

🔗 **Live Demo:** [School Payments App](https://schoolapplicationass.netlify.app/)

> A full-stack School Payments and Dashboard application built with NestJS + MongoDB and React (Vite) + Tailwind CSS.
## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Payments](#payments)
  - [Webhook](#webhook)
  - [Transactions](#transactions)
- [Frontend Usage](#frontend-usage)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [License](#license)

---

## Features

- **JWT Authentication** for secured endpoints  
- **Create Payments** via external gateway  
- **Webhook Handling** to update transaction status  
- **Transaction Management** with pagination, filtering, sorting  
- **React Dashboard**:  
  - Paginated, searchable table  
  - Multi-select filters (status, school) persisted in URL  
  - Custom order status lookup  
  - Light/dark mode toggle  

---

## Tech Stack

**Frontend:**  
- ReactJS (Vite)  
- Tailwind CSS  
- React Router  
- Axios  
- React Toastify  

**Backend:**  
- NestJS  
- MongoDB (Atlas)  
- Mongoose  
- JWT Authentication  
- Passport.js  
- Axios for external API calls

--- 

## Project Structure
**Backend:**
```
School-Payment-and-Dashboard-Application/Backend/
├─ package.json
├─ tsconfig.json
├─ .env.example
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ config/
│  │  └─ configuration.ts
│  ├─ common/
│  │  └─ guards/jwt-auth.guard.ts
│  ├─ schemas/
│  │  ├─ order.schema.ts
│  │  ├─ order-status.schema.ts
│  │  ├─ webhook-log.schema.ts
│  │  └─ user.schema.ts
│  ├─ auth/
│  │  ├─ auth.module.ts
│  │  ├─ auth.service.ts
│  │  ├─ auth.controller.ts
│  │  └─ dto/login.dto.ts
│  ├─ payments/
│  │  ├─ payments.module.ts
│  │  ├─ payments.controller.ts
│  │  └─ payments.service.ts
│  ├─ webhook/
│  │  ├─ webhook.module.ts
│  │  └─ webhook.controller.ts
│  └─ transactions/
│     ├─ transactions.module.ts
│     └─ transactions.controller.ts
```
**Frontend:**
```
School-Payment-and-Dashboard-Application/Frontend/
├─ package.json
├─ vite.config.js
├─ tailwind.config.cjs
├─ postcss.config.cjs
├─ index.html
├─ .env.example
├─ public
   ├─_redirects
├─ src/
│  ├─ main.jsx
│  ├─ index.css
│  ├─ api/
│  │  └─ axios.js
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ TransactionTable.jsx
│  │  └─ ChartWidget.jsx
│  ├─ pages/
│  │  ├─ Login.jsx
│  │  ├─ Transactions.jsx
│  │  ├─ CreatePayment.jsx
│  │  ├─ StatusCheck.jsx
│  │  └─ SchoolTransactions.jsx
│  └─ App.jsx

```
---

## Prerequisites

- Node.js v16+  
- npm or Yarn  
- MongoDB Atlas account  
- Payment provider credentials  

---

## Environment Variables

Copy `.env.example` to `.env` in each folder and fill in:

### Backend (`School-Payment-and-Dashboard-Application/Backend/.env`)

 - MONGODB_URI= Your MongoDB Atlas URI
 - JWT_SECRET= Your JWT secret
 - PG_KEY= Your Key
 - API_KEY= Your payment API key
 - SCHOOL_ID= Your school ID
 - JWT_EXPIRES_IN= Your ID
 - EDVIRON_PG_KEY= Your PG Key
 - SCHOOL_ID= School ID
 - EDVIRON_BASE= Edviron ID
 - FRONTEND_URL= Frontend URL
 - TRUSTEE_ID= Trustee ID

### Frontend (`School-Payment-and-Dashboard-Application/Frontend/.env`)

 - VITE_API_BASE= Backend URL

---

## Installation

### Backend
```
cd Backend
npm install
npm run start:dev   # for development
npm run build       # for production build
```
### ➜ http://localhost:3000
### Frontend
```
cd Frontend 
npm install
npm run dev         # for development
npm run build       # for production build
```
### ➜ http://localhost:5173

---

## API Reference

### Auth

#### POST /auth/login

Authenticate user and issue JWT.

- **Request Body:**
```
{
"username": "your-username",
"password": "your-password"
}

admin:
"username": "admin"
"password": "password123"

student:
"username": "student"
"password": "password123"
```
- **Response:**
```
{
"access_token": "jwt.token.here"
}
```


### Payments

#### POST /payments/create-payment

Initiate a payment and receive redirect URL.

- **Request Body:** payment details object  
- **Response:**  
```
{
"payment_url": "https://gateway..."
}
```

### Webhook

#### POST /webhook

Receive provider callbacks to update payment status.

- **Payload:** provider-specific JSON  
- **Response:** HTTP 200 OK

### Transactions

#### GET /transactions

List all transactions with query params:

```
?page=1&limit=20&sort=payment_time&order=desc&status=success,pending 
```
---

## Frontend Usage

1. **Login**: `/login`  
2. **Dashboard**: `/transactions`  
3. **Create Payment**: `/create-payment`  
4. **Status Check**: `/login/status-check`  
5. **School View**: `/school-transactions`  

Use the header nav to switch pages; filters persist in URL.

---

## Screenshots

### Login Page
<img src="https://github.com/user-attachments/assets/561ebbb5-4de3-499e-ab04-8724e798729b" width="800" alt="Login Page" />

### Admin Page
<img src="https://github.com/user-attachments/assets/14983834-b37e-4af9-8888-d47171316cf2" width="800" alt="Admin Page" />

### Student Page
<img src="https://github.com/user-attachments/assets/719c3b45-3aba-467c-be4a-3014f5761ca6" width="800" alt="Student Page"  />

---

## Deployment

- **Backend**: Deploy to Render and enable CORS.  
- **Frontend**: Deploy to Netlify.

---

## License

This project is licensed under the MIT License.

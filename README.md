# Departmental Expense Wallets (PERN Stack Application)

An enterprise-grade Departmental Expense Wallets system built using the **PERN** stack (PostgreSQL, Express, React, Node.js). This application showcases how to flawlessly handle high-volume simultaneous invoice payments from multiple users without dropping data, double-spending, or allowing balances to drop below zero.

---

## 📖 Scenario & Design Objectives

In a mid-sized enterprise with **4 Business Units (BUs) / Departments** (Engineering, Finance, HR, Operations), each department has a dedicated expense wallet with a balance of **50,000 INR**. Multiple administrators can submit vendor payments simultaneously. 

This application implements robust concurrency control on the backend to handle two critical scenarios:
1. **The High-Volume Valid Case:** A wallet has **50,000 INR**. Users submit **10 concurrent payment requests of 500 INR** each at the exact same millisecond. The system must process all 10 successfully, updating the ledger, and leaving exactly **45,000 INR**.
2. **The Edge Case (Insufficient Funds):** A wallet is down to **2,000 INR**. Two users hit "Pay Expense" for two separate **1,500 INR** invoices at the exact same millisecond. The system must successfully process only one request, gracefully reject the other with an `"Insufficient funds"` error, and leave exactly **500 INR** in the wallet (never dropping below 0).

---

## 🛠️ Backend Architecture: What We Did & How It Works

To enforce strict financial data integrity, the backend employs **Pessimistic Row-Level Locking** in PostgreSQL:

1. **Database Client Allocation:** Each payment request borrows a dedicated client connection using `pool.connect()` to manage transaction boundaries explicitly.
2. **PostgreSQL Transaction Isolation (`BEGIN...COMMIT/ROLLBACK`):** By executing `BEGIN`, we start a SQL transaction, ensuring that either all operations succeed or none do (Atomicity).
3. **Pessimistic Locking (`SELECT ... FOR UPDATE`):**
   ```sql
   SELECT * FROM wallets WHERE id = $1 AND department_id = $2 FOR UPDATE;
   ```
   * **Why this is critical:** The `FOR UPDATE` clause places an exclusive lock on the specific department's wallet row. If multiple concurrent requests hit the database at the exact same millisecond, PostgreSQL serializes their execution for that specific row. Subsequent requests will block and wait until the active transaction either performs a `COMMIT` or a `ROLLBACK`. This entirely prevents race conditions and double-spending.
4. **Balance Verification:** We inspect the locked wallet's balance:
   * If `balance < amount`, we immediately execute `ROLLBACK` to release the lock and return a JSON response with `{ success: false, message: "Insufficient funds" }`.
   * If the balance is sufficient, we execute an `UPDATE` statement to deduct the funds and insert a ledger record into the `transactions` table with a `SUCCESS` status, followed by `COMMIT`.
5. **Connection Release:** A `finally` block ensures `client.release()` is always called, returning the connection to the pool and avoiding database resource exhaustion.

---

## 🗄️ Database Schema

The database consists of the following tables (`backend/database.sql`):
* **`departments`**: Stores the 4 business units.
* **`users`**: Enterprise members belonging to a department.
* **`wallets`**: Relates 1:1 with departments, storing the current balance.
* **`transactions`**: The ledger recording every wallet payment event (`wallet_id`, `user_id`, `amount`, `vendor_name`, `status`, `createdAt`).

---

## 🚀 Setting Up & Running the Application

### Prerequisites
* **Node.js** (v16+)
* **PostgreSQL** database running locally or hosted.

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the Environment Variables:
   Create a `.env` file in the `backend` folder (or edit the existing one) with your database credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=expense_wallet
   JWT_SECRET=your_jwt_secret_key
   ```
4. Initialize the Database Schema:
   Execute the SQL statements inside `backend/database.sql` on your PostgreSQL instance to create the database and required tables.
5. Seed the Database:
   Create the initial departments and wallets with `50,000 INR` balances:
   ```bash
   npm run seed
   ```
6. Start the Backend Server:
   ```bash
   npm run dev
   ```
   The backend server will run at [http://localhost:5000](http://localhost:5000).

---

### 2. Run the Concurrency Test Suite

To verify that the locking mechanism works flawlessly under high concurrent load directly on the database level, run the dedicated test script:
```bash
# From the backend directory:
node test-concurrency.js
```
This script runs both scenarios in parallel by executing concurrent requests at the exact same millisecond:
* **Scenario 1:** Starts with 50,000 INR, triggers 10 concurrent requests of 500 INR, checks if final balance is exactly 45,000 INR and 10 transactions were saved.
* **Scenario 2:** Starts with 2,000 INR, triggers 2 concurrent requests of 1,500 INR, checks if 1 succeeds and 1 fails with "Insufficient funds", leaving exactly 500 INR.

---

### 3. Frontend Setup

The frontend is a sleek, modern React dashboard built with Vite and designed with beautiful glassmorphism. It includes a **Developer Quick Sandbox Access** to log in to different department panels easily, a live payment form, a synchronized transaction ledger, and a **Race Condition Simulator** panel.

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Development Server:
   ```bash
   npm run dev
   ```
   Vite will host the frontend at [http://localhost:5173](http://localhost:5173) (or another port outputted in the terminal).
4. **Vite Proxy Settings:**
   The frontend is pre-configured in `vite.config.js` to proxy `/api` calls directly to `http://localhost:5000`. Make sure the backend server is running while using the frontend dashboard.

---

## 🖥️ UI Dashboard Features

* **Quick Sandbox Access:** Click on any of the 4 department login buttons on the authorization screen to auto-register/login as an admin user for that department.
* **Manual Payments:** Submit an invoice manually with a vendor name and amount.
* **Live Concurrency Simulator:** Run either **High-Volume Valid** or **Insufficient Funds** tests directly from the UI and observe the logs update in real-time as responses return.
* **Sync Ledger:** Click the Sync button on the ledger table to fetch the latest state from the database.

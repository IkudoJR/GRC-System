# GRC Platform — Running Guide

A simple guide to get the GRC Platform up and running on your machine.

---

## Requirements

Before you start, make sure you have these installed:

- **Node.js** (v18 or higher) — [nodejs.org](https://nodejs.org)
- **PostgreSQL** — must be installed and running in the background

---

## First-Time Setup

Follow these steps **once** when setting up the project for the first time.

### 1. Install Dependencies

Open a terminal in the project folder and run:

```powershell
npm install
```

### 2. Configure the Database

Open the `.env` file and update the `DATABASE_URL` line to match your PostgreSQL connection:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public"
```

Replace `USER`, `PASSWORD`, and `DATABASE_NAME` with your actual PostgreSQL credentials.

### 3. Set Up the Database

Run these commands in order:

```powershell
npm run db:push
```
> Creates the database tables based on the schema.

```powershell
npm run db:generate
```
> Generates the Prisma client so the app can talk to the database.

```powershell
npm run seed
```
> Fills the database with sample data (assets, risks, controls, users) so you don't start with an empty dashboard.

### 4. Start the App

```powershell
npm run dev
```

Then open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

---

## Default Login Credentials

| Role  | Username  | Password  |
|-------|-----------|-----------|
| Admin | `admin`   | `admin`   |
| User  | `analyst` | `analyst` |

---

## Bat Files — Quick Controls

Three `.bat` files are included to make managing the system easy. Just double-click them.

### `run.bat` — Start the System
Starts the database engine and the application server in one click.
Use this every time you want to launch the platform.

### `stop.bat` — Stop the System
Stops all running processes (server + database engine) immediately.
Use this when you're done and want to shut everything down cleanly.

### `reset-db.bat` — Reset the Database
**⚠ This wipes all data.** It stops the server, clears every table, and re-seeds the database back to its default state with the sample data and default credentials.
Use this when you want a fresh start.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| **Database connection error** | Check your `DATABASE_URL` in `.env` and make sure PostgreSQL is running. |
| **Port 3000 already in use** | Add `PORT=3001` (or any free port) to your `.env` file. |
| **Prisma client not found** | Run `npm run db:generate` then restart the server. |
| **Blank dashboard after reset** | Make sure `reset-db.bat` completed without errors. Re-run it if needed. |

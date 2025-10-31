# Sweet Crust Bakery — Customer Order Management System

## What this is
A simple web app to add, view, update, and delete bakery customer orders. Frontend is plain HTML/CSS/JS and backend is Node.js + Express with MySQL (works with XAMPP).

## Quick start
1. Start Apache and MySQL in XAMPP.
2. Run the SQL in `migrations/create_orders_table.sql` via phpMyAdmin.
3. Copy `.env.example` to `.env` and set DB credentials.
4. Install dependencies: `npm install`
5. Start server: `npm start`
6. Open `http://localhost:3000`

## Files included
- `public/` — frontend files
- `server.js` — Express server with CRUD endpoints
- `migrations/create_orders_table.sql` — SQL to create database and table
- `.env.example` — environment variables example
- `package.json` — node dependencies


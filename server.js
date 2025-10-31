// server.js
require('dotenv').config();
console.log("🌍 Loaded DB_HOST:", process.env.DB_HOST);

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// MySQL pool (with SSL enabled for Aiven)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sweet_crust_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
});

// ✅ Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
 const [rows] = await connection.query('SELECT NOW() AS `current_time`, @@version AS `mysql_version`;');
console.log("✅ Connected to Aiven MySQL successfully!");
console.log("🕒 Current time:", rows[0].current_time);
console.log("🐬 MySQL version:", rows[0].mysql_version);
console.log("🔐 Connection is using SSL (Aiven requires it by default).");


    connection.release();
  }    catch (err) {
    console.error("❌ Database connection failed:");
    console.error(err);   // print full error object
  }

})();



// Helper: validate order fields (server-side)
function validateOrder(data) {
  const errors = [];
  if (!data.order_id || !data.order_id.trim()) errors.push('Order ID required');
  if (!data.customer_name || !data.customer_name.trim()) errors.push('Customer name required');
  if (!data.product_ordered || !data.product_ordered.trim()) errors.push('Product ordered required');
  if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) errors.push('Quantity must be a positive number');
  if (!data.order_date) errors.push('Order date required');
  if (!data.order_status || !['Pending','Completed'].includes(data.order_status)) errors.push('Order status invalid');
  return errors;
}

// Routes

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  const { order_id, customer_name, product_ordered, quantity, order_date, order_status } = req.body;
  const errors = validateOrder({ order_id, customer_name, product_ordered, quantity, order_date, order_status });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const sql = `INSERT INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [order_id.trim(), customer_name.trim(), product_ordered.trim(), Number(quantity), order_date, order_status]);
    const [created] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Order ID already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Update order (status or full)
app.put('/api/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const fields = {};
  const allowed = ['order_id','customer_name','product_ordered','quantity','order_date','order_status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  // If quantity present, validate
  if (fields.quantity && (isNaN(Number(fields.quantity)) || Number(fields.quantity) <= 0)) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  // Build SET clause safely
  const setParts = [];
  const values = [];
  for (const [k, v] of Object.entries(fields)) {
    setParts.push(`${k} = ?`);
    values.push(k === 'quantity' ? Number(v) : v);
  }
  values.push(id);

  try {
    const sql = `UPDATE orders SET ${setParts.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Fallback to index.html for SPA-like UX
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

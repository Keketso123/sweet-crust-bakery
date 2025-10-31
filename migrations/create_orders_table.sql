-- migrations/create_orders_table.sql
CREATE DATABASE IF NOT EXISTS sweet_crust_db;
USE sweet_crust_db;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  product_ordered VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  order_date DATE NOT NULL,
  order_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

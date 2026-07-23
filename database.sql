CREATE DATABASE IF NOT EXISTS wanderlust_db;
USE wanderlust_db;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS hotels;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE hotels (
  hotel_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  contact VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rooms (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT NOT NULL,
  room_type VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  availability ENUM('Available', 'Unavailable') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_hotels
    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_rooms_capacity CHECK (capacity > 0),
  CONSTRAINT chk_rooms_price CHECK (price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  customer_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_rooms
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_bookings_users
    FOREIGN KEY (customer_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date),
  INDEX idx_bookings_customer (customer_id),
  INDEX idx_bookings_room_dates (room_id, check_in_date, check_out_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (name, email, phone, password, role) VALUES
('System Administrator', 'admin@wanderlust.com', '+880 1700-000000', '$2b$12$a/eOy0QxGeo8VlQftapDe.R033R5fEFKME9wTfqa9Q5o2xEsG1t/W', 'admin'),
('Ayesha Rahman', 'ayesha@example.com', '+880 1811-111111', '$2b$12$.7ivXfyLDTLoADwIbfrT..yN8fxLA2lpnfODKqHh/Zhtqvd5BDy0W', 'customer'),
('Nafis Ahmed', 'nafis@example.com', '+880 1822-222222', '$2b$12$.7ivXfyLDTLoADwIbfrT..yN8fxLA2lpnfODKqHh/Zhtqvd5BDy0W', 'customer'),
('Maliha Islam', 'maliha@example.com', '+880 1833-333333', '$2b$12$.7ivXfyLDTLoADwIbfrT..yN8fxLA2lpnfODKqHh/Zhtqvd5BDy0W', 'customer');

INSERT INTO hotels (name, location, description, contact, image_url) VALUES
('Sea Breeze Resort', 'Cox''s Bazar', 'A beach-side hotel with sea-facing rooms and easy access to the main beach.', '+880 1711-111111', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'),
('Hill View Inn', 'Bandarban', 'A quiet hill hotel for travelers looking for mountain views and peaceful stays.', '+880 1722-222222', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80'),
('City Comfort Hotel', 'Dhaka', 'A city hotel close to business centers, restaurants, and transport links.', '+880 1733-333333', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80');

INSERT INTO rooms (hotel_id, room_type, capacity, price, availability) VALUES
(1, 'Deluxe Sea View', 2, 6500.00, 'Available'),
(1, 'Family Suite', 4, 10500.00, 'Available'),
(2, 'Hill View Double', 2, 4800.00, 'Available'),
(3, 'Business Single', 1, 3500.00, 'Available');

INSERT INTO bookings (room_id, customer_id, check_in_date, check_out_date, status) VALUES
(1, 2, '2026-07-20', '2026-07-23', 'Confirmed'),
(3, 3, '2026-08-02', '2026-08-05', 'Pending');

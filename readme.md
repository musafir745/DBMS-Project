# WanderLust: Hotel Booking DBMS Project

WanderLust is a Node.js, Express.js, EJS, Bootstrap, and MySQL hotel booking management system built for the DBMS Lab proposal.

The project focuses on admin-side CRUD operations for:

- Hotels/listings
- Rooms
- Customers
- Bookings

MongoDB and Mongoose have been removed. The application uses MySQL through `mysql2`.

## Database Design

The project includes `database.sql`, which creates:

- `hotels` with `hotel_id` primary key
- `rooms` with `room_id` primary key and `hotel_id` foreign key
- `customers` with `customer_id` primary key
- `bookings` with `booking_id` primary key, `room_id` foreign key, and `customer_id` foreign key

The script also inserts sample data for quick testing.

## Setup With XAMPP/MySQL

1. Start Apache and MySQL from XAMPP.
2. Open phpMyAdmin.
3. Import `database.sql`.
4. Copy `.env.example` to `.env` and adjust credentials if needed.
5. Install dependencies:

```bash
npm install
```

6. Start the app:

```bash
npm start
```

7. Open:

```text
http://localhost:8080
```

## Environment Variables

```env
PORT=8080
SESSION_SECRET=wanderlust-dbms-secret
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wanderlust_db
```

## Main Routes

- `/listings` manages hotels/listings.
- `/rooms` manages rooms.
- `/customers` manages customers.
- `/bookings` manages bookings.

Each section supports create, read, update, and delete operations through the web interface.

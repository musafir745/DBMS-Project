const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { testConnection } = require("./config/db.js");
const PORT = process.env.PORT || 8080;

const listingsRouter = require("./routes/listings.js");
const roomsRouter = require("./routes/rooms.js");
const customersRouter = require("./routes/customers.js");
const bookingsRouter = require("./routes/bookings.js");
const authRouter = require("./routes/auth.js");
const customerRouter = require("./routes/customer.js");
const adminRouter = require("./routes/admin.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

const sessionoptions = {
  secret: process.env.SESSION_SECRET || "wanderlust-dbms-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.use(session(sessionoptions));
app.use(flash());

app.get("/", (req, res) => {
  if (req.session.user && req.session.user.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  if (req.session.user && req.session.user.role === "customer") {
    return res.redirect("/customer/dashboard");
  }

  res.redirect("/listings");
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.session.user || null;
  next();
});

app.use("/auth", authRouter);
app.use("/customer", customerRouter);
app.use("/admin", adminRouter);
app.use("/listings", listingsRouter);
app.use("/rooms", roomsRouter);
app.use("/customers", customersRouter);
app.use("/bookings", bookingsRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found !!"));
});

app.use((err, req, res, next) => {
  let { statuscode = 500, message = "something went wrong" } = err;
  res.status(statuscode).render("./listings/error.ejs", { message });
});

async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Unable to connect to MySQL. Start XAMPP/MySQL and import database.sql.");
  console.error(err.message);
  process.exit(1);
});

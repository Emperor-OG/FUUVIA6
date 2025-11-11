// -----------------------------------
// Imports
// -----------------------------------
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// -----------------------------------
// Load environment variables
// -----------------------------------
dotenv.config({ path: path.join(__dirname, ".env") });

// -----------------------------------
// App initialization
// -----------------------------------
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const ORIGIN = isProduction
  ? process.env.ORIGIN // e.g. https://fuuvia22-362015341457.europe-west1.run.app
  : "http://localhost:5173";

// -----------------------------------
// Passport config
// -----------------------------------
require("./auth");

// -----------------------------------
// Middleware
// -----------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
  })
);

// -----------------------------------
// Session (production-safe)
// -----------------------------------
app.set("trust proxy", 1); // trust Cloud Run proxy

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // HTTPS only in prod
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -----------------------------------
// Auth Middleware
// -----------------------------------
// Protects routes that need a logged-in user
function verifyUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "User not authenticated" });
  }
  next();
}

// -----------------------------------
// API Routes
// -----------------------------------
const userRoutes = require("./routes/user");
const marketRoutes = require("./routes/market");
const storeInfoRoutes = require("./routes/storeinfo");
const productRoutes = require("./routes/products");
const locationsRoutes = require("./routes/locations");
const paymentRoutes = require("./routes/payment");

// -----------------------------------
// Use Routes
// -----------------------------------
app.use("/api/user", userRoutes);
app.use("/api/stores", marketRoutes);
app.use("/api/stores", storeInfoRoutes);
app.use("/api/stores", productRoutes);
app.use("/api", locationsRoutes);
app.use("/api/payments", paymentRoutes);

// -----------------------------------
// Auth Routes
// -----------------------------------
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${ORIGIN}/login-failed`,
  }),
  (req, res) => {
    res.redirect(`${ORIGIN}/market`);
  }
);

app.get("/auth/logout", (req, res, next) => {
  if (!req.user) return res.status(400).json({ message: "Not logged in" });

  req.logout((err) => {
    if (err) return next(err);
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Error destroying session:", err);
        res.clearCookie("connect.sid", { path: "/" });
        return res.json({ message: "Logged out successfully" });
      });
    } else {
      return res.json({ message: "Logged out successfully" });
    }
  });
});

app.get("/auth/user", (req, res) => {
  if (req.user) return res.json(req.user);
  res.status(401).json({ message: "Not logged in" });
});

// -----------------------------------
// Health Check
// -----------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server running" });
});

// -----------------------------------
// Serve Frontend (Production)
// -----------------------------------
if (isProduction) {
  const clientPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientPath));

  app.use((req, res, next) => {
    if (req.url.startsWith("/api") || req.url.startsWith("/auth")) return next();
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

// -----------------------------------
// Start Server
// -----------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (${isProduction ? "Production" : "Dev"})`);
});
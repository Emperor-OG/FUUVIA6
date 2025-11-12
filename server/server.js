// -----------------------------------
// Imports
// -----------------------------------
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// -----------------------------------
// Load .env
// -----------------------------------
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

// -----------------------------------
// App init
// -----------------------------------
const app = express();
const isProd = process.env.NODE_ENV === "production";
const ORIGIN = isProd ? process.env.ORIGIN : "http://localhost:5173";

app.set("trust proxy", 1); // Important for Cloud Run

// -----------------------------------
// Middleware
// -----------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
  })
);

// -----------------------------------
// Sessions
// -----------------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd, // Only secure in production
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// -----------------------------------
// Passport Setup
// -----------------------------------
require("./auth"); // Google strategy
app.use(passport.initialize());
app.use(passport.session());

// -----------------------------------
// Auth Middleware
// -----------------------------------
function verifyUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
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

app.use("/api/user", userRoutes);
app.use("/api/stores", marketRoutes);
app.use("/api/stores", storeInfoRoutes);
app.use("/api/stores", productRoutes);
app.use("/api", locationsRoutes);
app.use("/api/payments", paymentRoutes);

// -----------------------------------
// Auth Routes (Google)
// -----------------------------------
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${ORIGIN}/login-failed` }),
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
// Serve Frontend (in Production)
// -----------------------------------
if (isProd) {
  const clientPath = path.join(__dirname, "../client/dist");
  if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));

    // ✅ Correct catch-all route
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }
}

// -----------------------------------
// Error Handling
// -----------------------------------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
});

// -----------------------------------
// Start Server
// -----------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT} (${isProd ? "Production" : "Dev"})`);
  console.log(`🌍 CORS Origin: ${ORIGIN}`);
});



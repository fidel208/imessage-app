const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Route Bindings
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/messages", require("./routes/chatRoutes"));

// Root Sanity Endpoint
app.get("/", (req, res) => {
  res.send("i-message engine online and running clean.");
});

// Global 404 Route Fallback Handler
app.use((req, res) => {
  res.status(404).json({ error: "Requested resource path not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server executing securely on port ${PORT}`);
});

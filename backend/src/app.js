// backend/src/app.js

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import connectToSocket from "./controllers/socketmanager.js";
import userRoutes from "./routes/usersroutes.js";

// Create express app
const app = express();
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ✅ SIR STYLE: base path /api/v1/users
app.use("/api/v1/users", userRoutes);

// Simple test route (optional)
app.get("/home", (req, res) => {
  return res.json({ message: "Backend is working ✅" });
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO using the separate module
const io = connectToSocket(server);

// ----- MongoDB + Server Start -----
app.set("port", process.env.PORT || 8000);
app.set(
  "mongo_user",
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/zoom-clone"
);

const start = async () => {
  try {
    const connectionDb = await mongoose.connect(app.get("mongo_user"));
    console.log(`✅ MongoDB connected: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`🚀 Server running on port ${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
};

start();

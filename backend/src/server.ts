// src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "@config/db";
import config from "@config/index";
import passport from "@config/passport";
import authRoutes from "@routes/authRoutes";
import menuRoutes from "@routes/menuRoutes";
import imageRoutes from "@routes/imageRoutes";
import orderRoutes from "@routes/orderRoutes";

const app = express();
const port = config.PORT;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Ensure MongoDB is connected before processing API requests.
// Existing connections are reused when the function instance is warm.
app.use("/v1", async (_req, res, next) => {
  try {
    await connectDB();

    next();
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error instanceof Error ? error.name : "Unknown error"
    );

    res.status(503).json({
      error: "Database temporarily unavailable",
      code: "DATABASE_UNAVAILABLE"
    });
  }
});

// Mount routes
app.use("/v1/auth", authRoutes);
app.use("/v1/menu", menuRoutes);
app.use("/v1/images", imageRoutes);
app.use("/v1/orders", orderRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Kochi Guru Pizza Backend is running");
});

// Export the app for Vercel
export default app;

// Start the HTTP listener only outside Vercel and automated tests.
// Supertest can test the exported Express app without opening a port.
if (!process.env.VERCEL && config.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Allowed CORS: `, config.FRONTEND_URL);
  });
}

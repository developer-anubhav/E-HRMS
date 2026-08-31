import express from "express"
import cors from "cors"
import employeeRoutes from "./routes/employeeRoutes.js"
import { apiLimiter } from "./middleware/rateLimitMiddleware.js"

const app = express()

// Trust reverse proxy for live deployment (Render, Vercel, Railway, Nginx, Cloudflare)
app.set("trust proxy", 1)

// Global Request Logger - MOVED TO TOP
app.use((req, res, next) => {
  console.log(`[NETWORK] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

const corsOptions = {
  origin: (origin, callback) => callback(null, origin || true),
  credentials: true,
};
app.use(cors(corsOptions))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Rate limiting disabled completely for unrestricted workflow and development

// 👇 THIS LINE IS CRITICAL
app.use("/api/employees", employeeRoutes)

app.get("/", (req, res) => {
  res.json({ message: "E-HRMS API running" })
})

export default app

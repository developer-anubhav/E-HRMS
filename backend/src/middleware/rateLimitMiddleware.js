import { rateLimit } from "express-rate-limit";

const limiterInstance = rateLimit({
  windowMs: 5 * 1000, // 5 seconds window
  max: parseInt(process.env.RATE_LIMIT_MAX || "1000000", 10), // 1,000,000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || "127.0.0.1";
  },
  skip: () => process.env.DISABLE_RATE_LIMIT === "true",
  message: {
    message: "Too many requests. Please wait a moment and try again."
  }
});

// Middleware to prevent rate limit lockouts across portals & live deployments
export const apiLimiter = (req, res, next) => {
  // If rate limiting is not explicitly turned on via ENABLE_RATE_LIMIT=true, bypass completely
  if (process.env.ENABLE_RATE_LIMIT !== "true") {
    return next();
  }
  return limiterInstance(req, res, next);
};

import { rateLimit } from "express-rate-limit";

// Rate limiting middleware to prevent brute force / DoS attacks
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX || "10000", 10), // Limit each IP to 10,000 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Extract real client IP from X-Forwarded-For if behind a proxy like Vercel, Render, Nginx
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || "127.0.0.1";
  },
  skip: () => {
    // Skip rate limiting if explicitly disabled in environment
    if (process.env.DISABLE_RATE_LIMIT === "true") {
      return true;
    }
    return false;
  },
  message: {
    message: "Too many requests from this IP, please try again after 1 minute."
  }
});

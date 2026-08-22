import { rateLimit } from "express-rate-limit";

// Rate limiting middleware to prevent brute force / DoS attacks
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // Limit each IP to 1500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

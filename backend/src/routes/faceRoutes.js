import express from "express";
import {
  enrollFace,
  getFaceProfile,
  deleteFaceProfile,
  verifyAndCheckInFace,
  getFacialAnalytics,
  getFacialAuditLogs,
} from "../controllers/faceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Analytics & Audit Logs
router.get("/analytics", protect, getFacialAnalytics);
router.get("/audit-logs", protect, getFacialAuditLogs);

// Face Profile Enrollment & Management
router.post("/enroll/:employeeId", protect, enrollFace);
router.get("/profile/:employeeId", protect, getFaceProfile);
router.delete("/profile/:employeeId", protect, deleteFaceProfile);

// Facial Attendance Verification Check-In
router.post("/verify-checkin", protect, verifyAndCheckInFace);

export default router;

import express from "express";
import { enrollFace, getFaceProfile, deleteFaceProfile, verifyAndCheckInFace } from "../controllers/faceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All face routes require authentication
router.post("/enroll/:employeeId", protect, enrollFace);
router.get("/profile/:employeeId", protect, getFaceProfile);
router.delete("/profile/:employeeId", protect, deleteFaceProfile);

// Facial Attendance Verification Check-In
router.post("/verify-checkin", protect, verifyAndCheckInFace);

export default router;

import express from "express";
import { enrollFace, getFaceProfile, deleteFaceProfile } from "../controllers/faceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All face routes require authentication
router.post("/enroll/:employeeId", protect, enrollFace);
router.get("/profile/:employeeId", protect, getFaceProfile);
router.delete("/profile/:employeeId", protect, deleteFaceProfile);

export default router;

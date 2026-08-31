import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

const router = express.Router();

// Apply protect middleware to all project routes
router.use(protect);

router.post("/", authorize("ADMIN", "MANAGER", "SUPERADMIN"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), updateProject);
router.delete("/:id", authorize("ADMIN", "MANAGER", "SUPERADMIN"), deleteProject);

export default router;

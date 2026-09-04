import express from "express";
import multer from "multer";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/octet-stream",
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const filename = (file.originalname || "").toLowerCase();
    const isAllowedExt =
      filename.endsWith(".pdf") ||
      filename.endsWith(".doc") ||
      filename.endsWith(".docx") ||
      filename.endsWith(".png") ||
      filename.endsWith(".jpg") ||
      filename.endsWith(".jpeg");

    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, PNG, and JPEG files are allowed."
        ),
        false
      );
    }
  },
});

// Middleware wrapper to handle Multer upload errors cleanly
const handleFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File size exceeds maximum limit of 15MB." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// All document endpoints require authentication
router.use(protect);

// Endpoints accessible by all tenant roles
router.get("/", listDocuments);
router.get("/:id/download", downloadDocument);

// Endpoints for document management (ADMIN, HR, MANAGER) - supports both / and /upload
router.post("/upload", authorize("ADMIN", "HR", "MANAGER"), handleFileUpload, uploadDocument);
router.post("/", authorize("ADMIN", "HR", "MANAGER"), handleFileUpload, uploadDocument);
router.delete("/:id", authorize("ADMIN", "HR", "MANAGER"), deleteDocument);

export default router;

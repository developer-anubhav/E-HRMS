import express from "express"
import { loginUser, organizationSignup, forgotPassword, resetPassword } from "../controllers/authController.js"

const router = express.Router()

router.post("/login", loginUser)
router.post("/organization-signup", organizationSignup)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)

export default router

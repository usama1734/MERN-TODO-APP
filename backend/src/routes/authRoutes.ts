import express from "express";
import { login, signup, uploadUserProfileImage } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/profile-image", requireAuth, uploadUserProfileImage);

export default router;

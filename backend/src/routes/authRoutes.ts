// src/routes/authRoutes.ts
import { Router } from "express";
import passport from "passport";
import * as authController from "@controllers/authController";
import { authenticate } from "@middleware/authenticate";
import config from "@config/index";
import { validateRequest } from "@middleware/validateRequest";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema
} from "@schemas/authSchemas";

const router = Router();

// Email/Password Authentication
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);
router.post("/login", validateRequest(loginSchema), authController.login);

// Token Management
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshAccessToken
);
router.post(
  "/logout",
  authenticate,
  validateRequest(logoutSchema),
  authController.logout
);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.FRONTEND_URL}?error=auth_failed`
  }),
  authController.googleCallback
);

// Protected Routes
router.get("/me", authenticate, authController.getCurrentUser);

export default router;

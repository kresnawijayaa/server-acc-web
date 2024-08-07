const express = require("express");
const {
  register,
  registerAdmin,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  refreshAuth,
  check,
  sendPasswordReset,
  resetPassword,
} = require("../controllers/authContoller");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/register/admin", registerAdmin);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh-token", refreshAuth);
router.post("/send-password-reset", sendPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/check", verifyToken, check);

module.exports = router;

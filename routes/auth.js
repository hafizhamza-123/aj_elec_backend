const express = require("express");
const {
  handleUserSignup,
  handleUserLogin,
  refreshAccessToken,
  handleUserLogout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/auth");

const router = express.Router();


router.post("/register", handleUserSignup); // signup/register route
router.post("/login", handleUserLogin); // login route
router.post("/refresh", refreshAccessToken);
router.post("/logout", handleUserLogout); // logout route
router.get("/verify/:token", verifyEmail);  //  email verification route
router.post("/request-password-reset", requestPasswordReset); // request password route
router.post("/reset-password/:token", resetPassword); // reset password route


module.exports = router;


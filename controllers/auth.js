const User = require("../models/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { registerSchema, loginSchema } = require("../validators/auth");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/mailer");

// ---------------------- SIGNUP ----------------------
async function handleUserSignup(req, res) {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password} = req.body; 

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verified: false,
    });

    // Generate verification token
    const token = jwt.sign(
      { userId: user._id },
      process.env.EMAIL_TOKEN_SECRET || "email_secret",
      { expiresIn: "1h" }
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, token);
    } catch (mailErr) {
      console.error("Email sending failed:", mailErr.message);
      return res.status(500).json({
        error: "User created, but failed to send verification email. Try again later.",
      });
    }

    return res.json({
      message: "User registered successfully. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}

// ---------------------- VERIFY EMAIL ----------------------
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    // Decode token
    const decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET || "email_secret");

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    // If already verified
    if (user.verified) {
      return res.json({ message: "Email already verified" });
    }

    // Mark as verified
    user.verified = true;
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("verifyEmail error:", err.message);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
}


// ---------------------- LOGIN ----------------------
async function handleUserLogin(req, res) {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.verified) {
      return res.status(401).json({ error: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Create tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET || "access_secret",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // Clean user object before sending
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return res.json({
      message: "Login successful",
      token: accessToken, // 👈 frontend uses this as "token"
      refreshToken,
      user: userObj, // 👈 frontend saves user (with role)
    });
  } catch (err) {
    console.error("handleUserLogin error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// ---------------------- REFRESH ACCESS TOKEN ----------------------
async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || "refresh_secret"
      );
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Find user with this refresh token
    const user = await User.findOne({ _id: decoded.userId, refreshToken });
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Create a new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET || "access_secret",
      { expiresIn: "15m" }
    );

    return res.json({ token: newAccessToken });
  } catch (err) {
    console.error("refreshAccessToken error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}


// ---------------------- LOGOUT ----------------------
async function handleUserLogout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ error: "Invalid refresh token" });

    user.refreshToken = null;
    await user.save();

    return res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("handleUserLogout error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// ---------------------- PASSWORD RESET ----------------------
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email not registered" });

    // Generate JWT reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.RESET_TOKEN_SECRET || "reset_secret",
      { expiresIn: "15m" }
    );

    // Generate frontend reset password link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // Send the email with the frontend link
    await sendResetPasswordEmail(user.email, resetLink);

    return res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("requestPasswordReset error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}


async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET || "reset_secret");

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ error: "Invalid token" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
}



module.exports = {
  handleUserSignup,
  handleUserLogin,
  refreshAccessToken,
  handleUserLogout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};
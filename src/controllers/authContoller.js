// authController.js
require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(googleClientId);

const nodemailer = require("nodemailer");
const emailNodemailer = process.env.EMAIL_NODEMAILER;
const passwordNodemailer = process.env.PASSWORD_NODEMAILER;
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailNodemailer,
    pass: passwordNodemailer,
  },
});

const twilio = require("twilio");
const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const clientTwilio = new twilio(accountSid, authToken);

const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const refreshJwtSecret = process.env.REFRESH_JWT_SECRET;

const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const { admin } = require("../config/firebase");

const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const emailExists = await db.collection("users").where("email", "==", email).get();
    if (!emailExists.empty) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = db.collection("users").doc();
    await userRef.set({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user",
      is_verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerAdmin = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const emailExists = await db.collection("users").where("email", "==", email).get();
    if (!emailExists.empty) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = db.collection("users").doc();
    await userRef.set({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      is_verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;
  try {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", emailOrPhone)
      .get();
    if (userSnapshot.empty) {
      const phoneSnapshot = await db
        .collection("users")
        .where("phone", "==", emailOrPhone)
        .get();
      if (phoneSnapshot.empty) {
        return res
          .status(400)
          .json({ message: "Invalid email/phone or password" });
      }
      const user = phoneSnapshot.docs[0].data();
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid email/phone or password" });
      }
      const token = jwt.sign(
        { id: phoneSnapshot.docs[0].id, role: user.role },
        jwtSecret,
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        { id: phoneSnapshot.docs[0].id, role: user.role },
        refreshJwtSecret,
        { expiresIn: "7d" }
      );
      return res.json({ token, refreshToken, user });
    }
    const user = userSnapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email/phone or password" });
    }
    const token = jwt.sign(
      { id: userSnapshot.docs[0].id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );
    const refreshToken = jwt.sign(
      { id: userSnapshot.docs[0].id, role: user.role },
      refreshJwtSecret,
      { expiresIn: "7d" }
    );
    res.json({ token, refreshToken, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {
  const { tokenId, password } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: googleClientId,
    });
    const { email_verified, name, email } = ticket.getPayload();
    if (email_verified) {
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();
      if (userSnapshot.empty) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRef = db.collection("users").doc();
        await userRef.set({
          name,
          email,
          password: hashedPassword,
          role: "user",
          is_verified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const token = jwt.sign({ id: userRef.id, role: "user" }, jwtSecret, {
          expiresIn: "1h",
        });
        const refreshToken = jwt.sign(
          { id: userRef.id, role: "user" },
          refreshJwtSecret,
          { expiresIn: "7d" }
        );
        return res.json({
          token,
          refreshToken,
          user: { name, email, role: "user" },
        });
      } else {
        const user = userSnapshot.docs[0].data();
        const token = jwt.sign(
          { id: userSnapshot.docs[0].id, role: user.role },
          jwtSecret,
          { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
          { id: userSnapshot.docs[0].id, role: user.role },
          refreshJwtSecret,
          { expiresIn: "7d" }
        );
        return res.json({ token, refreshToken, user });
      }
    } else {
      res.status(400).json({ message: "Google authentication failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendOtp = async (req, res) => {
  const { contact } = req.body;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    if (contact.includes("@")) {
      await transporter.sendMail({
        from: emailNodemailer,
        to: contact,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}`,
      });
    } else {
      await clientTwilio.messages.create({
        body: `Your OTP code is ${otp}`,
        from: `whatsapp:${twilioPhoneNumber}`,
        to: `whatsapp:${contact}`,
      });
    }
    await db.collection("otps").doc(contact).set({
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { contact, otp } = req.body;
  try {
    const otpDoc = await db.collection("otps").doc(contact).get();
    if (!otpDoc.exists || otpDoc.data().otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", contact)
      .get();
    if (userSnapshot.empty) {
      const phoneSnapshot = await db
        .collection("users")
        .where("phone", "==", contact)
        .get();
      if (phoneSnapshot.empty) {
        return res.status(400).json({ message: "User not found" });
      }
      const user = phoneSnapshot.docs[0].data();
      await db.collection("users").doc(phoneSnapshot.docs[0].id).update({
        is_verified: true,
      });
      const token = jwt.sign(
        { id: phoneSnapshot.docs[0].id, role: user.role },
        jwtSecret,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { id: phoneSnapshot.docs[0].id, role: user.role },
        refreshJwtSecret,
        { expiresIn: "7d" }
      );
      return res.json({ token, refreshToken, user });
    }
    const user = userSnapshot.docs[0].data();
    await db.collection("users").doc(userSnapshot.docs[0].id).update({
      is_verified: true,
    });
    const token = jwt.sign(
      { id: userSnapshot.docs[0].id, role: user.role },
      jwtSecret,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: userSnapshot.docs[0].id, role: user.role },
      refreshJwtSecret,
      { expiresIn: "7d" }
    );
    res.json({ token, refreshToken, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refreshAuth = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token is required" });

  jwt.verify(refreshToken, refreshJwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const newToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "1h",
    });
    res.json({ token: newToken });
  });
};

const check = (req, res) => {
  res.sendStatus(200); // OK
};

module.exports = {
  register,
  registerAdmin,
  login,
  googleAuth,
  sendOtp,
  verifyOtp,
  refreshAuth,
  check
};

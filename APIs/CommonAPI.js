import exp from 'express'
import bcrypt from 'bcryptjs'
import { UserTypeModel } from '../Models/UserModel.js';
import { authenticate } from '../Services/authService.js';
import { verifyToken } from '../middlewares/verifyToken.js';

export const commonRouter = exp.Router()

// login
commonRouter.post("/login", async (req, res, next) => {
  try {
    let userCred = req.body;
    console.log("Login request received for:", userCred.email);
    let { token, user } = await authenticate(userCred);
    
    // save token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Set to true if using HTTPS and not localhost
    });
    
    console.log("Login successful for:", userCred.email);
    res.status(200).json({ message: "Login Successful", token, payload: user })
  } catch (err) {
    console.error("Login error for:", req.body?.email, "-", err.message);
    next(err);
  }
})

// logout
commonRouter.get("/logout", async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.status(200).json({ message: "Logout Successful" })
})

// check-auth — validates current token and returns user info (used by frontend on page refresh)
commonRouter.get("/check-auth", verifyToken(), async (req, res, next) => {
  try {
    const user = await UserTypeModel.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Authenticated", payload: user });
  } catch (err) {
    next(err);
  }
})

// reset password
commonRouter.put('/reset-password', async (req, res, next) => {
  try {
    let { email, newpassword } = req.body
    let user = await UserTypeModel.findOne({ email: email })
    if (!user) {
      return res.status(404).json({ message: "User Not Found" })
    }
    user.password = await bcrypt.hash(newpassword, 12)
    await user.save()
    res.status(200).json({ message: "Password Reset Successfully" })
  } catch (err) {
    next(err);
  }
})
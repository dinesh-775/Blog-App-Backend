import exp from 'express';
import { UserTypeModel } from '../Models/UserModel.js';
import { ArticleModel } from '../Models/ArticleModel.js';
import { verifyToken } from '../middlewares/verifyToken.js';

export const adminRoute = exp.Router();

// All admin routes require ADMIN role
const adminAuth = verifyToken("ADMIN");

// Get all users
adminRoute.get('/users', adminAuth, async (req, res, next) => {
  try {
    const users = await UserTypeModel.find().select("-password");
    res.status(200).json({ message: "All users", payload: users });
  } catch (err) {
    next(err);
  }
})

// Get all articles
adminRoute.get('/articles', adminAuth, async (req, res, next) => {
  try {
    const articles = await ArticleModel.find();
    res.status(200).json({ message: "All articles", payload: articles });
  } catch (err) {
    next(err);
  }
})

// Block a user
adminRoute.put('/users/block', adminAuth, async (req, res, next) => {
  try {
    let user = await UserTypeModel.findById(req.body.UserId);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    user.isActive = false;
    await user.save();
    res.status(200).json({ message: "User blocked successfully", payload: user });
  } catch (err) {
    next(err);
  }
})

// Unblock a user
adminRoute.put('/users/unblock', adminAuth, async (req, res, next) => {
  try {
    let user = await UserTypeModel.findById(req.body.UserId);
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    user.isActive = true;
    await user.save();
    res.status(200).json({ message: "User unblocked successfully", payload: user });
  } catch (err) {
    next(err);
  }
})
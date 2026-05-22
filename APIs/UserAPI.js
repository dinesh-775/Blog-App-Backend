import exp from 'express';
import { register } from '../Services/authService.js'
import { UserTypeModel } from '../Models/UserModel.js';
import { ArticleModel } from '../Models/ArticleModel.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { upload } from '../config/multer.js';
import { uploadToCloudinary } from '../config/cloudinaryUpload.js';
import cloudinary from '../config/cloudinary.js';

export const userRoute = exp.Router();

// Register user
userRoute.post(
  "/users",
  upload.single("profilePic"),
  async (req, res, next) => {
    let cloudinaryResult;
    try {
      let userObj = req.body;

      // Upload image to cloudinary from memoryStorage (if provided)
      if (req.file) {
        cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      }

      const newUserObj = await register({
        ...userObj,
        role: "USER",
        profileImageUrl: cloudinaryResult?.secure_url,
      });

      res.status(201).json({
        message: "user created",
        payload: newUserObj,
      });
    } catch (err) {
      // Rollback cloudinary upload if registration fails
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      }
      next(err);
    }
  }
);

// Read all active articles (supports category filter)
userRoute.get('/articles', verifyToken("USER"), async (req, res, next) => {
  try {
    let { category } = req.query;
    let query = { isArticleActive: true };
    if (category) {
      query.category = category;
    }
    let articles = await ArticleModel.find(query)
      .populate('author', 'username profileImageUrl')
      .sort({ updatedAt: -1 });
    res.status(200).json({ message: "all articles", payload: articles });
  } catch (err) {
    next(err);
  }
})

// Get a single article by ID (used by ArticleByID page)
userRoute.get('/articles/:id', verifyToken("USER"), async (req, res, next) => {
  try {
    const article = await ArticleModel.findOne({ _id: req.params.id, isArticleActive: true })
      .populate('author', 'username profileImageUrl')
      .populate('comments.user', 'username profileImageUrl');
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.status(200).json({ message: "Article found", payload: article });
  } catch (err) {
    next(err);
  }
})

// Add comment to an article
userRoute.post('/articles/comments', verifyToken("USER"), async (req, res, next) => {
  try {
    const { userId, articleId, comment } = req.body;
    // Ensure the logged-in user is adding their own comment
    if (userId != req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    let updatedArticle = await ArticleModel.findOneAndUpdate(
      { _id: articleId, isArticleActive: true },
      { 
        $push: { 
          comments: { 
            comment, 
            user: userId, 
            createdAt: new Date(), 
            updatedAt: new Date() 
          } 
        } 
      },
      { new: true, runValidators: true, timestamps: false }
    ).populate('author', 'username profileImageUrl')
     .populate('comments.user', 'username profileImageUrl');

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(201).json({ message: "comment added successfully", payload: updatedArticle });
  } catch (err) {
    next(err);
  }
});

// Edit comment on an article
userRoute.put('/articles/comments', verifyToken("USER"), async (req, res, next) => {
  try {
    const { articleId, commentId, comment } = req.body;
    
    let article = await ArticleModel.findOne({ _id: articleId, isArticleActive: true });
    if (!article) {
      return res.status(404).json({ message: "Article or comment not found" });
    }

    const commentToEdit = article.comments.id(commentId);
    if (!commentToEdit) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Ensure the logged-in user is editing their own comment
    if (commentToEdit.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden. You can only edit your own comment" });
    }
    
    let updatedArticle = await ArticleModel.findOneAndUpdate(
      { _id: articleId, "comments._id": commentId, isArticleActive: true },
      { 
        $set: { 
          "comments.$.comment": comment,
          "comments.$.updatedAt": new Date()
        } 
      },
      { new: true, runValidators: true, timestamps: false }
    ).populate('author', 'username profileImageUrl')
     .populate('comments.user', 'username profileImageUrl');

    res.status(200).json({ message: "comment updated successfully", payload: updatedArticle });
  } catch (err) {
    next(err);
  }
});
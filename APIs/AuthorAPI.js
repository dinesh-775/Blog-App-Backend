import exp from 'express';
import { register } from '../Services/authService.js';
import { ArticleModel } from '../Models/ArticleModel.js';
import { checkAuthor } from '../middlewares/checkAuthor.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { upload } from '../config/multer.js';
import { uploadToCloudinary } from '../config/cloudinaryUpload.js';
import cloudinary from '../config/cloudinary.js';

export const authorRoute = exp.Router();

// Register author
authorRoute.post(
  '/users',
  upload.single("profilePic"),
  async (req, res, next) => {
    let cloudinaryResult;
    try {
      let userObj = req.body;

      // Upload profile image if provided
      if (req.file) {
        cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      }

      const newUserObj = await register({
        ...userObj,
        role: "AUTHOR",
        profileImageUrl: cloudinaryResult?.secure_url
      });

      res.status(201).json({ message: "Author registered Successfully", payload: newUserObj });
    } catch (err) {
      // Rollback cloudinary upload if registration fails
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      }
      next(err);
    }
  }
)

// Create article
authorRoute.post('/articles', verifyToken("AUTHOR"), checkAuthor, async (req, res, next) => {
  try {
    let article = req.body;
    article.author = req.author._id;
    let newArticleDoc = new ArticleModel(article);
    let createdArticle = await newArticleDoc.save();
    res.status(201).json({ message: "Article created successfully", payload: createdArticle });
  } catch (err) {
    next(err);
  }
})

// Read all articles of logged-in author
authorRoute.get('/articles', verifyToken("AUTHOR"), checkAuthor, async (req, res, next) => {
  try {
    let aId = req.author._id;
    let articles = await ArticleModel.find({ author: aId })
      .populate('author', 'username profileImageUrl')
      .sort({ updatedAt: -1 });
    res.status(200).json({ message: "Articles of author", payload: articles });
  } catch (err) {
    next(err);
  }
})

// Get single article by ID
authorRoute.get('/articles/:id', verifyToken("AUTHOR"), checkAuthor, async (req, res, next) => {
  try {
    let article = await ArticleModel.findById(req.params.id)
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

// Update article
authorRoute.put('/articles', verifyToken("AUTHOR"), checkAuthor, async (req, res, next) => {
  try {
    let { articleId, title, content, category } = req.body;
    let authorId = req.author._id;

    // Verify ownership
    let article = await ArticleModel.findOne({ _id: articleId, author: authorId });
    if (!article) {
      return res.status(404).json({ message: "Article not found or you are not authorized" });
    }

    let updatedArticle = await ArticleModel.findByIdAndUpdate(
      articleId,
      { $set: { title, content, category } },
      { new: true }
    );

    res.status(200).json({ message: "Article updated successfully", payload: updatedArticle });
  } catch (err) {
    next(err);
  }
})

// Soft delete / restore article
authorRoute.patch("/articles/:id/status", verifyToken("AUTHOR"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isArticleActive } = req.body;

    const article = await ArticleModel.findById(id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Author can only modify their own articles
    if (article.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden. You can only modify your own articles" });
    }

    if (article.isArticleActive === isArticleActive) {
      return res.status(400).json({
        message: `Article is already ${isArticleActive ? "active" : "deleted"}`,
      });
    }

    article.isArticleActive = isArticleActive;
    await article.save();

    res.status(200).json({
      message: `Article ${isArticleActive ? "restored" : "deleted"} successfully`,
      payload: article
    });
  } catch (err) {
    next(err);
  }
});

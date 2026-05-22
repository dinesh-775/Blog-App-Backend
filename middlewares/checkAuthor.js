import { UserTypeModel } from "../Models/UserModel.js";
export const checkAuthor = async (req, res, next) => {
    try {
        // Get author id from body, params, or authenticated user
        let authorid = req.body?.author || req.params.authorId || req.user?.userId;

        if (!authorid) {
            return res.status(400).json({ message: "Author ID is required" });
        }

        // Verify author 
        let author = await UserTypeModel.findById(authorid);

        if (!author || author.role !== "AUTHOR") {
            return res.status(401).json({ message: "Invalid Author" });
        }

        if (!author.isActive) {
            return res.status(403).json({ message: "Author account is not active" });
        }

        req.author = author;
        next();
    } catch (err) {
        next(err);
    }
};
import cloudinary from "./cloudinary.js";

export const uploadToCloudinary = (buffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "blog_users" },
                (err, result) => {
                if (err) {
                    console.error("Cloudinary upload error:", err);
                    return reject(err);
                }
                resolve(result);
                }
            );
            stream.end(buffer);
        });
        };

        //interview question: what are used before promises are introduced?
        //answer: callbacks
        //why promises are introduced?
        //answer: callbacks are used to handle asynchronous operations, but they can lead to callback hell, which is a situation where the code becomes difficult to read and maintain due to nested callbacks. Promises were introduced to solve this problem by providing a more structured way to handle asynchronous operations.    
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config(); // Load env vars before Cloudinary reads them

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

export default cloudinary;
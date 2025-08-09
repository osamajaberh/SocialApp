import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.multer.js";
import multer from "multer";

export const cloudinaryUpload = (folderType = "general", allowedCategories = ["image"]) => {
  const fileTypes = {
    image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    pdf: ["application/pdf"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    video: ["video/mp4", "video/mpeg"]
  };

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const userId = req.loggedInUser?._id;
      const appName = process.env.APP_NAME || "SocialApp";
      
      // ✅ Correct usage of folderType here
      const folder = `${appName}/user/${userId}/${folderType}`;

      const allowedFormats = allowedCategories.flatMap(cat => {
        const mimes = fileTypes[cat] || [];
        return mimes.map(mime => mime.split("/")[1]);
      });

      return {
        folder,
        allowed_formats: allowedFormats
      };
    }
  });

  function fileFilter(req, file, cb) {
    const validMimes = allowedCategories.flatMap(cat => fileTypes[cat] || []);
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  }

  return multer({ storage, fileFilter });
};
